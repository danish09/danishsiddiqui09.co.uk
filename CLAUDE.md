# Project context (handoff from claude.ai chat)

This file exists because Claude Code and claude.ai chat don't currently
share memory automatically. Claude Code reads this file at the start of
every session, so it picks up the context below without you re-explaining.

## What this project is

Personal portfolio website for Danish Siddiqui (Infrastructure Engineering
Lead, pitching for Solutions Architect / senior infrastructure roles,
domain already registered) — deployed to AWS via CDK.

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
- **Whole stack deploys in us-east-1** — required because CloudFront only
  accepts ACM certificates from that region. Not the "natural" region
  choice, just a constraint.
- **Assumes a Route 53 hosted zone already exists** for the domain.
- A bucket was previously created manually with the same name as the
  domain — decision was to delete it and let CDK own the bucket
  entirely, rather than importing it. If you see bucket-name conflicts,
  that's why — confirm the manual bucket is actually deleted.

## Still open / not yet decided

- Whether to add more sections/projects to the site beyond the current
  single AI project entry.
- Whether to script the "hosted zone already exists" assumption away
  (i.e. add a variant resource file for creating the zone from scratch).
