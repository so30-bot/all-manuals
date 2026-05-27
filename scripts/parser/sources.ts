import type { ParserConfig, SourceCandidate } from './types';

const fallbackQueries = [
  'Windows Update error 0x80070002 fix last week',
  'npm ERR! enoent package.json fix',
  'Docker compose permission denied error fix',
  'Steam game failed to start error fix',
  'Linux apt lock error fix'
];

export async function discoverTrends(_config: ParserConfig): Promise<string[]> {
  const envQueries = process.env.PARSER_QUERIES?.split('|').map((query) => query.trim()).filter(Boolean);
  if (envQueries?.length) return envQueries;

  return fallbackQueries;
}

export async function searchSources(query: string, config: ParserConfig): Promise<SourceCandidate[]> {
  if (!config.serperApiKey) {
    console.warn(`SERPER_API_KEY is not set. Skipping live search for: ${query}`);
    return [];
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': config.serperApiKey,
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

export function isAllowedCandidate(candidate: SourceCandidate, config: ParserConfig): boolean {
  const domain = candidate.domain.replace(/^www\./, '');
  if (config.blockedDomains.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) return false;

  if (config.trustedDomains.length === 0) return true;
  return config.trustedDomains.some((trusted) => domain === trusted || domain.endsWith(`.${trusted}`));
}
