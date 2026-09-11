#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { PortfolioSiteStack } from "../lib/portfolio-site-stack";

const app = new cdk.App();

const domainName: string = app.node.tryGetContext("domainName");
if (!domainName || domainName === "yourdomain.com") {
  throw new Error(
    "Set your real domain: either edit `context.domainName` in cdk.json, " +
      "or deploy with `cdk deploy -c domainName=yourdomain.com`"
  );
}

new PortfolioSiteStack(app, "PortfolioSiteStack", {
  domainName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // Must be us-east-1: CloudFront only accepts ACM certificates from
    // this region, and HostedZone.fromLookup needs an explicit region too.
    region: "us-east-1",
  },
});
