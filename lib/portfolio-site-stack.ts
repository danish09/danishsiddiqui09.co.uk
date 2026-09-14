import { Construct } from "constructs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

import { createSiteBucket } from "../resources/bucket";
import { lookupHostedZone } from "../resources/hosted-zone";
import { createDistribution } from "../resources/cloudfront";
import { createDnsRecords } from "../resources/dns-record";
import { createViewerRequestFunction } from "../resources/viewer-request-function";
import { deploySite } from "../resources/deployment";

export interface PortfolioSiteStackProps extends StackProps {
  domainName: string;
  /** ACM certificate from CertificateStack (us-east-1) — see bin/portfolio-site.ts. */
  certificate: acm.ICertificate;
}

/**
 * Composes the site's resources: bucket -> hosted zone -> viewer-request
 * function -> distribution -> DNS records -> deployment. The ACM certificate is NOT created here — it
 * comes from CertificateStack via crossRegionReferences, since this stack
 * deploys to eu-west-2 while the certificate must live in us-east-1.
 *
 * This stack file intentionally contains no resource definitions itself —
 * each piece lives in its own file under /resources, and this file just
 * wires them together in the right order (later resources need the
 * outputs of earlier ones, e.g. the distribution needs the certificate).
 */
export class PortfolioSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: PortfolioSiteStackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const { domainName, certificate } = props;

    const bucket = createSiteBucket(this, domainName);
    const hostedZone = lookupHostedZone(this, domainName);
    const viewerRequest = createViewerRequestFunction(this, domainName);
    const distribution = createDistribution(this, bucket, certificate, domainName, viewerRequest);
    createDnsRecords(this, hostedZone, domainName, distribution);
    deploySite(this, bucket, distribution);

    new CfnOutput(this, "SiteUrl", {
      value: `https://${domainName}`,
      description: "Your live site URL",
    });

    new CfnOutput(this, "CloudFrontDomain", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain (useful for debugging DNS)",
    });
  }
}
