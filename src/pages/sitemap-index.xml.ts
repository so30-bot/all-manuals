import { getCollection } from 'astro:content';
import { getSiteUrl } from '@/utils/seo';

export async function GET() {
  const site = getSiteUrl().replace(/\/$/, '');
  const articles = (await getCollection('errors')).filter((article) => !article.data.draft);
  const lastmod = getLatestDate(articles.map((article) => article.data.updatedAt));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${site}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}

function getLatestDate(values: string[]): string {
  return values.filter(Boolean).sort().at(-1) ?? new Date().toISOString().slice(0, 10);
}
