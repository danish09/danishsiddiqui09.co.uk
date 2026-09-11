import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";

/**
 * The TLS certificate CloudFront will present for the custom domain.
 *
 * CloudFront only accepts certificates from us-east-1, regardless of which
 * region the rest of the stack runs in — so this whole stack is deployed
 * in us-east-1 (see bin/portfolio-site.ts) rather than dealing with a
 * cross-region reference for just this one resource.
 *
 * Validation is automatic: CDK creates the DNS validation records in the
 * hosted zone for you, since we pass it the zone.
 */
export function createCertificate(
  scope: Construct,
  domainName: string,
  hostedZone: route53.IHostedZone
): acm.Certificate {
  return new acm.Certificate(scope, "SiteCertificate", {
    domainName,
    validation: acm.CertificateValidation.fromDns(hostedZone),
  });
}
