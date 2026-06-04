import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');

const extra = `

## Дополнительные рекомендации

- Не выполняйте несколько радикальных изменений одновременно.
- После каждого шага проверяйте, изменилось ли поведение ошибки.
- Если проблема связана с обновлением, сохраните номер версии до отката.
- Если задействованы драйверы, моды или расширения, временно отключайте их по одному.
- Если есть логи, сравните время ошибки с временем ваших действий.
- После исправления перезагрузите систему или приложение, если это требуется инструкцией.
- Зафиксируйте рабочее решение, чтобы быстро повторить его при возврате проблемы.
`;

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;

  const body = content.slice(match[0].length).trim();
  const lines = body.split(/\r?\n/).filter((line) => line.trim()).length;
  if (lines >= 40 || body.includes('## Дополнительные рекомендации')) continue;

  fs.writeFileSync(filePath, `${content.trimEnd()}\n${extra}`);
  changed += 1;
}

console.log(`Finalized ${changed} short bodies`);
