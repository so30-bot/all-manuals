import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');
const reportsDir = path.join(root, 'reports');
const outJson = path.join(reportsDir, 'article-audit-actions-2026-06-08.json');
const outCsv = path.join(reportsDir, 'article-audit-actions-2026-06-08.csv');
const outMd = path.join(reportsDir, 'article-audit-actions-2026-06-08.md');

const categories = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'categories.json'), 'utf8'));
const knownCategories = new Set(categories.map((category) => category.name));

const templatedDescriptionPrefix = '\u041a\u043e\u0440\u043e\u0442\u043a\u0430\u044f \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f';

const genericSourceTitles = new Set([
  'Product support documentation',
  'Troubleshooting documentation',
  'Technical reference',
  'Official troubleshooting documentation',
  'Vendor support knowledge base',
  'Technical reference documentation',
]);

const brandHosts = {
  samsung: ['samsung.com'],
  lg: ['lg.com'],
  sony: ['sony.com'],
  bosch: ['bosch-home.com', 'bosch-home.ru', 'boschtools.com'],
  siemens: ['siemens-home.bsh-group.com'],
  electrolux: ['electrolux.com'],
  xiaomi: ['mi.com', 'xiaomi.com'],
  roborock: ['roborock.com'],
  dreame: ['dreame.tech', 'dreame.com'],
  hp: ['hp.com'],
  canon: ['canon.com'],
  epson: ['epson.com'],
  brother: ['brother.com'],
  makita: ['makitatools.com', 'makita.com'],
  dewalt: ['dewalt.com'],
  daikin: ['daikin.com'],
  mitsubishi: ['mitsubishielectric.com'],
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function plain(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[`*_>#()[\]{}.,:;!?'"\\/|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function sourceHost(source) {
  try {
    return new URL(source.url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function detectBrand(file, data) {
  const text = plain(`${file} ${data.title || ''} ${asArray(data.tags).join(' ')}`);
  return Object.keys(brandHosts).find((brand) => text.includes(brand)) || '';
}

function hostOwner(host) {
  return Object.entries(brandHosts).find(([, hosts]) => hosts.some((allowed) => host.endsWith(allowed)))?.[0] || '';
}

function addIssue(record, severity, code, message) {
  record.issues.push({ severity, code, message });
}

function classify(record) {
  if (record.issues.some((issue) => issue.severity === 'critical')) return 'remove';
  if (record.issues.some((issue) => issue.severity === 'major')) return 'change';
  if (record.issues.length > 0) return 'improve';
  return 'keep';
}

function stepText(step) {
  return [step?.title, step?.body, step?.command].filter(Boolean).join(' ');
}

fs.mkdirSync(reportsDir, { recursive: true });

const files = fs.readdirSync(articlesDir).filter((file) => file.endsWith('.mdx')).sort((a, b) => a.localeCompare(b));
const records = [];

for (const file of files) {
  const fullPath = path.join(articlesDir, file);
  const record = {
    file,
    path: path.relative(root, fullPath).replaceAll(path.sep, '/'),
    title: '',
    category: '',
    renderedChars: 0,
    renderedWords: 0,
    symptoms: 0,
    causes: 0,
    steps: 0,
    sources: 0,
    uniqueSourceHosts: 0,
    action: 'keep',
    issues: [],
  };

  try {
    const parsed = matter(fs.readFileSync(fullPath, 'utf8'));
    const data = parsed.data || {};
    const body = parsed.content || '';
    const symptoms = asArray(data.symptoms);
    const causes = asArray(data.causes);
    const steps = asArray(data.steps);
    const sources = asArray(data.sources);
    const renderedText = [
      body,
      ...symptoms,
      ...causes,
      ...steps.map(stepText),
    ].join('\n');
    const renderedWords = renderedText.split(/\s+/).filter(Boolean);
    const sourceHosts = sources.map(sourceHost).filter(Boolean);
    const uniqueHosts = new Set(sourceHosts);
    const brand = detectBrand(file, data);
    const officialBrandSourcesOnly = Boolean(brand)
      && sources.length >= 3
      && sourceHosts.length === sources.length
      && sourceHosts.every((host) => hostOwner(host) === brand);

    record.title = data.title || '';
    record.category = data.category || '';
    record.renderedChars = renderedText.length;
    record.renderedWords = renderedWords.length;
    record.symptoms = symptoms.length;
    record.causes = causes.length;
    record.steps = steps.length;
    record.sources = sources.length;
    record.uniqueSourceHosts = uniqueHosts.size;

    if (!data.title || !data.category || !data.description) {
      addIssue(record, 'major', 'missing-frontmatter', 'title, category, and description are required');
    }
    if (data.category && !knownCategories.has(data.category)) {
      addIssue(record, 'major', 'unknown-category', 'category is not listed in src/data/categories.json');
    }
    if (String(data.description || '').trim().startsWith(templatedDescriptionPrefix)) {
      addIssue(record, 'major', 'templated-description', 'description starts with a generic template phrase');
    }
    if (String(data.description || '').trim().length < 120) {
      addIssue(record, 'medium', 'thin-description', 'description is too short to set the article scope');
    }
    if (record.renderedChars < 1800 || record.renderedWords < 220) {
      addIssue(record, 'major', 'thin-rendered-content', 'rendered article content is too short');
    }
    if (record.symptoms < 2 || record.causes < 2 || record.steps < 5) {
      addIssue(record, 'major', 'missing-diagnostic-structure', 'symptoms, causes, and at least five steps are expected');
    }
    if (record.sources < 3 || (record.uniqueSourceHosts < 2 && !officialBrandSourcesOnly)) {
      addIssue(record, 'major', 'weak-sources', 'article needs at least three sources from at least two hosts');
    }
    if (sources.some((source) => !sourceHost(source))) {
      addIssue(record, 'major', 'invalid-source-url', 'one or more source URLs are invalid');
    }
    if (new Set(sources.map((source) => source.url)).size !== sources.length) {
      addIssue(record, 'medium', 'duplicate-source-url', 'source list repeats the same URL');
    }
    if (sources.filter((source) => genericSourceTitles.has(String(source.title || ''))).length >= 2) {
      addIssue(record, 'major', 'generic-source-titles', 'source titles are too generic');
    }

    if (brand) {
      const competitorHosts = sourceHosts.filter((host) => {
        const owner = hostOwner(host);
        return owner !== '' && owner !== brand;
      });
      if (competitorHosts.length > 0) {
        addIssue(record, 'major', 'competitor-source-noise', `competitor source hosts: ${competitorHosts.join(', ')}`);
      }
    }

    const repeatedStepTitles = steps.filter((step) => step?.title && body.includes(step.title)).length;
    if (repeatedStepTitles >= 3) {
      addIssue(record, 'medium', 'duplicated-step-content', 'MDX body repeats steps that are rendered from frontmatter');
    }
    if (/[^\x00-\x7f]/.test(file)) {
      addIssue(record, 'major', 'non-ascii-filename', 'filename should be ASCII for stable URLs');
    }
  } catch (error) {
    addIssue(record, 'critical', 'parse-error', error instanceof Error ? error.message : String(error));
  }

  record.action = classify(record);
  records.push(record);
}

const summary = { keep: 0, improve: 0, change: 0, remove: 0 };
const issueCounts = {};
for (const record of records) {
  summary[record.action] += 1;
  for (const issue of record.issues) {
    issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
  }
}

const payload = { summary, issueCounts, records };
fs.writeFileSync(outJson, JSON.stringify(payload, null, 2));

const csv = [
  ['file', 'action', 'title', 'category', 'renderedChars', 'renderedWords', 'steps', 'sources', 'uniqueSourceHosts', 'issues']
    .map(csvCell)
    .join(','),
  ...records.map((record) => [
    record.file,
    record.action,
    record.title,
    record.category,
    record.renderedChars,
    record.renderedWords,
    record.steps,
    record.sources,
    record.uniqueSourceHosts,
    record.issues.map((issue) => issue.code).join(';'),
  ].map(csvCell).join(',')),
].join('\n');
fs.writeFileSync(outCsv, `${csv}\n`);

const nonKeep = records.filter((record) => record.action !== 'keep');
const md = [
  '# Article action audit',
  '',
  `- files: ${records.length}`,
  `- keep: ${summary.keep}`,
  `- improve: ${summary.improve}`,
  `- change: ${summary.change}`,
  `- remove: ${summary.remove}`,
  '',
  '## Issue counts',
  '',
  ...Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).map(([code, count]) => `- ${code}: ${count}`),
  '',
  '## Non-keep articles',
  '',
  ...(nonKeep.length === 0
    ? ['No articles require action.']
    : nonKeep.slice(0, 100).map((record) => `- ${record.action}: ${record.path} (${record.issues.map((issue) => issue.code).join(', ')})`)),
  '',
].join('\n');
fs.writeFileSync(outMd, md);

console.log(`files\t${records.length}`);
console.log(`keep\t${summary.keep}`);
console.log(`improve\t${summary.improve}`);
console.log(`change\t${summary.change}`);
console.log(`remove\t${summary.remove}`);
console.log(`report\t${path.relative(root, outMd)}`);
console.log(`csv\t${path.relative(root, outCsv)}`);
console.log(`json\t${path.relative(root, outJson)}`);
