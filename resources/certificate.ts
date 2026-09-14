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
 *
 * Covers both the bare domain and `www.` — CloudFront rejects any request
 * whose hostname isn't on the certificate, so `www` has to be here even
 * though it only ever redirects (see resources/viewer-request-function.ts).
 * Note: ACM certificates are immutable, so changing the names here makes
 * CloudFormation issue a new certificate and swap it in (no downtime — the
 * old one is kept until the distribution has moved over).
 */
export function createCertificate(
  scope: Construct,
  domainName: string,
  hostedZone: route53.IHostedZone
): acm.Certificate {
  return new acm.Certificate(scope, "SiteCertificate", {
    domainName,
    subjectAlternativeNames: [`www.${domainName}`],
    validation: acm.CertificateValidation.fromDns(hostedZone),
  });
}
