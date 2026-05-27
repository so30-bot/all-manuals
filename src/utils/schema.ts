import { absoluteUrl, SITE_NAME } from './seo';

type ArticleData = {
  title: string;
  description: string;
  slug: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  steps: Array<{
    title: string;
    body: string;
    image?: { src: string; alt: string } | null;
  }>;
};

export function buildArticleSchema(article: ArticleData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: absoluteUrl(`/errors/${article.slug}/`),
    articleSection: article.category,
    keywords: article.tags.join(', '),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: absoluteUrl('/')
    }
  };
}

export function buildHowToSchema(article: ArticleData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: article.title,
    description: article.description,
    step: article.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.body,
      image: step.image?.src ? absoluteUrl(step.image.src) : undefined
    }))
  };
}
