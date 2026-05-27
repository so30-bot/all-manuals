# All Manuals Error Knowledge Base

Static Astro website for SEO-friendly computer and software error solutions with a weekly content update bot.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run typecheck
npm run build
```

## Weekly Parser

```bash
npm run parser:weekly
```

The parser refuses to publish articles unless it has enough source material and passes deduplication. AI generation is constrained to collected source excerpts only.

The default parser catalog contains a large rotating set of queries for games, launchers, Windows, Linux, macOS, mobile devices, desktop software, developer tools, networking, peripherals, consoles and smart-home devices. Use `PARSER_QUERY_LIMIT` to control how many candidates are processed per run. If `SERPER_API_KEY` is not configured, the parser falls back to GitHub Issues, StackExchange sites and Reddit search.

## Deployment Bootstrap

```bash
npm run bootstrap:deploy
```

Required variables are listed in `.env.example`. Do not commit API tokens or private keys.

See `DEPLOYMENT.md` for the full deployment checklist.

## Legal And Privacy

The site does not use cookies, server-side user tracking, or feedback forms. Article feedback is stored in the visitor's browser only via localStorage.
