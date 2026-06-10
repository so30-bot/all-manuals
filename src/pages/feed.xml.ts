import { getCollection } from 'astro:content';
import { DEFAULT_DESCRIPTION, getSiteUrl, SITE_NAME } from '@/utils/seo';

const FEED_LIMIT = 100;

export async function GET() {
  const site = getSiteUrl().replace(/\/$/, '');
  const articles = (await getCollection('errors'))
    .filter((article) => !article.data.draft)
    .sort((a, b) => new Date(b.data.updatedAt).getTime() - new Date(a.data.updatedAt).getTime())
    .slice(0, FEED_LIMIT);
  const latestDate = articles[0]?.data.updatedAt || new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${site}/</link>
    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>
    <language>ru-RU</language>
    <lastBuildDate>${toRssDate(latestDate)}</lastBuildDate>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
${articles.map((article) => {
  const url = `${site}/errors/${article.id}/`;
  return `    <item>
      <title>${escapeXml(article.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.data.description)}</description>
      <category>${escapeXml(article.data.category)}</category>
      <pubDate>${toRssDate(article.data.updatedAt)}</pubDate>
    </item>`;
}).join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=1800',
    },
  });
}

function toRssDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
