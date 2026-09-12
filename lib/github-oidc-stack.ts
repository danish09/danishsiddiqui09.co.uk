import { Construct } from "constructs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";

import { createGitHubOidcProvider } from "../resources/github-oidc-provider";
import { createGitHubActionsDiffRole } from "../resources/github-actions-diff-role";
import { createGitHubActionsDeployRole } from "../resources/github-actions-deploy-role";

export interface GitHubOidcStackProps extends StackProps {
  /** e.g. "danish09/danishsiddiqui09.co.uk" */
  githubRepo: string;
  account: string;
  /** Every region the site's stacks deploy into — both need bootstrap-role access. */
  deployRegions: string[];
  /** CDK bootstrap qualifier — "hnb659fds" unless bootstrap was run with --qualifier. */
  qualifier?: string;
}

/**
 * CI/CD access for GitHub Actions — deployed manually, once, via your own
 * SSO credentials (not by CI itself, which is the whole point: CI can't
 * bootstrap its own access to AWS).
 *
 * Deliberately its own stack, separate from the site's stacks: this has a
 * different lifecycle (rarely changes, security-sensitive) and must exist
 * independently of them — `cdk destroy` on the site stacks should never be
 * able to touch GitHub's ability to deploy.
 *
 * Grants no AWS service permissions (S3, CloudFront, etc.) directly.
 * Instead, each role can only `sts:AssumeRole` into the CDK bootstrap
 * roles already created by `cdk bootstrap` in each region — the same
 * boundary CDK itself already defines and maintains.
 */
export class GitHubOidcStack extends Stack {
  constructor(scope: Construct, id: string, props: GitHubOidcStackProps) {
    super(scope, id, props);

    const { githubRepo, account, deployRegions, qualifier = "hnb659fds" } = props;

    const bootstrapRoleArn = (roleName: string, region: string): string =>
      `arn:aws:iam::${account}:role/cdk-${qualifier}-${roleName}-${account}-${region}`;

    const provider = createGitHubOidcProvider(this);

    const lookupRoleArns = deployRegions.map((region) => bootstrapRoleArn("lookup-role", region));

    const deployableRoleArns = deployRegions.flatMap((region) => [
      bootstrapRoleArn("deploy-role", region),
      bootstrapRoleArn("file-publishing-role", region),
      bootstrapRoleArn("image-publishing-role", region),
      bootstrapRoleArn("lookup-role", region),
    ]);

    const diffRole = createGitHubActionsDiffRole(this, provider, githubRepo, lookupRoleArns);
    const deployRole = createGitHubActionsDeployRole(this, provider, githubRepo, deployableRoleArns);

    new CfnOutput(this, "DiffRoleArn", {
      value: diffRole.roleArn,
      description: "Set as AWS_DIFF_ROLE_ARN in the repo's GitHub Actions variables",
    });

    new CfnOutput(this, "DeployRoleArn", {
      value: deployRole.roleArn,
      description: "Set as AWS_DEPLOY_ROLE_ARN in the repo's GitHub Actions variables",
    });
  }
}
