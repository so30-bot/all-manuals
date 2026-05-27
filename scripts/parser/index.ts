import { compileArticle } from './ai-compiler';
import { getParserConfig } from './config';
import { findDuplicate, getArticleSlug, loadExistingArticles } from './dedupe';
import { extractReadableText } from './extractor';
import { fetchSource } from './fetchers';
import { processArticleImages } from './image-handler';
import { writeArticle } from './markdown-writer';
import { discoverTrends, searchSources } from './sources';

async function main() {
  const config = getParserConfig();
  const existing = await loadExistingArticles(config);
  const queries = await discoverTrends(config);
  const written: string[] = [];

  console.log(`Weekly parser will process ${queries.length} query candidates.`);

  for (const query of queries) {
    console.log(`Processing query: ${query}`);
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
