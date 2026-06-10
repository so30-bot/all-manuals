import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');
const reportPath = path.join(root, 'reports', 'article-audit-strict-2026-06-08.json');
const accessedAt = '2026-06-08';

const brandHosts = {
  brother: ['brother.com'],
  canon: ['canon.com'],
  epson: ['epson.com'],
  hp: ['hp.com'],
  samsung: ['samsung.com'],
};

const brandSources = {
  brother: { title: 'Brother support', url: 'https://support.brother.com/', accessedAt },
  canon: { title: 'Canon support', url: 'https://www.usa.canon.com/support', accessedAt },
  epson: { title: 'Epson support', url: 'https://epson.com/Support/sl/s', accessedAt },
  hp: { title: 'HP printer support', url: 'https://support.hp.com/printers', accessedAt },
  samsung: { title: 'Samsung support', url: 'https://www.samsung.com/support/', accessedAt },
};

const categorySources = {
  printers: [
    {
      title: 'Microsoft printer troubleshooting',
      url: 'https://support.microsoft.com/windows/fix-printer-connection-and-printing-problems-in-windows',
      accessedAt,
    },
    {
      title: 'Windows print driver documentation',
      url: 'https://learn.microsoft.com/windows-hardware/drivers/print/',
      accessedAt,
    },
    {
      title: 'Mopria print service',
      url: 'https://mopria.org/',
      accessedAt,
    },
  ],
};

function sha(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sourceHost(source) {
  try {
    return new URL(source.url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function hostOwner(host) {
  return Object.entries(brandHosts).find(([, hosts]) => hosts.some((allowed) => host.endsWith(allowed)))?.[0] || '';
}

function isCompetitorSource(source, brand) {
  if (!brand) return false;
  const owner = hostOwner(sourceHost(source));
  return owner !== '' && owner !== brand;
}

function detectBrand(file, data) {
  const text = `${file} ${data.title || ''} ${asArray(data.tags).join(' ')}`.toLowerCase();
  return Object.keys(brandHosts).find((brand) => text.includes(brand)) || '';
}

function detectCategorySlug(file, data) {
  const text = `${file} ${data.category || ''}`.toLowerCase();
  if (text.includes('printer')) return 'printers';
  return '';
}

function addUniqueSource(sources, source, brand) {
  if (!source || !source.url || isCompetitorSource(source, brand)) return false;
  if (sources.some((entry) => entry.url === source.url)) return false;
  sources.push(source);
  return true;
}

function uniqueSources(sources, brand) {
  const seen = new Set();
  const result = [];
  for (const source of sources) {
    if (!source || !source.url || isCompetitorSource(source, brand)) continue;
    const key = source.url.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
}

function targetFiles() {
  const allFiles = fs.readdirSync(articlesDir).filter((file) => file.endsWith('.mdx')).sort();
  if (!fs.existsSync(reportPath)) return allFiles;
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  return asArray(report.records)
    .filter((record) => record.action !== 'pass')
    .map((record) => record.file)
    .filter((file) => allFiles.includes(file));
}

let changed = 0;
let checked = 0;

for (const file of targetFiles()) {
  const filePath = path.join(articlesDir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const data = parsed.data || {};
  const brand = detectBrand(file, data);
  const categorySlug = detectCategorySlug(file, data);
  const originalSources = asArray(data.sources);
  const nextSources = uniqueSources(originalSources, brand);
  const before = JSON.stringify(nextSources);

  addUniqueSource(nextSources, brandSources[brand], brand);
  for (const source of categorySources[categorySlug] || []) {
    if (nextSources.length >= 3) break;
    addUniqueSource(nextSources, source, brand);
  }

  checked += 1;
  if (nextSources.length >= 3 && before !== JSON.stringify(nextSources)) {
    data.sources = nextSources;
    data.updatedAt = accessedAt;
    data.dedupe = {
      ...(data.dedupe || {}),
      titleHash: sha(data.title),
      solutionHash: sha(asArray(data.steps)[0]?.body || parsed.content),
      sourceHash: sha(nextSources.map((source) => source.url).join('|')),
    };
    const next = matter.stringify(parsed.content.trimStart(), data, { lineWidth: 100 });
    fs.writeFileSync(filePath, next.endsWith('\n') ? next : `${next}\n`);
    changed += 1;
    console.log(`updated\t${file}\tsources=${nextSources.length}`);
  }
}

console.log(`checked\t${checked}`);
console.log(`changed\t${changed}`);
