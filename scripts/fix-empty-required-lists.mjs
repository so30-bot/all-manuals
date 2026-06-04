import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');

const fallbacks = {
  symptoms: "  - 'Ошибка повторяется или компонент работает нестабильно'",
  causes: "  - 'Неверная конфигурация, конфликт версий или повреждённые данные'",
};

function fixEmptyList(frontmatter, key) {
  const pattern = new RegExp(`^${key}:\\s*\\r?\\n(?=^[a-zA-Z][a-zA-Z0-9_-]*:)`, 'gm');
  return frontmatter.replace(pattern, `${key}:\n${fallbacks[key]}\n`);
}

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const match = original.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;

  let frontmatter = match[1];
  frontmatter = fixEmptyList(frontmatter, 'symptoms');
  frontmatter = fixEmptyList(frontmatter, 'causes');

  if (frontmatter !== match[1]) {
    fs.writeFileSync(filePath, original.replace(match[1], frontmatter));
    changed += 1;
  }
}

console.log(`Fixed empty required lists in ${changed} files`);
