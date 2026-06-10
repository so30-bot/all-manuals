import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const auditPath = path.join(root, 'reports', 'article-audit-2026-06-06.json');
const articlesDir = path.join(root, 'src', 'content', 'errors');
const accessedAt = '2026-06-07';

function sourceFor(file) {
  if (file.includes('docker-compose')) {
    return {
      title: 'Docker Compose GitHub repository',
      url: 'https://github.com/docker/compose',
      accessedAt,
    };
  }

  if (file.includes('docker-desktop')) {
    return {
      title: 'Docker Desktop for Windows issue tracker',
      url: 'https://github.com/docker/for-win',
      accessedAt,
    };
  }

  return {
    title: 'Moby project GitHub repository',
    url: 'https://github.com/moby/moby',
    accessedAt,
  };
}

function hasOneHostWeakSource(record) {
  return record.issues.some((issue) => issue.code === 'weak-sources' && issue.message.includes('one host'));
}

let changed = 0;
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const targets = audit.records
  .filter((record) => record.action === 'improve')
  .filter((record) => record.categorySlug === 'docker')
  .filter(hasOneHostWeakSource)
  .sort((a, b) => a.file.localeCompare(b.file));

for (const record of targets) {
  const filePath = path.join(articlesDir, record.file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const sources = Array.isArray(parsed.data.sources) ? parsed.data.sources : [];
  const nextSource = sourceFor(record.file);

  if (sources.some((source) => source.url === nextSource.url)) continue;

  parsed.data.sources = [...sources, nextSource];
  const next = matter.stringify(parsed.content.trimStart(), parsed.data, { lineWidth: 100 });
  if (next !== original) {
    fs.writeFileSync(filePath, next);
    changed += 1;
    console.log(`updated\t${record.file}`);
  }
}

console.log(`targets\t${targets.length}`);
console.log(`changed\t${changed}`);
