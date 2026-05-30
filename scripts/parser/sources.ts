import type { ParserConfig, SourceCandidate } from './types';
import { buildDefaultQueries, getQueryCatalogSummary } from './query-catalog';
import * as cheerio from 'cheerio';

export async function discoverTrends(_config: ParserConfig): Promise<string[]> {
  const envQueries = process.env.PARSER_QUERIES?.split('|').map((query) => query.trim()).filter(Boolean);
  const queryLimit = Number(process.env.PARSER_QUERY_LIMIT || 60);
  const offset = Number(process.env.PARSER_QUERY_OFFSET || getWeeklyOffset(queryLimit));

  if (envQueries?.length) return rotateQueries(envQueries, offset, queryLimit);

  const queries = buildDefaultQueries();
  const summary = getQueryCatalogSummary();
  console.log(`Default query catalog: ${summary.totalQueries} queries across ${summary.groups.length} groups and ${summary.explicitErrorCodes} explicit error codes.`);
  return rotateQueries(queries, offset, queryLimit);
}

function rotateQueries(queries: string[], offset: number, limit: number): string[] {
  const unique = [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const safeLimit = Math.max(1, Math.min(limit, unique.length));
  const normalizedOffset = ((offset % unique.length) + unique.length) % unique.length;
  const rotated = [...unique.slice(normalizedOffset), ...unique.slice(0, normalizedOffset)];
  return rotated.slice(0, safeLimit);
}

function getWeeklyOffset(queryLimit: number): number {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const week = Math.floor(Date.now() / weekMs);
  return week * queryLimit;
}

export async function searchSources(query: string, config: ParserConfig): Promise<SourceCandidate[]> {
  const candidates: SourceCandidate[] = [];

  if (!config.serperApiKey) {
    console.warn(`SERPER_API_KEY is not set. Using open-source fallback search for: ${query}`);
  } else {
    candidates.push(...await searchSerper(query, config));
  }

  candidates.push(...await searchOpenSources(query, config));

  const filtered = dedupeCandidates(candidates).filter((item) => isAllowedCandidate(item, config));

  if (filtered.length < config.minSources && hasCyrillic(query)) {
    const enQuery = toEnglishQuery(query);
    if (enQuery) {
      console.warn(`Fallback to English query: "${enQuery}"`);
      const enCandidates = await searchOpenSources(enQuery, config);
      filtered.push(...enCandidates.filter((item) => isAllowedCandidate(item, config)));
    }
  }

  return dedupeCandidates(filtered);
}

function hasCyrillic(text: string): boolean {
  return /[а-яёА-ЯЁ]/.test(text);
}

function toEnglishQuery(text: string): string {
  const replacements: Record<string, string> = {
    'ошибка': 'error', 'как исправить': 'fix', 'решение': 'fix',
    'не запускается': 'not starting fix', 'не работает': 'not working fix',
    'не включается': 'won\'t turn on fix', 'не грузит': 'not loading fix',
    'крашит': 'crash fix', 'вылетает': 'crash fix', 'зависает': 'freeze fix',
    'тормозит': 'slow fix', 'шумит': 'noisy fix', 'течёт': 'leak fix',
    'не греет': 'not heating fix', 'не морозит': 'not cooling fix',
    'не сливает': 'not draining fix', 'не отжимает': 'not spinning fix',
    'не заряжается': 'not charging fix', 'искрит': 'sparking fix',
    'дымит': 'smoking fix', 'стучит': 'knocking fix', 'гудит': 'humming fix',
    'не видит': 'not detected fix', 'не подключается': 'connection failed fix',
    'после обновления': 'after update fix', 'ошибка на дисплее': 'error code',
    'код ошибки': 'error code', 'исправить': 'fix', 'починить': 'fix',
    'не открывается': 'won\'t open fix', 'пропал звук': 'no sound fix',
    'нет изображения': 'no display fix', 'мигает': 'flickering fix',
    'не реагирует': 'unresponsive fix', 'не читает': 'not reading fix'
  };

  let result = text.toLowerCase();
  for (const [ru, en] of Object.entries(replacements)) {
    result = result.replace(new RegExp(ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), en);
  }
  result = result.replace(/[а-яёА-ЯЁ]+/g, '').replace(/\s+/g, ' ').trim();
  return result;
}

async function searchSerper(query: string, config: ParserConfig): Promise<SourceCandidate[]> {
  const apiKey = config.serperApiKey;
  if (!apiKey) return [];

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: query,
      gl: 'ru',
      hl: 'ru',
      num: 10,
      tbs: 'qdr:w'
    })
  });

  if (!response.ok) {
    throw new Error(`Serper search failed with ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const organic = Array.isArray(data.organic) ? data.organic : [];

  return organic
    .map((item: { title?: string; link?: string; snippet?: string }) => {
      if (!item.link) return null;
      const url = new URL(item.link);
      return {
        title: item.title || url.hostname,
        url: url.toString(),
        snippet: item.snippet || '',
        domain: url.hostname.replace(/^www\./, '')
      } satisfies SourceCandidate;
    })
    .filter(Boolean)
    .filter((item: SourceCandidate) => isAllowedCandidate(item, config));
}

async function searchOpenSources(query: string, config: ParserConfig): Promise<SourceCandidate[]> {
  const results = await Promise.allSettled([
    searchDuckDuckGo(query),
    searchWikipedia(query, 'ru'),
    searchWikipedia(query, 'en'),
    searchGitHubIssues(query),
    searchStackExchange(query, 'stackoverflow'),
    searchStackExchange(query, 'superuser'),
    searchStackExchange(query, 'askubuntu'),
    searchStackExchange(query, 'gaming'),
    searchReddit(query)
  ]);

  return results
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .filter((item) => isAllowedCandidate(item, config));
}

async function searchDuckDuckGo(query: string): Promise<SourceCandidate[]> {
  try {
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}&gl=ru&kl=ru-ru&ia=web`;
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });
    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SourceCandidate[] = [];

    $('.result-link').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      try {
        const redirectUrl = new URL(href, 'https://duckduckgo.com');
        const rawUrl = redirectUrl.searchParams.get('uddg');
        if (!rawUrl) return;
        const actualUrl = decodeURIComponent(rawUrl);
        const parsed = new URL(actualUrl);
        const snippet = $(el).parent().find('.result-snippet').first().text().trim().slice(0, 240);
        results.push({
          title: $(el).text().trim() || parsed.hostname,
          url: parsed.toString(),
          snippet,
          domain: parsed.hostname.replace(/^www\./, '')
        });
      } catch { /* skip invalid URLs */ }
    });

    return results;
  } catch {
    return [];
  }
}

