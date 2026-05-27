import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { CompiledArticle, ExistingArticle, ParserConfig } from './types';
import { jaccardSimilarity, sha256 } from './hash';
import { slugify } from '../../src/utils/slug';

export async function loadExistingArticles(config: ParserConfig): Promise<ExistingArticle[]> {
  await fs.mkdir(config.contentDir, { recursive: true });
  const files = await fs.readdir(config.contentDir);
  const articles: ExistingArticle[] = [];

  for (const file of files.filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))) {
    const filePath = path.join(config.contentDir, file);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);
    articles.push({
      filePath,
      title: String(parsed.data.title || ''),
      slug: String(parsed.data.slug || file.replace(/\.mdx?$/, '')),
      errorId: parsed.data.errorId ? String(parsed.data.errorId) : undefined,
      category: String(parsed.data.category || ''),
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
      dedupe: parsed.data.dedupe
    });
  }

  return articles;
}

export function getArticleSlug(article: CompiledArticle): string {
  const base = [article.category, article.errorId, article.title].filter(Boolean).join(' ');
  return slugify(base).replace(/-{2,}/g, '-');
}

export function buildDedupe(article: CompiledArticle) {
  const solutionText = article.steps.map((step) => `${step.title}\n${step.body}\n${step.command || ''}`).join('\n---\n');
  const sourceText = article.sources.map((source) => source.url).sort().join('\n');

  return {
    titleHash: sha256(article.title),
    solutionHash: sha256(solutionText),
    sourceHash: sha256(sourceText)
  };
}

export function findDuplicate(article: CompiledArticle, existing: ExistingArticle[]) {
  const slug = getArticleSlug(article);
  const dedupe = buildDedupe(article);

  return existing.find((entry) => {
    if (entry.slug === slug) return true;
    if (article.errorId && entry.errorId && article.errorId.toLowerCase() === entry.errorId.toLowerCase()) return true;
    if (entry.dedupe?.titleHash === dedupe.titleHash || entry.dedupe?.solutionHash === dedupe.solutionHash) return true;
    return jaccardSimilarity(entry.title, article.title) >= 0.86;
  });
}
