import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'src', 'content', 'errors');
const files = fs.readdirSync(dir).filter((file) => file.endsWith('.mdx'));

const issues = [];
const slugs = new Map();
const titles = new Map();
let totalSources = 0;
let minBodyLines = Infinity;

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    issues.push(`${file}: missing frontmatter`);
    continue;
  }

  const frontmatter = match[1];
  const body = content.slice(match[0].length).trim();
  const bodyLines = body.split(/\r?\n/).filter((line) => line.trim()).length;
  minBodyLines = Math.min(minBodyLines, bodyLines);

  const title = frontmatter.match(/^title:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim();
  const category = frontmatter.match(/^category:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim();
  const sourceBlock = frontmatter.match(/sources:\r?\n([\s\S]*?)(?=\r?\ndedupe:)/);
  const sourceCount = sourceBlock ? (sourceBlock[1].match(/url:/g) || []).length : 0;
  const slug = file.replace(/\.mdx$/, '');

  totalSources += sourceCount;

  if (!title) issues.push(`${file}: missing title`);
  if (!category) issues.push(`${file}: missing category`);
  if (!body) issues.push(`${file}: empty body`);
  if (bodyLines < 25) issues.push(`${file}: body too short (${bodyLines})`);
  if (sourceCount < 3) issues.push(`${file}: sources < 3 (${sourceCount})`);
  if (!frontmatter.includes('dedupe:')) issues.push(`${file}: missing dedupe`);
  if (/检查| thường|загрузкойLinux|дляnginx|обновлятьinitramfs|<команда>|<имя_пакета>|<<<<<<<(?!`)/.test(content)) {
    issues.push(`${file}: contains known artifact marker`);
  }

  if (slugs.has(slug)) issues.push(`${file}: duplicate slug with ${slugs.get(slug)}`);
  slugs.set(slug, file);

  if (title) {
    if (titles.has(title)) issues.push(`${file}: duplicate title with ${titles.get(title)}`);
    titles.set(title, file);
  }
}

console.log(`files\t${files.length}`);
console.log(`avg_sources\t${(totalSources / files.length).toFixed(2)}`);
console.log(`min_body_lines\t${minBodyLines}`);
console.log(`issues\t${issues.length}`);

if (issues.length) {
  for (const issue of issues.slice(0, 200)) console.log(issue);
  if (issues.length > 200) console.log(`... ${issues.length - 200} more issues`);
  process.exitCode = 1;
}
