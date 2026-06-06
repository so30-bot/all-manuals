import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');
const categories = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'categories.json'), 'utf8'));

const slugMap = new Map([
  ['windows', 'windows'],
  ['linux', 'linux'],
  ['macos', 'macos'],
  ['игры', 'games'],
  ['мобильные', 'mobile'],
  ['мобильные устройства', 'mobile'],
  ['веб-разработка', 'web-development'],
  ['разработка', 'programming'],
  ['программирование', 'programming'],
  ['базы данных', 'databases'],
  ['devops', 'devops'],
  ['devops и облака', 'devops'],
  ['docker', 'docker'],
  ['docker и контейнеры', 'docker'],
  ['оборудование', 'hardware'],
  ['сеть', 'network'],
  ['безопасность', 'security'],
  ['хранилища и файлы', 'storage'],
  ['bios и uefi', 'bios-uefi'],
  ['принтеры', 'printers'],
  ['принтеры и сканеры', 'printers'],
  ['аудио/видео', 'audio-video'],
  ['аудио и видео', 'audio-video'],
  ['офис', 'office'],
  ['офисные программы', 'office'],
  ['браузеры', 'browsers'],
  ['почта', 'email'],
  ['электронная почта', 'email'],
  ['дизайн', 'design'],
  ['дизайн и графика', 'design'],
  ['виртуализация', 'virtualization'],
  ['стиральные машины', 'washing-machines'],
  ['холодильники', 'refrigerators'],
  ['посудомоечные машины', 'dishwashers'],
  ['микроволновки и духовки', 'microwaves-ovens'],
  ['кондиционеры и обогрев', 'ac-heating'],
  ['бытовая техника', 'ac-heating'],
  ['телевизоры и аудио', 'tvs-audio'],
  ['пылесосы и роботы-пылесосы', 'vacuums'],
  ['электроинструмент', 'power-tools'],
]);

function categoryToSlug(category) {
  return slugMap.get(String(category).trim().toLowerCase()) || String(category).trim().toLowerCase();
}

const counts = Object.fromEntries(categories.map((category) => [category.slug, 0]));
let total = 0;

for (const file of fs.readdirSync(articlesDir)) {
  if (!file.endsWith('.mdx')) continue;
  const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const categoryLine = match[1].split(/\r?\n/).find((line) => line.startsWith('category:'));
  const category = categoryLine ? categoryLine.replace(/^category:\s*/, '').replace(/^['"]|['"]$/g, '').trim() : '(no category)';
  const slug = categoryToSlug(category);
  counts[slug] = (counts[slug] || 0) + 1;
  total += 1;
}

console.log(`total\t${total}`);
for (const category of categories) {
  console.log(`${String(counts[category.slug] || 0).padStart(4)}\t${category.slug}\t${category.name}`);
}
