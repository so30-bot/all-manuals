# Local Weekly Article Generation

Use this when you want to run content generation manually from your machine without committing secrets to the repository.

## 1. Create local env file

Create `.env.local` locally. It is ignored by git.

```bash
AI_PROVIDER="ollama,gemini"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:7b"
GEMINI_API_KEY="optional-fallback-key"
GEMINI_MODEL="gemini-2.0-flash"
SERPER_API_KEY="optional-search-key"
GITHUB_API_TOKEN="optional-token-for-auto-push"
PARSER_QUERY_LIMIT="120"
PARSER_PUBLISH_THRESHOLD="0.72"
PARSER_ALLOW_LICENSED_IMAGES="false"
```

There is no cloud AI model without limits. For the most practical free option, run a local model with Ollama. It uses your computer instead of an API quota.

## Free Local AI With Ollama

Install Ollama from `https://ollama.com/download`, then run:

```bash
ollama pull qwen2.5:7b
ollama serve
```

Recommended models:

- `qwen2.5:7b`: good balance for Russian technical articles on 8-16 GB RAM.
- `qwen2.5:14b`: better quality, needs more RAM/VRAM.
- `llama3.1:8b`: good general fallback.

With Ollama, keep `.env.local` like this:

```bash
AI_PROVIDER="ollama,gemini"
OLLAMA_MODEL="qwen2.5:7b"
PARSER_QUERY_LIMIT="20"
```

If Ollama is not running, the parser will try the next configured provider.

## Optional Free-Tier Cloud Providers

You can also use free-tier APIs, but they still have rate limits:

```bash
AI_PROVIDER="openrouter,groq,gemini"
OPENROUTER_API_KEY="..."
OPENROUTER_MODEL="qwen/qwen-2.5-7b-instruct:free"
GROQ_API_KEY="..."
GROQ_MODEL="llama-3.1-8b-instant"
```

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
