import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

/**
 * The DNS record that actually points your domain at the site.
 *
 * An ALIAS A record (Route 53's extension of the A record) pointing
 * straight at the CloudFront distribution — no separate IP to manage,
 * and it updates automatically if the distribution's address ever changes.
 */
export function createDnsRecord(
  scope: Construct,
  hostedZone: route53.IHostedZone,
  domainName: string,
  distribution: cloudfront.Distribution
): route53.ARecord {
  return new route53.ARecord(scope, "SiteAliasRecord", {
    zone: hostedZone,
    recordName: domainName,
    target: route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(distribution)
    ),
  });
}
