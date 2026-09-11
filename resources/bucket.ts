import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

/**
 * The origin bucket for the portfolio site.
 *
 * Kept fully private — CloudFront (via Origin Access Control, wired up in
 * resources/cloudfront.ts) is the only thing allowed to read from it.
 * There is no public bucket policy here on purpose: public access is
 * granted narrowly to the CloudFront distribution instead of to everyone,
 * which is the current AWS-recommended pattern over a public bucket policy.
 */
export function createSiteBucket(scope: Construct, domainName: string): s3.Bucket {
  return new s3.Bucket(scope, "SiteBucket", {
    bucketName: domainName,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    removalPolicy: RemovalPolicy.RETAIN, // keep the bucket (and its content) if the stack is ever destroyed
    autoDeleteObjects: false,
  });
}
