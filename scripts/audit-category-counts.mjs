import fs from 'node:fs';
import path from 'node:path';

const categories = JSON.parse(fs.readFileSync('src/data/categories.json', 'utf8'));
const dir = path.join(process.cwd(), 'src', 'content', 'errors');

const known = {
  Windows: 'windows',
  Linux: 'linux',
  macOS: 'macos',
  Игры: 'games',
  'Мобильные устройства': 'mobile',
  'Мобильные': 'mobile',
  'Веб-разработка': 'web-development',
  Программирование: 'programming',
  'Базы данных': 'databases',
  'DevOps и облака': 'devops',
  DevOps: 'devops',
  'Docker и контейнеры': 'docker',
  Docker: 'docker',
  Оборудование: 'hardware',
  Сеть: 'network',
  Безопасность: 'security',
  'Хранилища и файлы': 'storage',
  'BIOS и UEFI': 'bios-uefi',
  'Принтеры и сканеры': 'printers',
  'Аудио и видео': 'audio-video',
  'Аудио/Видео': 'audio-video',
  'Офисные программы': 'office',
  Офис: 'office',
  Браузеры: 'browsers',
  'Электронная почта': 'email',
  Почта: 'email',
  'Дизайн и графика': 'design',
  Виртуализация: 'virtualization',
  'Стиральные машины': 'washing-machines',
  Холодильники: 'refrigerators',
  'Посудомоечные машины': 'dishwashers',
  'Микроволновки и духовки': 'microwaves-ovens',
  'Кондиционеры и обогрев': 'ac-heating',
  'Телевизоры и аудио': 'tvs-audio',
  'Пылесосы и роботы-пылесосы': 'vacuums',
  Электроинструмент: 'power-tools',
  'Бытовая техника': 'ac-heating',
  Разработка: 'programming',
};

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function categoryToSlug(category) {
  return known[category] || slugify(category);
}

const counts = Object.fromEntries(categories.map((category) => [category.slug, 0]));
let total = 0;

for (const file of fs.readdirSync(dir).filter((file) => file.endsWith('.mdx'))) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const category = match[1].match(/^category:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim();
  if (!category) continue;
  const slug = categoryToSlug(category);
  counts[slug] = (counts[slug] || 0) + 1;
  total += 1;
}

console.log(`total\t${total}`);
for (const category of categories) {
  console.log(`${String(counts[category.slug] || 0).padStart(3, ' ')}\t${category.slug}\t${category.name}`);
}
