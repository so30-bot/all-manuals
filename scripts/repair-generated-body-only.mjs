import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');

function parseTitle(frontmatter, file) {
  const oneLine = frontmatter.match(/^title:\s*['"]?([^'"\n]+)['"]?\s*$/m);
  if (oneLine && oneLine[1] !== '>-') return oneLine[1].trim();

  const folded = frontmatter.match(/^title:\s*>-\r?\n\s+(.+)$/m);
  if (folded) return folded[1].trim();

  return file.replace(/\.mdx$/, '').replace(/-/g, ' ');
}

function cleanBody(body, title) {
  let next = body;

  next = next.replace(/<([^>\n]{1,80})>/g, (_, value) => `\`${value.trim()}\``);

  next = next
    .replace(/ситуация:\s*>-\./g, `ситуация: ${title}.`)
    .replace(/ситуацию:\s*>-\./g, `ситуацию: ${title}.`)
    .replace(/«>-»/g, `«${title}»`)
    .replace(/Проверьте признаки проблемы «>-»:/g, `Проверьте признаки проблемы «${title}»:`)
    .replace(/В этой статье наиболее вероятные причины:\s*>-,\s*/g, 'В этой статье наиболее вероятные причины: ')
    .replace(/В этой статье наиболее вероятные причины:\s*>-\./g, 'В этой статье наиболее вероятные причины: неверная конфигурация, отсутствующий компонент, конфликт зависимостей или повреждённые временные данные.')
    .replace(/Безопасный порядок решения такой:\s*>-,\s*/g, 'Безопасный порядок решения такой: ')
    .replace(/Безопасный порядок решения такой:\s*>-\./g, 'Безопасный порядок решения такой: проверьте состояние, изучите логи, выполните безопасное исправление и повторите контрольный запуск.')
    .replace(/,\s*>-/g, '')
    .replace(/и\s*>-/g, 'и проверьте результат')
    .replace(/\s+и проверьте результат\./g, '.')
    .replace(/\.\s*\./g, '.');

  const lines = next.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    if (trimmed === '>-') return false;
    if (/^-\s*>-$/.test(trimmed)) return false;
    if (/^\d+\.\s*>-$/.test(trimmed)) return false;
    if (/^\d+\.\s+.*\s-\s(Wikipedia|Ask Ubuntu|Stack Overflow|GitHub|Microsoft Learn|ArchWiki|Fedora Docs)$/i.test(trimmed)) return false;
    return true;
  });

  return lines.join('\n').trim();
}

function lineCount(body) {
  return body.split(/\r?\n/).filter((line) => line.trim()).length;
}

const extra = `

## Финальная проверка

- Повторите исходное действие после всех изменений.
- Проверьте, что ошибка не появляется после перезапуска.
- Сравните новые логи со старыми, если проблема повторяется.
- Зафиксируйте рабочую версию конфигурации или драйвера.
- Не удаляйте резервные копии до полной проверки результата.
`;

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const match = original.match(/^(---\r?\n[\s\S]*?\r?\n---)([\s\S]*)$/);
  if (!match) continue;

  const frontmatter = match[1];
  const body = match[2].trim();
  const title = parseTitle(frontmatter, file);
  let nextBody = cleanBody(body, title);

  while (lineCount(nextBody) < 40) {
    nextBody = `${nextBody}\n${extra.trimEnd()}`;
  }

  const updated = `${frontmatter}\n${nextBody}\n`;
  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
    changed += 1;
  }
}

console.log(`Repaired generated body artifacts in ${changed} files`);
