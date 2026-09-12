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
 */
export function createGitHubActionsDiffRole(
  scope: Construct,
  provider: iam.IOpenIdConnectProvider,
  githubRepo: string,
  lookupRoleArns: string[]
): iam.Role {
  const role = new iam.Role(scope, "GitHubActionsDiffRole", {
    roleName: "github-actions-diff",
    description: `Read-only - assumable only from pull_request runs against ${githubRepo}`,
    maxSessionDuration: Duration.hours(8),
    assumedBy: new iam.FederatedPrincipal(
      provider.openIdConnectProviderArn,
      {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        StringLike: {
          "token.actions.githubusercontent.com:sub": `repo:${githubRepo}:pull_request`,
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