async function searchWikipedia(query: string, lang: string): Promise<SourceCandidate[]> {
  try {
    const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5&srprop=snippet`, {
      headers: { 'user-agent': 'AllManualsBot/0.1 (+https://all-manuals.ru/dmca/)' }
    });
    if (!response.ok) return [];
    const data = await response.json() as { query?: { search?: Array<{ title: string; snippet: string; pageid: number }> } };
    const pages = data.query?.search ?? [];
    return pages.map((page) => ({
      title: page.title,
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      snippet: stripHtml(page.snippet).slice(0, 240),
      domain: `${lang}.wikipedia.org`
    }));
  } catch {
    return [];
  }
}

async function searchGitHubIssues(query: string): Promise<SourceCandidate[]> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const searchQuery = `${query} in:title,body updated:>=${since}`;
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'AllManualsBot/0.1 (+https://all-manuals.ru/dmca/)'
  };

  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&sort=updated&order=desc&per_page=5`, { headers });
  if (!response.ok) return [];

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map((item: { title?: string; html_url?: string; body?: string }) => ({
    title: item.title || 'GitHub Issue',
    url: item.html_url || '',
    snippet: item.body?.slice(0, 240) || '',
    domain: 'github.com'
  })).filter((item: SourceCandidate) => item.url);
}

async function searchStackExchange(query: string, site: string): Promise<SourceCandidate[]> {
  const response = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=activity&pagesize=5&site=${encodeURIComponent(site)}&q=${encodeURIComponent(query)}`, {
    headers: { 'user-agent': 'AllManualsBot/0.1 (+https://all-manuals.ru/dmca/)' }
  });
  if (!response.ok) return [];

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map((item: { title?: string; link?: string; excerpt?: string }) => {
    if (!item.link) return null;
    const url = new URL(item.link);
    return {
      title: decodeHtml(item.title || url.hostname),
      url: url.toString(),
      snippet: item.excerpt ? stripHtml(item.excerpt).slice(0, 240) : '',
      domain: url.hostname.replace(/^www\./, '')
    } satisfies SourceCandidate;
  }).filter(Boolean);
}

async function searchReddit(query: string): Promise<SourceCandidate[]> {
  const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=5&type=link`, {
    headers: { 'user-agent': 'AllManualsBot/0.1 (+https://all-manuals.ru/dmca/)' }
  });
  if (!response.ok) return [];

  const data = await response.json();
  const children = Array.isArray(data.data?.children) ? data.data.children : [];

  return children.map((child: { data?: { title?: string; permalink?: string; selftext?: string } }) => {
    if (!child.data?.permalink) return null;
    const url = new URL(child.data.permalink, 'https://www.reddit.com');
    return {
      title: child.data.title || 'Reddit discussion',
      url: url.toString(),
      snippet: child.data.selftext?.slice(0, 240) || '',
      domain: 'reddit.com'
    } satisfies SourceCandidate;
  }).filter(Boolean);
}

function dedupeCandidates(candidates: SourceCandidate[]): SourceCandidate[] {
  const seen = new Set<string>();
  const deduped: SourceCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate.url || seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    deduped.push(candidate);
  }

  return deduped;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function isAllowedCandidate(candidate: SourceCandidate, config: ParserConfig): boolean {
  const domain = candidate.domain.replace(/^www\./, '');
  if (config.blockedDomains.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) return false;

  if (config.trustedDomains.length === 0) return true;
  return config.trustedDomains.some((trusted) => domain === trusted || domain.endsWith(`.${trusted}`));
}
