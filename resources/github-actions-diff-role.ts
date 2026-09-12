import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * Assumed by GitHub Actions on pull_request runs (cdk diff). Deliberately
 * read-only: it can only assume the CDK bootstrap lookup-role (which
 * carries the AWS-managed ReadOnlyAccess policy) in each deploy region —
 * there is no path from here to sts:AssumeRole on the deploy-role. If a PR
 * workflow were ever tricked into running `cdk deploy`, this trust policy
 * blocks it outright, rather than relying on the workflow file alone.
 *
 * Trust is scoped to `environment:<githubEnvironment>`, NOT `pull_request` —
 * when a workflow job specifies `environment:`, GitHub replaces the OIDC
 * token's `sub` claim with the environment-scoped form instead of the
 * event-based one. This also means the required-reviewer gate on that
 * GitHub Environment is enforced by the trust policy itself, not just by
 * the workflow file.
 *
 * `githubSubjectPrefix` must be the exact `repo:OWNER@OWNER_ID/NAME@REPO_ID`
 * form GitHub actually issues (confirmed by decoding a real token) — GitHub
 * embeds the numeric owner/repo IDs to survive renames, not just the plain
 * `repo:OWNER/NAME` form the docs lead you to expect. See github-oidc-stack.ts.
 */
export function createGitHubActionsDiffRole(
  scope: Construct,
  provider: iam.IOpenIdConnectProvider,
  githubSubjectPrefix: string,
  githubEnvironment: string,
  lookupRoleArns: string[]
): iam.Role {
  const role = new iam.Role(scope, "GitHubActionsDiffRole", {
    roleName: "github-actions-diff",
    description: `Read-only - assumable only via the ${githubEnvironment} environment`,
    maxSessionDuration: Duration.hours(8),
    assumedBy: new iam.FederatedPrincipal(
      provider.openIdConnectProviderArn,
      {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": `${githubSubjectPrefix}:environment:${githubEnvironment}`,
        },
      },
      "sts:AssumeRoleWithWebIdentity"
    ),
  });

  role.addToPolicy(
    new iam.PolicyStatement({
      actions: ["sts:AssumeRole"],
      resources: lookupRoleArns,
    })
  );

  return role;
}
