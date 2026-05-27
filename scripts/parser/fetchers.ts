import robotsParser from 'robots-parser';
import type { ParserConfig, SourceCandidate, SourceDocument } from './types';

const robotCache = new Map<string, ReturnType<typeof robotsParser> | null>();

async function canFetch(url: string): Promise<boolean> {
  const parsed = new URL(url);
  const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

  if (!robotCache.has(robotsUrl)) {
    try {
      const response = await fetch(robotsUrl, { headers: { 'user-agent': 'AllManualsBot/0.1 (+https://all-manuals.ru/dmca/)' } });
      const text = response.ok ? await response.text() : '';
      robotCache.set(robotsUrl, robotsParser(robotsUrl, text));
    } catch {
      robotCache.set(robotsUrl, null);
    }
  }

  const robots = robotCache.get(robotsUrl);
  return robots ? robots.isAllowed(url, 'AllManualsBot') !== false : true;
}

export async function fetchSource(candidate: SourceCandidate, _config: ParserConfig): Promise<SourceDocument | null> {
  if (!(await canFetch(candidate.url))) {
    console.warn(`robots.txt disallows fetch: ${candidate.url}`);
    return null;
  }

  const response = await fetch(candidate.url, {
    headers: {
      'user-agent': 'AllManualsBot/0.1 (+https://all-manuals.ru/dmca/)',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5'
    }
  });

  if (!response.ok) {
    console.warn(`Source fetch failed ${response.status}: ${candidate.url}`);
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    console.warn(`Unsupported source content type ${contentType}: ${candidate.url}`);
    return null;
  }

  const html = await response.text();
  return {
    ...candidate,
    text: html,
    accessedAt: new Date().toISOString().slice(0, 10)
  };
}
