import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

/**
 * Uploads everything in the local /site folder into the bucket, and
 * invalidates the CloudFront cache so changes show up immediately instead
 * of waiting for the cache TTL to expire.
 *
 * Run `cdk deploy` again any time you update site/index.html — this
 * resource picks up the new file automatically.
 */
export function deploySite(
  scope: Construct,
  bucket: s3.Bucket,
  distribution: cloudfront.Distribution
): s3deploy.BucketDeployment {
  return new s3deploy.BucketDeployment(scope, "SiteDeployment", {
    sources: [s3deploy.Source.asset("./site")],
    destinationBucket: bucket,
    distribution,
    distributionPaths: ["/*"],
  });
}
