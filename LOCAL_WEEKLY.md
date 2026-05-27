# Local Weekly Article Generation

Use this when you want to run content generation manually from your machine without committing secrets to the repository.

## 1. Create local env file

Create `.env.local` locally. It is ignored by git.

```bash
GEMINI_API_KEY="your-new-key"
GEMINI_MODEL="gemini-2.0-flash"
SERPER_API_KEY="optional-search-key"
GITHUB_API_TOKEN="optional-token-for-auto-push"
PARSER_QUERY_LIMIT="120"
PARSER_PUBLISH_THRESHOLD="0.72"
PARSER_ALLOW_LICENSED_IMAGES="false"
```

There is no Gemini model without limits. Free-tier models have quotas and rate limits, so increase `PARSER_QUERY_LIMIT` gradually.

## 2. Run weekly generation

```bash
npm run weekly:local
```

Useful options:

```bash
npm run weekly:local -- --limit=40
npm run weekly:local -- --offset=400
npm run weekly:local -- --queries="Steam disk write error fix|Valorant VAN 1067 fix"
npm run weekly:local -- --no-push
```

The script runs parser, typecheck and build. If content changed, it commits generated files and pushes unless `--no-push` is used.

## Safety Rules

- Articles are skipped unless enough trusted sources are found.
- AI is instructed to use only collected source excerpts.
- Images are disabled by default unless explicitly allowed.
- Existing content is deduplicated by error ID, title similarity and solution hash.
