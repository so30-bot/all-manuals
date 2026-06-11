import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'errors');

function shorten(value, maxLength) {
  const clean = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?:;\-\s]+$/, '');
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).replace(/\s+\S*$/, '')}...`;
}

function buildDescription(title, category) {
  const topic = shorten(title, 64);
  let description = joinLead(topic, 'симптомы, причины и пошаговое исправление без лишней воды. Проверки, безопасные действия и когда нужна поддержка.');

  if (description.length > 170) {
    description = joinLead(shorten(title, 55), 'симптомы, причины и пошаговое исправление. Безопасные проверки, действия и когда нужна поддержка.');
  }

  if (description.length >= 135) return description;

  return joinLead(topic, `симптомы, причины и пошаговое исправление без лишней воды. Проверки, безопасные действия и поддержка по теме ${shorten(category, 32)}.`);
}

function joinLead(topic, rest) {
  return `${topic}${topic.endsWith('...') ? ' ' : ': '}${rest}`;
}

function hash(value) {
  return `h${crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 16)}`;
}

function normalizeDedupe(data, content) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const symptoms = Array.isArray(data.symptoms) ? data.symptoms : [];
  const causes = Array.isArray(data.causes) ? data.causes : [];
  const sources = Array.isArray(data.sources) ? data.sources : [];

  return {
    titleHash: hash([data.category, data.title, data.description].join('\n')),
    solutionHash: hash([
      data.category,
      ...symptoms,
      ...causes,
      ...steps.map((step) => `${step.title || ''}:${step.body || ''}`),
      content,
    ].join('\n')),
    sourceHash: hash([data.category, ...sources.map((source) => source.url || '')].join('\n')),
  };
}

let changed = 0;
let minDescriptionLength = Infinity;
let maxDescriptionLength = 0;

for (const file of fs.readdirSync(CONTENT_DIR).filter((item) => item.endsWith('.mdx'))) {
  const fullPath = path.join(CONTENT_DIR, file);
  const parsed = matter.read(fullPath);
  const data = parsed.data;

  if (data.draft) continue;

  data.description = buildDescription(data.title, data.category);
  data.dedupe = normalizeDedupe(data, parsed.content);

  minDescriptionLength = Math.min(minDescriptionLength, data.description.length);
  maxDescriptionLength = Math.max(maxDescriptionLength, data.description.length);

  fs.writeFileSync(fullPath, matter.stringify(parsed.content, data, { lineWidth: 100 }), 'utf8');
  changed += 1;
}

console.log(JSON.stringify({
  changed,
  minDescriptionLength,
  maxDescriptionLength,
}, null, 2));
