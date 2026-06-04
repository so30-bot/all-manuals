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
    .filter(Boolean);
}

function getSteps(frontmatter) {
  const titles = [...frontmatter.matchAll(/^\s*-\s+title:\s*['"]?(.+?)['"]?\s*$/gm)]
    .map((match) => match[1].replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);

  const commands = [...frontmatter.matchAll(/^\s*command:\s*(.+?)\s*$/gm)]
    .map((match) => match[1].trim())
    .filter((command) => command && command !== 'null' && !command.startsWith('|'))
    .slice(0, 6);

  return { titles, commands };
}

function sentenceList(items, fallback) {
  if (!items.length) return fallback;
  const clean = items.slice(0, 5).map((item) => item.replace(/[.!?]+$/g, ''));
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} и ${clean.at(-1)}`;
}

function commandBlock(commands) {
  if (!commands.length) {
    return 'Если статья не содержит готовой команды, выполняйте проверки через штатные инструменты системы или приложения: журнал ошибок, диагностический режим, настройки службы и официальную документацию производителя.';
  }

  return [
    'Полезные команды из руководства лучше запускать по одной, фиксируя результат после каждого шага:',
    '',
    '```bash',
    ...commands,
    '```',
    '',
    'Если команда возвращает ошибку, не переходите к следующему пункту механически: сначала сохраните текст ошибки, проверьте права доступа и убедитесь, что команда выполняется в нужной среде.',
  ].join('\n');
}

function buildExpansion({ title, category, symptoms, causes, steps, commands }) {
  const symptomText = sentenceList(symptoms, 'повторяющийся сбой, нестабильная работа или отказ запуска');
  const causeText = sentenceList(causes, 'ошибка конфигурации, повреждение данных, нехватка прав или конфликт зависимостей');
  const stepText = sentenceList(steps, 'проверка состояния, анализ логов, исправление конфигурации и контрольный перезапуск');

  return `

## Подробная диагностика

Эта инструкция относится к категории «${category || 'Общие ошибки'}» и рассчитана на ситуацию: ${title}. Перед исправлением важно подтвердить, что наблюдаемые признаки действительно совпадают с проблемой: ${symptomText}. Если симптомы отличаются, начните с безопасной диагностики и не выполняйте радикальные действия вроде удаления данных, сброса настроек или переустановки системы.

Главная задача диагностики — отделить первопричину от последствий. Например, сообщение об ошибке может указывать на отказ службы, но реальной причиной будет занятый порт, поврежденный файл конфигурации, недоступная зависимость, устаревший драйвер или нехватка прав. В этой статье наиболее вероятные причины: ${causeText}.

## Что проверить перед исправлением

Сначала зафиксируйте текущее состояние: сделайте скриншот ошибки, сохраните текст сообщения, запишите версию программы, ОС, драйвера или пакета. Если проблема появилась после обновления, установки программы, изменения конфигурации или сбоя питания, отметьте точное время — это поможет найти нужные записи в логах.

Проверьте базовые условия: есть ли свободное место на диске, не блокирует ли действие антивирус или политика безопасности, достаточно ли прав у текущего пользователя, доступна ли сеть, не изменились ли пути к файлам и переменные окружения. Такие проверки занимают несколько минут, но часто позволяют избежать полной переустановки.

## Рекомендуемый порядок действий

Безопасный порядок решения такой: ${stepText}. Идите от диагностики к изменениям постепенно. После каждого исправления проверяйте результат, чтобы понимать, какое действие действительно помогло. Если выполнить сразу несколько изменений, будет сложнее откатиться и определить причину.

${commandBlock(commands)}

## Как понять, что проблема исправлена

После выполнения шагов повторите исходное действие: запустите программу, подключитесь к сервису, выполните команду, откройте файл или перезагрузите устройство. Успешное исправление означает не только исчезновение сообщения об ошибке, но и стабильную работу после повторного запуска.

Если ошибка возвращается через несколько минут или после перезагрузки, проверьте автозапуск, фоновые службы, расписания задач, политики обновлений и конфликтующие приложения. Повторяющийся сбой часто означает, что временное исправление сработало, но первопричина осталась.

## Что делать, если не помогло

Если все шаги выполнены, а проблема сохраняется, откатите последние изменения и соберите дополнительные данные: логи, код ошибки, версию компонента, список последних обновлений и точное описание сценария. После этого сравните ситуацию с официальной документацией и известными issue по вашей версии продукта.

Не удаляйте рабочие данные без резервной копии. Для системных ошибок сначала создайте точку восстановления или бэкап важных файлов. Для серверов и контейнеров сохраните конфигурацию, переменные окружения и журналы, чтобы можно было восстановить состояние и продолжить диагностику без потери контекста.
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
  if (bodyLines >= minLines) continue;
  if (body.includes('## Подробная диагностика')) continue;

  const frontmatter = match[1];
  const title = getScalar(frontmatter, 'title') || file.replace(/\.mdx$/, '');
  const category = getScalar(frontmatter, 'category');
  const symptoms = getList(frontmatter, 'symptoms');
  const causes = getList(frontmatter, 'causes');
  const { titles, commands } = getSteps(frontmatter);
  const expansion = buildExpansion({ title, category, symptoms, causes, steps: titles, commands });
  const nextBody = body ? `${body}\n\n${expansion}` : expansion;
  const updated = `${match[0]}\n${nextBody}\n`;

  fs.writeFileSync(filePath, updated);
  changed += 1;
}

console.log(`Expanded ${changed} short article bodies`);
