# Deployment Guide

## Security First

The API tokens that were pasted into chat must be revoked and regenerated before deployment. Never store real tokens in this repository.

## Required Environment Variables

Set these in your local shell before running the bootstrap script:

```bash
GITHUB_API_TOKEN="..."
CLOUDFLARE_API_TOKEN="..."
CLOUDFLARE_ACCOUNT_ID="..."
CLOUDFLARE_ZONE_ID="..."
DOMAIN_NAME="all-manuals.ru"
GEMINI_API_KEY="..."
SERPER_API_KEY="..."
PUBLIC_SITE_URL="https://all-manuals.ru"
PUBLIC_CONTACT_EMAIL="dmca@all-manuals.ru"
REPOSITORY_NAME="all-manuals"
REPOSITORY_PRIVATE="false"
```

`CLOUDFLARE_ACCOUNT_ID` is required for Cloudflare Pages project creation. The bootstrap script can try to discover it if the token has account read access, but setting it explicitly is more reliable.

## Local Checks

```bash
npm install
npm run typecheck
npm run build
npm run parser:weekly
```

Without `SERPER_API_KEY` and `GEMINI_API_KEY`, the parser exits safely without publishing generated articles.

## Bootstrap Deployment

```bash
npm run bootstrap:deploy
```

The script creates or reuses the GitHub repository, pushes the current code, configures GitHub Actions secrets, creates or reuses a Cloudflare Pages project, attaches the custom domain, updates DNS, and enables basic HTTPS/security settings.

## Weekly Parser

The workflow `.github/workflows/weekly-parser.yml` runs every Sunday at midnight UTC and can also be started manually from GitHub Actions.

Publication safeguards:

- At least 3 trusted sources are required.
- AI is instructed to use only fetched source excerpts.
- Existing articles are deduplicated by error ID, slug, title similarity, and solution hash.
- Images are disabled by default. Enable `PARSER_ALLOW_LICENSED_IMAGES=true` only if you accept the license checks and legal risk.

## Cloudflare Pages Settings

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

Production branch:

```bash
main
```
