import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";

/**
 * Looks up the existing Route 53 hosted zone for the domain.
 *
 * This assumes the domain's hosted zone already exists in this AWS account
 * (e.g. created when you registered/transferred the domain, or manually
 * created if you registered elsewhere and just pointed nameservers here).
 * fromLookup requires the stack's env (account + region) to be set
 * explicitly — see bin/portfolio-site.ts.
 */
export function lookupHostedZone(scope: Construct, domainName: string): route53.IHostedZone {
  return route53.HostedZone.fromLookup(scope, "HostedZone", {
    domainName,
  });
}
