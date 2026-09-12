# Project context (handoff from claude.ai chat)

This file exists because Claude Code and claude.ai chat don't currently
share memory automatically. Claude Code reads this file at the start of
every session, so it picks up the context below without you re-explaining.

## What this project is

Personal portfolio website for Danish Siddiqui — deployed to AWS via CDK.
Domain: `danishsiddiqui09.co.uk`. Repo (public):
https://github.com/danish09/danishsiddiqui09.co.uk

## Design decisions already made

- Went with **Direction 1 — "Systems Blueprint"**: dark navy background,
  a career-timeline diagram in the hero (nodes = job transitions, connected
  by a line), Space Grotesk for headings, IBM Plex Mono for
  labels/data. Signal-blue (#5FA8E0) + warm amber (#C98A3E) accents.
- Two other directions were explored and rejected for the primary site:
  "Executive Minimal" (warm/serif, more conservative) and "Terminal"
  (command-line styled, amber-on-black) — Terminal's aesthetic was folded
  in as a small accent (see below), not used as the main direction.
- Content is pulled directly from the CV — do not invent metrics,
  dates, or project details not already present in `site/index.html`.

## Infrastructure decisions already made

- **CDK (TypeScript), fully modular**: one AWS resource per file under
  `resources/`, `lib/portfolio-site-stack.ts` only composes them — it
  defines no resources itself. Keep this pattern for anything added later.
- **S3 bucket is fully private** — CloudFront reads it via Origin Access
  Control (OAC), not a public bucket policy. This was a deliberate choice
  over the "public bucket" approach from an earlier manual walkthrough.
- **Split into two stacks by region**: `CertificateStack` (`us-east-1`) holds
  only the ACM certificate — CloudFront requires certs from that region
  specifically, nothing else does. `PortfolioSiteStack` (`eu-west-2`, our
  home region) holds the bucket, CloudFront, DNS record, and deployment,
  and takes the certificate in as a prop. Linked via CDK's
  `crossRegionReferences: true` (auto-provisions an SSM parameter + custom
  resource to carry the cert ARN across the region boundary) rather than
  manual SSM plumbing. Both regions are bootstrapped. Earlier version of
  this stack deployed everything to `us-east-1`; that was changed once we
  confirmed only the certificate actually needs to be there — splitting
  regions avoids paying an unnecessary regional cost for no benefit, at
  the price of one cross-region reference.
- **Assumes a Route 53 hosted zone already exists** for the domain.
- A bucket was previously created manually with the same name as the
  domain — decision was to delete it and let CDK own the bucket
  entirely, rather than importing it. If you see bucket-name conflicts,
  that's why — confirm the manual bucket is actually deleted.

## CI/CD decisions already made

- **`main` is protected via a GitHub Ruleset** (not classic branch
  protection — classic couldn't require a PR without also requiring a
  reviewer, which deadlocks a solo repo): requires a PR before merging,
  requires the `build` status check (from `.github/workflows/ci.yml`,
  `npm ci` + `npm run build`) to pass, and applies to admins too — no
  bypass for anyone, including the repo owner.
- The **merge itself is a manual action performed by Danish**, not
  automated — checks passing only unlocks the merge button, it doesn't
  trigger auto-merge.
- AWS access uses **IAM Identity Center (SSO)**, no long-lived access keys
  stored on disk anywhere.
- **GitHub Actions → AWS via OIDC**, no long-lived keys in GitHub Secrets
  either. `PortfolioOidcStack` (its own stack — see `lib/github-oidc-stack.ts`
  for why) creates the OIDC provider plus two roles, each scoped to
  `sts:AssumeRole` on the CDK bootstrap roles (`cdk-hnb659fds-*`) in both
  deploy regions, not granted AWS service permissions directly:
  - `github-actions-diff` — read-only (can only assume the bootstrap
    `lookup-role`), trusted only from `pull_request` runs. Gated behind
    the `aws-diff` GitHub Environment (required reviewer: danish09) since
    the repo is public and this trust condition matches PRs from forks
    too.
  - `github-actions-deploy` — trusted only from pushes to `main`. Can
    assume `deploy-role`/`file-publishing-role`/`image-publishing-role`/
    `lookup-role`.
  - Both roles have an 8-hour session cap (raised from CDK's 1-hour
    default — a slow CloudFront/ACM deploy could otherwise expire
    mid-run).
  - `PortfolioOidcStack` is deployed manually only, via SSO credentials —
    `.github/workflows/deploy.yml` deliberately names
    `PortfolioCertificateStack PortfolioSiteStack` rather than `--all`,
    so CI can never deploy the stack that defines its own permissions.

## Still open / not yet decided

- Whether to add more sections/projects to the site beyond the current
  single AI project entry.
- Whether to script the "hosted zone already exists" assumption away
  (i.e. add a variant resource file for creating the zone from scratch).
- The `aws-diff` GitHub Environment has `can_admins_bypass: true` by
  default (GitHub API behavior, not something we set) — inconsistent with
  the "no bypass for anyone" stance on the branch Ruleset, though low
  stakes here since danish09 is both the only admin and the only
  reviewer. Not yet resolved.
