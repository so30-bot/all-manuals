import { getCollection } from 'astro:content';
import categories from '@/data/categories.json';
import { getSiteUrl } from '@/utils/seo';

export async function GET() {
  const site = getSiteUrl().replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const articles = (await getCollection('errors')).filter((article) => !article.data.draft);

  const staticPages = ['/', '/errors/', '/about/', '/search/', '/dmca/', '/privacy/', '/terms/'].map((path) => ({
    loc: `${site}${path}`,
    lastmod: today,
    priority: path === '/' ? '1.0' : '0.6',
    changefreq: path === '/' ? 'daily' : 'monthly'
  }));

  const categoryPages = categories.map((category) => ({
    loc: `${site}/categories/${category.slug}/`,
    lastmod: today,
    priority: '0.7',
    changefreq: 'weekly'
  }));

  const articlePages = articles.map((article) => ({
    loc: `${site}/errors/${article.id}/`,
    lastmod: article.data.updatedAt,
    priority: '0.9',
    changefreq: 'weekly'
  }));

  const urls = [...staticPages, ...categoryPages, ...articlePages];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
