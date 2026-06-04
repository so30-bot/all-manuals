import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');
const minLines = 40;

function getScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*['\"]?([^'\"\\n]+)['\"]?`, 'm'));
  return match ? match[1].trim() : '';
}

function getList(frontmatter, key) {
  const start = frontmatter.match(new RegExp(`^${key}:\\r?\\n`, 'm'));
  if (!start) return [];

  const rest = frontmatter.slice(start.index + start[0].length);
  const block = rest.split(/\r?\n(?=[a-zA-Z][a-zA-Z0-9_-]*:)/)[0];

  return [...block.matchAll(/^\s*-\s+['"]?(.+?)['"]?\s*$/gm)]
    .map((match) => match[1].replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

function getStepTitles(frontmatter) {
  return [...frontmatter.matchAll(/^\s*-\s+title:\s*['"]?(.+?)['"]?\s*$/gm)]
    .map((match) => match[1].replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeLine(text) {
  return text.replace(/[.!?]+$/g, '').trim();
}

function fallbackItems(kind) {
  if (kind === 'symptoms') {
    return [
      'ошибка повторяется после перезапуска',
      'проблема появилась после обновления или изменения настроек',
      'сбой затрагивает только один компонент или приложение',
      'в логах есть повторяющиеся сообщения об ошибке',
    ];
  }

  if (kind === 'causes') {
    return [
      'неверная конфигурация',
      'повреждённые временные файлы или кэш',
      'недостаточные права доступа',
      'конфликт версий или зависимостей',
    ];
  }

  return [
    'проверьте состояние компонента',
    'сохраните текст ошибки',
    'выполните безопасные исправления',
    'повторите проверку после перезапуска',
  ];
}

function buildChecklist({ title, symptoms, causes, steps }) {
  const symptomItems = (symptoms.length ? symptoms : fallbackItems('symptoms')).map(normalizeLine);
  const causeItems = (causes.length ? causes : fallbackItems('causes')).map(normalizeLine);
  const stepItems = (steps.length ? steps : fallbackItems('steps')).map(normalizeLine);

  return `

## Быстрый чек-лист

Проверьте признаки проблемы «${title}»:

${symptomItems.map((item) => `- ${item}`).join('\n')}

Проверьте наиболее вероятные причины:

${causeItems.map((item) => `- ${item}`).join('\n')}

Выполняйте исправление в таком порядке:

${stepItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Контроль после исправления

- Повторите действие, при котором появлялась ошибка.
- Проверьте, что сообщение об ошибке не возвращается после перезапуска.
- Убедитесь, что связанные функции работают стабильно.
- Сохраните рабочую конфигурацию или сделайте резервную копию.
- Если проблема вернулась, сравните новые логи со старыми.
- Не удаляйте данные и настройки без резервной копии.
`.trimEnd();
}

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;

  const body = content.slice(match[0].length).trim();
  const bodyLines = body ? body.split(/\r?\n/).filter((line) => line.trim()).length : 0;
  if (bodyLines >= minLines || body.includes('## Быстрый чек-лист')) continue;

  const frontmatter = match[1];
  const title = getScalar(frontmatter, 'title') || file.replace(/\.mdx$/, '');
  const symptoms = getList(frontmatter, 'symptoms');
  const causes = getList(frontmatter, 'causes');
  const steps = getStepTitles(frontmatter);
  const checklist = buildChecklist({ title, symptoms, causes, steps });

  fs.writeFileSync(filePath, `${content.trimEnd()}\n\n${checklist}\n`);
  changed += 1;
}

console.log(`Added structured checklists to ${changed} files`);
