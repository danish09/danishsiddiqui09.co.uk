#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CertificateStack } from "../lib/certificate-stack";
import { PortfolioSiteStack } from "../lib/portfolio-site-stack";
import { GitHubOidcStack } from "../lib/github-oidc-stack";

const app = new cdk.App();

const domainName: string = app.node.tryGetContext("domainName");
if (!domainName || domainName === "yourdomain.com") {
  throw new Error(
    "Set your real domain: either edit `context.domainName` in cdk.json, " +
      "or deploy with `cdk deploy -c domainName=yourdomain.com`"
  );
}

const account = process.env.CDK_DEFAULT_ACCOUNT;
if (!account) {
  throw new Error("CDK_DEFAULT_ACCOUNT is not set — is your AWS profile/SSO session active?");
}

// Certificate must live in us-east-1 — CloudFront only accepts ACM
// certificates from this region, regardless of where the rest of the
// site's resources deploy.
const certificateStack = new CertificateStack(app, "PortfolioCertificateStack", {
  domainName,
  env: { account, region: "us-east-1" },
});

// Everything else deploys to eu-west-2 (our home region) — only the
// certificate above is pinned to us-east-1 by CloudFront's constraint.
const siteStack = new PortfolioSiteStack(app, "PortfolioSiteStack", {
  domainName,
  certificate: certificateStack.certificate,
  env: { account, region: "eu-west-2" },
});

// Explicit for clarity — CDK would infer this anyway from the certificate
// reference above, but the dependency is worth stating outright.
siteStack.addStackDependency(certificateStack);

// CI/CD access for GitHub Actions — entirely independent of the site's
// stacks (no dependency either way). Deployed manually, once, by you —
// see lib/github-oidc-stack.ts for why this isn't part of the normal
// site deploy flow.
new GitHubOidcStack(app, "PortfolioOidcStack", {
  githubRepo: "danish09/danishsiddiqui09.co.uk",
  account,
  deployRegions: ["us-east-1", "eu-west-2"],
  env: { account, region: "eu-west-2" },
});
