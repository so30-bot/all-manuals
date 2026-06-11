import { absoluteUrl, SITE_NAME } from './seo';
import { categoryToSlug } from './slug';

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

type ListSchemaItem = {
  name: string;
  path: string;
  description?: string;
};

type CollectionPageSchemaInput = {
  name: string;
  description: string;
  path: string;
  items?: ListSchemaItem[];
};

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/')
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'ru-RU',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/search/')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildCollectionPageSchema({ name, description, path, items = [] }: CollectionPageSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: 'ru-RU',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/')
    },
    mainEntity: items.length
      ? {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            url: absoluteUrl(item.path),
            description: item.description || undefined
          }))
        }
      : undefined
  };
}

export function buildBreadcrumbListSchema(items: ListSchemaItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

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
    inLanguage: 'ru-RU',
    about: article.tags.map((tag) => ({ '@type': 'Thing', name: tag })),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: absoluteUrl('/')
    },
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

export function buildBreadcrumbSchema(article: ArticleData) {
  return buildBreadcrumbListSchema([
    { name: 'Главная', path: '/' },
    { name: article.category, path: `/categories/${categoryToSlug(article.category)}/` },
    { name: article.title, path: `/errors/${article.slug}/` }
  ]);
}
