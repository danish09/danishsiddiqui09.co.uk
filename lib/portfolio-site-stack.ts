import { Construct } from "constructs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";

import { createSiteBucket } from "../resources/bucket";
import { lookupHostedZone } from "../resources/hosted-zone";
import { createCertificate } from "../resources/certificate";
import { createDistribution } from "../resources/cloudfront";
import { createDnsRecord } from "../resources/dns-record";
import { deploySite } from "../resources/deployment";

export interface PortfolioSiteStackProps extends StackProps {
  domainName: string;
}

/**
 * Composes the site's resources: bucket -> hosted zone -> certificate ->
 * distribution -> DNS record -> deployment.
 *
 * This stack file intentionally contains no resource definitions itself —
 * each piece lives in its own file under /resources, and this file just
 * wires them together in the right order (later resources need the
 * outputs of earlier ones, e.g. the distribution needs the certificate).
 */
export class PortfolioSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: PortfolioSiteStackProps) {
    super(scope, id, props);

    const { domainName } = props;

    const bucket = createSiteBucket(this, domainName);
    const hostedZone = lookupHostedZone(this, domainName);
    const certificate = createCertificate(this, domainName, hostedZone);
    const distribution = createDistribution(this, bucket, certificate, domainName);
    createDnsRecord(this, hostedZone, domainName, distribution);
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
