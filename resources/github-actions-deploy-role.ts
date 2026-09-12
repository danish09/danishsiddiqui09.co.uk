import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * Assumed by GitHub Actions only on pushes to `main` (i.e. after a PR has
 * gone through the required review process on the branch itself — this
 * role has no idea about that policy, it just trusts the ref). Can assume
 * the full set of CDK bootstrap roles needed to actually deploy: the
 * deploy-role, the asset-publishing roles, and the lookup-role (needed
 * for context lookups like the hosted zone during synth).
 */
export function createGitHubActionsDeployRole(
  scope: Construct,
  provider: iam.IOpenIdConnectProvider,
  githubRepo: string,
  deployableRoleArns: string[]
): iam.Role {
  const role = new iam.Role(scope, "GitHubActionsDeployRole", {
    roleName: "github-actions-deploy",
    description: `Deploy-capable - assumable only from pushes to main on ${githubRepo}`,
    maxSessionDuration: Duration.hours(8),
    assumedBy: new iam.FederatedPrincipal(
      provider.openIdConnectProviderArn,
      {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        StringLike: {
          "token.actions.githubusercontent.com:sub": `repo:${githubRepo}:ref:refs/heads/main`,
        },
      },
      "sts:AssumeRoleWithWebIdentity"
    ),
  });

  role.addToPolicy(
    new iam.PolicyStatement({
      actions: ["sts:AssumeRole"],
      resources: deployableRoleArns,
    })
  );

  return role;
}
