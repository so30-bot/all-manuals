import * as cheerio from 'cheerio';
import type { SourceDocument } from './types';

const noiseSelectors = [
  'script',
  'style',
  'noscript',
  'svg',
  'iframe',
  'nav',
  'footer',
  'header',
  '[role="navigation"]',
  '.advertisement',
  '.ads',
  '.cookie',
  '.banner'
];

export function extractReadableText(document: SourceDocument): SourceDocument {
  const $ = cheerio.load(document.text);
  noiseSelectors.forEach((selector) => $(selector).remove());

  const title = $('title').first().text().trim() || document.title;
  const mainText = $('main, article, .post, .answer, .markdown-body, body')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  const codeBlocks = $('pre, code')
    .map((_, element) => $(element).text().trim())
    .get()
    .filter((value) => value.length > 3 && value.length < 1200)
    .slice(0, 12);

  const text = [mainText.slice(0, 9000), codeBlocks.length ? `Code examples:\n${codeBlocks.join('\n---\n')}` : '']
    .filter(Boolean)
    .join('\n\n');

  return {
    ...document,
    title,
    text
  };
}
