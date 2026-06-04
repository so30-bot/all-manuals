import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');

const badLinePatterns = [
  /^-\s*>-\s*$/,
  /^\d+\.\s*>-\s*$/,
  /^>-\s*$/,
  /^\d+\.\s*.*\s-\sWikipedia\s*$/i,
  /^\d+\.\s*.*\s-\sAsk Ubuntu\s*$/i,
  /^\d+\.\s*.*\s-\sStack Overflow\s*$/i,
  /^\d+\.\s*.*\s-\sGitHub\s*$/i,
  /^\d+\.\s*.*\s-\sMicrosoft Learn\s*$/i,
];

function cleanLines(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => !badLinePatterns.some((pattern) => pattern.test(line.trim())))
    .join('\n');
}

function replaceAnglePlaceholders(content) {
  return content
    .replace(/<команда>/g, '`команда`')
    .replace(/<имя_пакета>/g, '`имя_пакета`')
    .replace(/<файл>/g, '`файл`')
    .replace(/<путь>/g, '`путь`')
    .replace(/<branch>/g, '`branch`')
    .replace(/<filename>/g, '`filename`');
}

function cleanSentences(content) {
  return content
    .replace(/В этой статье наиболее вероятные причины:\s*(?:>-,?\s*)+(?:и\s*>-)?\./g, 'В этой статье наиболее вероятные причины: неверная конфигурация, отсутствующий компонент, конфликт зависимостей или повреждённые временные данные.')
    .replace(/Безопасный порядок решения такой:\s*(?:>-,?\s*)+(?:и\s*>-)?\./g, 'Безопасный порядок решения такой: проверьте состояние, изучите логи, выполните безопасное исправление и повторите контрольный запуск.')
    .replace(/,\s*>-/g, '')
    .replace(/и\s*>-/g, 'и проверьте результат')
    .replace(/\.\s*\./g, '.');
}

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;

  content = replaceAnglePlaceholders(content);
  content = cleanSentences(content);
  content = cleanLines(content);

  if (content !== original) {
    fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`);
    changed += 1;
  }
}

console.log(`Cleaned generated artifacts in ${changed} files`);
