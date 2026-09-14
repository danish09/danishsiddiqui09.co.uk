import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

/**
 * The CloudFront distribution in front of the S3 bucket.
 *
 * Uses Origin Access Control (OAC) so the bucket itself can stay fully
 * private — CloudFront is granted read access directly, rather than the
 * bucket needing a public-read policy.
 *
 * Answers for both the bare domain and `www.` (CloudFront returns 403 for
 * any Host it isn't explicitly told about), with `wwwRedirect` turning the
 * latter into a 301 to the former before anything is served.
 */
export function createDistribution(
  scope: Construct,
  bucket: s3.Bucket,
  certificate: acm.ICertificate,
  domainName: string,
  wwwRedirect: cloudfront.Function
): cloudfront.Distribution {
  return new cloudfront.Distribution(scope, "SiteDistribution", {
    defaultRootObject: "index.html",
    domainNames: [domainName, `www.${domainName}`],
    certificate,
    defaultBehavior: {
      origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      functionAssociations: [
        {
          function: wwwRedirect,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        },
      ],
    },
    errorResponses: [
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
      },
    ],
  });
}
