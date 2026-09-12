import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * The OIDC identity provider that lets GitHub Actions authenticate to AWS
 * using short-lived, per-workflow-run tokens instead of long-lived access
 * keys stored as GitHub Secrets.
 *
 * An AWS account can only have one OIDC provider per issuer URL. If
 * `cdk deploy` fails here with "already exists", a provider for
 * token.actions.githubusercontent.com already exists in this account (e.g.
 * from another project) — import it instead via
 * `iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn`.
 */
export function createGitHubOidcProvider(scope: Construct): iam.OpenIdConnectProvider {
  return new iam.OpenIdConnectProvider(scope, "GitHubOidcProvider", {
    url: "https://token.actions.githubusercontent.com",
    clientIds: ["sts.amazonaws.com"],
  });
}
