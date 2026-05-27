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

## Deployment Bootstrap

```bash
npm run bootstrap:deploy
```

Required variables are listed in `.env.example`. Do not commit API tokens or private keys.

See `DEPLOYMENT.md` for the full deployment checklist.

## Legal And Privacy

The site does not use cookies, server-side user tracking, or feedback forms. Article feedback is stored in the visitor's browser only via localStorage.
