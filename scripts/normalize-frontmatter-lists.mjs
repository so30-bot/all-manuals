import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');
const listKeys = new Set(['tags', 'symptoms', 'causes']);

function quoteYaml(value) {
  const clean = value
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `'${clean.replace(/'/g, "''")}'`;
}

function normalizeListBlock(key, blockLines) {
  const items = [];
  let current = null;

  for (const line of blockLines) {
    const itemMatch = line.match(/^\s*-\s*(.*)$/);
    if (itemMatch) {
      if (current !== null) items.push(current);
      current = itemMatch[1].trim();
      continue;
    }

    const continuation = line.trim();
    if (current !== null && continuation) {
      current = `${current} ${continuation}`;
    }
  }

  if (current !== null) items.push(current);

  if (!items.length) return [`${key}:`];
  return [`${key}:`, ...items.map((item) => `  - ${quoteYaml(item)}`)];
}

function normalizeFrontmatter(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const output = [];

  for (let i = 0; i < lines.length;) {
    const keyMatch = lines[i].match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*$/);
    if (!keyMatch || !listKeys.has(keyMatch[1])) {
      output.push(lines[i]);
      i += 1;
      continue;
    }

    const key = keyMatch[1];
    const block = [];
    i += 1;

    while (i < lines.length && !/^[a-zA-Z][a-zA-Z0-9_-]*:/.test(lines[i])) {
      block.push(lines[i]);
      i += 1;
    }

    output.push(...normalizeListBlock(key, block));
  }

  return output.join('\n');
}

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const match = original.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;

  const normalized = normalizeFrontmatter(match[1]);
  if (normalized === match[1]) continue;

  const updated = original.replace(match[1], normalized);
  fs.writeFileSync(filePath, updated);
  changed += 1;
}

console.log(`Normalized frontmatter lists in ${changed} files`);
