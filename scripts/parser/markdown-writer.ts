import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { CompiledArticle, ExistingArticle, ParserConfig } from './types';
import { buildDedupe, getArticleSlug } from './dedupe';
import { getReadingTime } from '../../src/utils/reading-time';

export async function writeArticle(article: CompiledArticle, duplicate: ExistingArticle | undefined, config: ParserConfig) {
  const slug = duplicate?.slug || getArticleSlug(article);
  const filePath = duplicate?.filePath || path.join(config.contentDir, `${slug}.mdx`);
  const today = new Date().toISOString().slice(0, 10);
  const dedupe = buildDedupe(article);
  const body = article.body?.trim() || 'Инструкция сформирована на основе проверенных источников. Перед применением изменений создайте резервную копию важных данных.';

  const frontmatter = {
    title: article.title,
    errorId: article.errorId,
    category: article.category,
    tags: article.tags,
    description: article.description,
    symptoms: article.symptoms,
    causes: article.causes,
    steps: article.steps,
    updatedAt: today,
    publishedAt: duplicate ? undefined : today,
    readingTime: getReadingTime([article.description, ...article.symptoms, ...article.causes, ...article.steps.map((step) => `${step.title} ${step.body}`), body].join(' ')),
    popularityScore: Math.max(40, Math.min(99, article.sources.length * 17 + article.steps.length * 4)),
    sources: article.sources,
    dedupe,
    draft: false
  };

  if (duplicate) {
    const current = matter(await fs.readFile(filePath, 'utf8'));
    frontmatter.publishedAt = current.data.publishedAt || today;
  }

  const serialized = matter.stringify(`${body.trim()}\n`, removeUndefined(frontmatter));
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, serialized, 'utf8');
  return { slug, filePath };
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
