import fs from 'node:fs';
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

async function main() {
  const config = getParserConfig();
  const existing = await loadExistingArticles(config);
  const queries = await discoverTrends(config);
  const written: string[] = [];

  console.log(`Weekly parser will process ${queries.length} query candidates.`);

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    try {
      if (i > 0) await sleep(3000);
      console.log(`[${i + 1}/${queries.length}] Processing query: ${query}`);
      const candidates = await searchSources(query, config);
      if (candidates.length < config.minSources) {
        console.warn(`Skipped ${query}: only ${candidates.length} trusted candidates found.`);
        continue;
      }

      const fetched = (await Promise.all(candidates.slice(0, 8).map((candidate) => fetchSource(candidate, config))))
        .filter(Boolean)
        .map((document) => extractReadableText(document!))
        .filter((document) => document.text.length >= 800);

      if (fetched.length < config.minSources) {
        console.warn(`Skipped ${query}: only ${fetched.length} readable sources found.`);
        continue;
      }

      const compiled = await compileArticle(query, fetched.slice(0, 5), config);
      if (!compiled || compiled.steps.length === 0) continue;

      const duplicate = findDuplicate(compiled, existing);
      const slug = duplicate?.slug || getArticleSlug(compiled);
      const withImages = await processArticleImages(compiled, slug, config);
      const result = await writeArticle(withImages, duplicate, config);
      written.push(result.filePath);
      console.log(`${duplicate ? 'Updated' : 'Created'} ${result.slug}`);
    } catch (error) {
      console.warn(`Skipped ${query}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (written.length === 0) {
    console.log('No new or updated articles were generated.');
  } else {
    console.log(`Generated ${written.length} article file(s).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
