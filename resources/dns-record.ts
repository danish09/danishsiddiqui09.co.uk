import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

/**
 * The DNS records that actually point your domain at the site.
 *
 * ALIAS A records (Route 53's extension of the A record) pointing straight
 * at the CloudFront distribution — no separate IP to manage, and they update
 * automatically if the distribution's address ever changes.
 *
 * Both the bare domain and `www.` point at the same distribution; the
 * redirect from one to the other happens inside CloudFront, not in DNS
 * (DNS can only say "where", never "go somewhere else instead").
 */
export function createDnsRecords(
  scope: Construct,
  hostedZone: route53.IHostedZone,
  domainName: string,
  distribution: cloudfront.Distribution
): route53.ARecord[] {
  const target = route53.RecordTarget.fromAlias(
    new targets.CloudFrontTarget(distribution)
  );
  return [
    new route53.ARecord(scope, "SiteAliasRecord", {
      zone: hostedZone,
      recordName: domainName,
      target,
    }),
    new route53.ARecord(scope, "WwwAliasRecord", {
      zone: hostedZone,
      recordName: `www.${domainName}`,
      target,
    }),
  ];
}
