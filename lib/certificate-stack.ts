import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

import { lookupHostedZone } from "../resources/hosted-zone";
import { createCertificate } from "../resources/certificate";

export interface CertificateStackProps extends StackProps {
  domainName: string;
}

/**
 * Holds just the ACM certificate — deployed to us-east-1 because CloudFront
 * only accepts certificates from that region, regardless of which region
 * the rest of the site's resources live in (see PortfolioSiteStack, which
 * deploys to eu-west-2).
 *
 * `crossRegionReferences: true` lets PortfolioSiteStack consume this
 * stack's certificate output across the region boundary — CDK provisions
 * an SSM parameter + custom resource behind the scenes to carry the value
 * from us-east-1 into eu-west-2, instead of the usual same-region
 * Fn::ImportValue mechanism, which can't cross regions.
 */
export class CertificateStack extends Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    const { domainName } = props;

    const hostedZone = lookupHostedZone(this, domainName);
    this.certificate = createCertificate(this, domainName, hostedZone);
  }
}
