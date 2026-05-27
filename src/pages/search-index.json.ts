import { getCollection } from 'astro:content';

export async function GET() {
  const articles = (await getCollection('errors')).filter((article) => !article.data.draft);
  const index = articles.map((article) => ({
    title: article.data.title,
    slug: article.id,
    description: article.data.description,
    category: article.data.category,
    tags: article.data.tags,
    errorId: article.data.errorId || ''
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
