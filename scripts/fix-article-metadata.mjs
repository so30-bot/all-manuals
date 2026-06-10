import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');

const categoryFixesByValue = new Map([
  ['DevOps', 'DevOps и облака'],
  ['Docker', 'Docker и контейнеры'],
  ['Разработка', 'Программирование'],
  ['Офис', 'Офисные программы'],
]);

const categoryFixesByFile = new Map([
  ['телевизор-samsung-не-включается-решение.mdx', 'Телевизоры и аудио'],
  ['шуруповёрт-makita-не-крутится-исправить.mdx', 'Электроинструмент'],
  ['outlook-не-получает-письма-как-исправить.mdx', 'Электронная почта'],
  ['docker-desktop-не-запускается-ошибка-windows.mdx', 'Docker и контейнеры'],
  ['virtualbox-vt-x-amd-v-unavailable-fix.mdx', 'Виртуализация'],
  ['wsl-no-internet-dns-fix.mdx', 'Windows'],
  ['кондиционер-не-холодит-причины-и-как-исправить.mdx', 'Кондиционеры и обогрев'],
  ['робот-пылесос-xiaomi-не-заряжается-решение.mdx', 'Пылесосы и роботы-пылесосы'],
  ['ssh-connection-refused-fix.mdx', 'Сеть'],
]);

function sha(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function normalizeData(file, data) {
  const next = { ...data };
  if (categoryFixesByFile.has(file)) {
    next.category = categoryFixesByFile.get(file);
  } else if (categoryFixesByValue.has(next.category)) {
    next.category = categoryFixesByValue.get(next.category);
  }

  const firstStep = Array.isArray(next.steps) ? next.steps[0] : null;
  const firstSource = Array.isArray(next.sources) ? next.sources[0] : null;
  next.dedupe = {
    titleHash: sha(next.title),
    solutionHash: sha(firstStep?.body || ''),
    sourceHash: sha(firstSource?.url || ''),
  };

  return next;
}

let changed = 0;
let scanned = 0;

for (const file of fs.readdirSync(articlesDir).filter((entry) => entry.endsWith('.mdx')).sort()) {
  scanned += 1;
  const filePath = path.join(articlesDir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const normalized = normalizeData(file, parsed.data);
  const next = matter.stringify(parsed.content.trimStart(), normalized, { lineWidth: 100 });

  if (next !== original) {
    fs.writeFileSync(filePath, next);
    changed += 1;
  }
}

console.log(`scanned\t${scanned}`);
console.log(`changed\t${changed}`);
