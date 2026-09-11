# Portfolio Site — CDK Stack

Deploys the portfolio site to S3 + CloudFront + Route 53, with HTTPS via ACM.

## Structure

```
bin/portfolio-site.ts        # App entry point — sets domain, forces us-east-1
lib/portfolio-site-stack.ts  # Composes the resources below, in dependency order
resources/
  bucket.ts                  # S3 origin bucket (private)
  hosted-zone.ts             # Looks up your existing Route 53 hosted zone
  certificate.ts             # ACM certificate (DNS-validated)
  cloudfront.ts               # CloudFront distribution (Origin Access Control)
  dns-record.ts                # Route 53 alias record -> CloudFront
  deployment.ts                 # Uploads /site and invalidates the CDN cache
site/index.html                 # The actual site content
```

Each file under `resources/` defines exactly one AWS resource (or a tightly
related pair) and exports a single function that creates it. `lib/portfolio-site-stack.ts`
contains no resource definitions itself — it just calls each function in the
right order and wires outputs into inputs.

## Prerequisites

- A Route 53 hosted zone must already exist for your domain in this AWS
  account. If your domain is registered elsewhere, you can still create a
  hosted zone in Route 53 and update your registrar's nameservers to point
  to it — the stack itself doesn't care where the domain was purchased,
  only that a hosted zone exists here.
- Node.js and the AWS CLI configured with credentials for your account.

## Setup

```bash
npm install
cdk bootstrap   # first time only, per account/region
```

Set your real domain, either:
- edit `context.domainName` in `cdk.json`, or
- pass it at deploy time: `cdk deploy -c domainName=yourdomain.com`

## Deploy

```bash
cdk deploy
```

First deploy takes a while — ACM DNS validation and the initial CloudFront
distribution creation both take several minutes. Subsequent deploys (e.g.
after editing `site/index.html`) are much faster and will automatically
invalidate the CloudFront cache.

## Updating the site content

Just edit `site/index.html` and run `cdk deploy` again — the deployment
resource picks up the change and invalidates the cache automatically.
