import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { compileArticle } from './ai-compiler';
import { getParserConfig } from './config';
import { findDuplicate, getArticleSlug, loadExistingArticles } from './dedupe';
import { extractReadableText } from './extractor';
import { fetchSource } from './fetchers';
import { processArticleImages } from './image-handler';
import { writeArticle } from './markdown-writer';
import { discoverTrends, searchSources } from './sources';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const BATCH_SIZE = 20;

function toEnglishQuery(query: string): string {
  const ruToEn: Record<string, string> = {
    'ошибка': 'error', 'исправить': 'fix', 'как исправить': 'how to fix',
    'не работает': 'not working', 'не запускается': 'not starting',
    'не включается': 'not turning on', 'не открывается': 'not opening',
    'не устанавливается': 'installation failed', 'не удаляется': 'cannot uninstall',
    'не обновляется': 'update failed', 'крашит': 'crash', 'вылетает': 'crash',
    'тормозит': 'slow', 'зависает': 'freeze', 'загрузка': 'boot',
    'не видит': 'not detected', 'не находит': 'not found',
    'не подключается': 'connection failed', 'ошибка подключения': 'connection error',
    'решение': 'solution', 'решения': 'solution', 'пошаговое решение': 'step by step fix',
    'код ошибки': 'error code', 'не сливает': 'not draining',
    'не отжимает': 'not spinning', 'не моет': 'not cleaning',
    'не греет': 'not heating', 'не морозит': 'not cooling',
    'течёт': 'leaking', 'шумит': 'noisy', 'вибрирует': 'vibrating',
    'не заряжается': 'not charging', 'не печатает': 'not printing',
    'нет изображения': 'no picture', 'нет звука': 'no sound',
    'чёрный экран': 'black screen', 'синий экран': 'blue screen',
    'bsod': 'BSOD', 'синий экран смерти': 'blue screen of death',
  };
  let en = query;
  for (const [ru, eng] of Object.entries(ruToEn)) {
    en = en.replace(new RegExp(ru, 'gi'), eng);
  }
  return en;
}

function gitCommit(message: string): boolean {
  try {
    execSync('git add src/content/errors/', { stdio: 'pipe' });
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!status.trim()) return false;
    execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
    execSync('git push', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

async function processQuery(query: string, config: ReturnType<typeof getParserConfig>, existing: Awaited<ReturnType<typeof loadExistingArticles>>): Promise<string | null> {
  const candidates = await searchSources(query, config);
  let fetchedDocs = candidates;

  if (candidates.length < config.minSources) {
    const enQuery = toEnglishQuery(query);
    if (enQuery !== query) {
      console.log(`  Only ${candidates.length} RU sources. Trying EN: "${enQuery.slice(0, 60)}..."`);
      await sleep(2000);
      const enCandidates = await searchSources(enQuery, config);
      if (enCandidates.length > candidates.length) {
        fetchedDocs = enCandidates;
      }
    }
  }

  if (fetchedDocs.length < config.minSources) {
    console.warn(`  SKIP: only ${fetchedDocs.length} candidate sources (need ${config.minSources})`);
    return null;
  }

  const fetched = (await Promise.all(fetchedDocs.slice(0, 8).map((candidate) => fetchSource(candidate, config))))
    .filter(Boolean)
    .map((document) => extractReadableText(document!))
    .filter((document) => document.text.length >= 800);

  if (fetched.length < config.minSources) {
    console.warn(`  SKIP: only ${fetched.length} sources with ≥800 chars text (need ${config.minSources})`);
    return null;
  }

  const compiled = await compileArticle(query, fetched.slice(0, 5), config);
  if (!compiled || compiled.steps.length === 0) return null;

  const duplicate = findDuplicate(compiled, existing);
  const slug = duplicate?.slug || getArticleSlug(compiled);
  const withImages = await processArticleImages(compiled, slug, config);
  const result = await writeArticle(withImages, duplicate, config);
  return result.slug;
}

async function main() {
  const config = getParserConfig();
  let existing = await loadExistingArticles(config);
  const queries = await discoverTrends(config);
  let totalWritten = 0;

  console.log(`Parser: ${queries.length} queries, batch size ${BATCH_SIZE}.`);

  for (let batchStart = 0; batchStart < queries.length; batchStart += BATCH_SIZE) {
    const batch = queries.slice(batchStart, batchStart + BATCH_SIZE);
    const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(queries.length / BATCH_SIZE);
    let batchWritten = 0;

    console.log(`\n--- Batch ${batchNum}/${totalBatches} (${batch.length} queries) ---`);

    for (let i = 0; i < batch.length; i++) {
      const query = batch[i];
      const globalIdx = batchStart + i;
      try {
        if (i > 0) await sleep(4000);
        console.log(`[${globalIdx + 1}/${queries.length}] ${query}`);
        const slug = await processQuery(query, config, existing);
        if (slug) {
          batchWritten++;
          totalWritten++;
          console.log(`  Created: ${slug}`);
        }
      } catch (error) {
        console.warn(`  Skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (batchWritten > 0) {
      console.log(`\nBatch ${batchNum}: ${batchWritten} articles. Committing...`);
      const committed = gitCommit(`auto: batch ${batchNum} - ${batchWritten} articles`);
      if (committed) {
        console.log('Committed and pushed.');
        existing = await loadExistingArticles(config);
      } else {
        console.log('Nothing to commit.');
      }
    } else {
      console.log(`Batch ${batchNum}: 0 articles.`);
    }
  }

  console.log(`\nDone. Total: ${totalWritten} articles generated.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
