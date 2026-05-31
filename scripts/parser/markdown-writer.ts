import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { CompiledArticle, ExistingArticle, ParserConfig } from './types';
import { buildDedupe, getArticleSlug } from './dedupe';
import { getReadingTime } from '../../src/utils/reading-time';

const SAFE_TAGS = new Set([
  'br', 'hr', 'p', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
  'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'sup', 'sub',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'details', 'summary', 'mark', 'span', 'div', 'kbd', 'abbr'
]);

function sanitizeMdx(text: string): string {
  return text.replace(/<([a-zA-Z][a-zA-Z0-9]*)>/g, (match, tag) => {
    if (SAFE_TAGS.has(tag.toLowerCase())) return match;
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
}

export async function writeArticle(article: CompiledArticle, duplicate: ExistingArticle | undefined, config: ParserConfig) {
  const slug = duplicate?.slug || getArticleSlug(article);
  const filePath = duplicate?.filePath || path.join(config.contentDir, `${slug}.mdx`);
  const today = new Date().toISOString().slice(0, 10);
  const dedupe = buildDedupe(article);
  const rawBody = article.body?.trim() || 'Инструкция сформирована на основе проверенных источников. Перед применением изменений создайте резервную копию важных данных.';
  const body = sanitizeMdx(rawBody);

  const sanitizedSteps = article.steps.map((step) => ({
    ...step,
    title: sanitizeMdx(step.title),
    body: sanitizeMdx(step.body),
  }));

  const frontmatter = {
    title: article.title,
    errorId: article.errorId,
    category: article.category,
    tags: article.tags,
    description: article.description,
    symptoms: article.symptoms,
    causes: article.causes,
    steps: sanitizedSteps,
    updatedAt: today,
    publishedAt: duplicate ? undefined : today,
    readingTime: getReadingTime([article.description, ...article.symptoms, ...article.causes, ...sanitizedSteps.map((step) => `${step.title} ${step.body}`), body].join(' ')),
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
