import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');

const translit = new Map(Object.entries({
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}));

function toAsciiSlug(value) {
  let out = '';
  for (const char of String(value).toLowerCase()) {
    out += translit.get(char) ?? char;
  }
  return out
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/-kak-ispravit$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '');
}

function uniqueName(base, used) {
  let candidate = `${base}.mdx`;
  let index = 2;
  while (used.has(candidate)) {
    const suffix = `-${index}`;
    candidate = `${base.slice(0, 96 - suffix.length)}${suffix}.mdx`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

const files = fs.readdirSync(articlesDir).filter((entry) => entry.endsWith('.mdx')).sort();
const used = new Set(files.filter((file) => !/--\d{3}\.mdx$/.test(file)));
const renames = [];

for (const file of files) {
  if (!/--\d{3}\.mdx$/.test(file)) continue;
  const parsed = matter.read(path.join(articlesDir, file));
  const titleSlug = toAsciiSlug(parsed.data.title);
  const fallback = file.replace(/--\d{3}\.mdx$/, '');
  const nextName = uniqueName(titleSlug || fallback, used);
  if (nextName !== file) renames.push([file, nextName]);
}

for (const [from, to] of renames) {
  fs.renameSync(path.join(articlesDir, from), path.join(articlesDir, to));
  console.log(`renamed\t${from}\t${to}`);
}

console.log(`targets\t${renames.length}`);
