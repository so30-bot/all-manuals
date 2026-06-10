import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const articlesDir = path.join(process.cwd(), 'src', 'content', 'errors');
const accessedAt = '2026-06-07';

const additions = new Map([
  ['docker-desktop-ne-zapuskaetsya-oshibka-windows.mdx', {
    title: 'Docker Desktop troubleshooting documentation',
    url: 'https://docs.docker.com/desktop/troubleshoot/',
    accessedAt,
  }],
  ['televizor-samsung-ne-vklyuchaetsya-reshenie.mdx', {
    title: 'Samsung Download Center',
    url: 'https://downloadcenter.samsung.com/',
    accessedAt,
  }],
]);

function sha(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

let changed = 0;
for (const [file, source] of additions) {
  const filePath = path.join(articlesDir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const sources = Array.isArray(parsed.data.sources) ? parsed.data.sources : [];
  if (!sources.some((entry) => entry.url === source.url)) {
    parsed.data.sources = [...sources, source];
    parsed.data.updatedAt = accessedAt;
    parsed.data.dedupe = {
      titleHash: sha(parsed.data.title),
      solutionHash: sha(parsed.data.steps?.[0]?.body || ''),
      sourceHash: sha(parsed.data.sources?.[0]?.url || ''),
    };
    fs.writeFileSync(filePath, matter.stringify(parsed.content.trimStart(), parsed.data, { lineWidth: 100 }));
    changed += 1;
    console.log(`updated\t${file}`);
  }
}

console.log(`changed\t${changed}`);
