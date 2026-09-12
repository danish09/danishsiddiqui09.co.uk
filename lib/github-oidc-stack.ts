import { Construct } from "constructs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";

import { createGitHubOidcProvider } from "../resources/github-oidc-provider";
import { createGitHubActionsDiffRole } from "../resources/github-actions-diff-role";
import { createGitHubActionsDeployRole } from "../resources/github-actions-deploy-role";

export interface GitHubOidcStackProps extends StackProps {
  /** e.g. "danish09" */
  githubRepoOwner: string;
  /** GitHub's numeric user/org ID for githubRepoOwner — see note below. */
  githubRepoOwnerId: string;
  /** e.g. "danishsiddiqui09.co.uk" */
  githubRepoName: string;
  /** GitHub's numeric repo ID for githubRepoName — see note below. */
  githubRepoId: string;
  account: string;
  /** Every region the site's stacks deploy into — both need bootstrap-role access. */
  deployRegions: string[];
  /** CDK bootstrap qualifier — "hnb659fds" unless bootstrap was run with --qualifier. */
  qualifier?: string;
  /** GitHub Environment name gating the diff role (must already exist — created via API, not CDK). */
  diffGithubEnvironment: string;
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
 *
 * Why githubRepoOwnerId / githubRepoId exist: GitHub's OIDC `sub` claim is
 * NOT the plain `repo:OWNER/NAME` form the docs show — it's
 * `repo:OWNER@OWNER_ID/NAME@REPO_ID`, embedding the numeric, immutable
 * owner and repo IDs so a trust policy can't be hijacked by renaming or
 * transferring a repo to reuse an old name. Confirmed by decoding a real
 * token from this repo's own Actions run rather than trusting the docs —
 * get these values via `gh api users/<owner> --jq .id` and
 * `gh api repos/<owner>/<repo> --jq .id`.
 */
export class GitHubOidcStack extends Stack {
  constructor(scope: Construct, id: string, props: GitHubOidcStackProps) {
    super(scope, id, props);

    const {
      githubRepoOwner,
      githubRepoOwnerId,
      githubRepoName,
      githubRepoId,
      account,
      deployRegions,
      qualifier = "hnb659fds",
      diffGithubEnvironment,
    } = props;

    const githubSubjectPrefix = `repo:${githubRepoOwner}@${githubRepoOwnerId}/${githubRepoName}@${githubRepoId}`;

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

    const diffRole = createGitHubActionsDiffRole(
      this,
      provider,
      githubSubjectPrefix,
      diffGithubEnvironment,
      lookupRoleArns
    );
    const deployRole = createGitHubActionsDeployRole(this, provider, githubSubjectPrefix, deployableRoleArns);

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
