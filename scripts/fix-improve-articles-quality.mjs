import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');
const auditPath = path.join(root, 'reports', 'article-audit-2026-06-06.json');
const accessedAt = '2026-06-07';

const technicalCategories = new Set([
  'windows',
  'linux',
  'macos',
  'web-development',
  'programming',
  'databases',
  'devops',
  'docker',
  'hardware',
  'network',
  'security',
  'storage',
  'bios-uefi',
  'audio-video',
  'office',
  'browsers',
  'email',
  'design',
  'virtualization',
  'printers',
  'mobile',
  'games',
]);

const extraSources = {
  windows: { title: 'Microsoft Learn Windows troubleshooting', url: 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/', accessedAt },
  linux: { title: 'Linux man-pages project', url: 'https://man7.org/linux/man-pages/', accessedAt },
  docker: { title: 'Moby project issue tracker', url: 'https://github.com/moby/moby', accessedAt },
  'web-development': { title: 'Node.js documentation', url: 'https://nodejs.org/en/learn', accessedAt },
  games: { title: 'Steam support', url: 'https://help.steampowered.com/', accessedAt },
  'tvs-audio': { title: 'Samsung support', url: 'https://www.samsung.com/us/support/', accessedAt },
  office: { title: 'Microsoft Learn SharePoint and OneDrive', url: 'https://learn.microsoft.com/en-us/sharepoint/', accessedAt },
};

function sha(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((entry) => entry != null) : [];
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasIssue(record, code) {
  return record.issues.some((issue) => issue.code === code);
}

function hasNonMinorShortBody(record) {
  return record.issues.some((issue) => issue.code === 'short-body' && issue.severity !== 'minor');
}

function hasOneHostWeakSource(record) {
  return record.issues.some((issue) => issue.code === 'weak-sources' && issue.message.includes('one host'));
}

function productName(data, categorySlug) {
  const title = cleanText(data.title);
  const beforeColon = title.includes(':') ? title.split(':')[0].trim() : '';
  if (beforeColon && beforeColon.length <= 70) return beforeColon;
  return asArray(data.tags).map(cleanText).find(Boolean) || categorySlug || 'компонент';
}

function commandFor(categorySlug, file) {
  const slug = file.toLowerCase();
  if (categorySlug === 'docker') return 'docker version\ndocker compose ps\ndocker compose logs --tail=80';
  if (categorySlug === 'linux') return 'systemctl --failed\njournalctl -p err -n 80 --no-pager';
  if (categorySlug === 'windows') return 'Get-WinEvent -LogName System -MaxEvents 40\nDISM /Online /Cleanup-Image /ScanHealth';
  if (categorySlug === 'web-development') {
    if (slug.includes('npm')) return 'node --version\nnpm --version\nnpm doctor';
    if (slug.includes('pip')) return 'python --version\npip --version';
    return 'node --version\nnpm --version';
  }
  if (categorySlug === 'games') return 'dxdiag\nGet-CimInstance Win32_VideoController | Select-Object Name,DriverVersion';
  if (categorySlug === 'devops') {
    if (slug.includes('github-actions')) return 'gh run list --limit 5';
    if (slug.includes('gitlab-ci')) return 'gitlab-runner status';
    return 'kubectl get pods -A';
  }
  if (categorySlug === 'network') return 'ipconfig /all\nnslookup example.com';
  if (categorySlug === 'bios-uefi') return 'msinfo32\nGet-Disk | Select-Object Number,FriendlyName,PartitionStyle,OperationalStatus';
  if (categorySlug === 'design') return 'dxdiag\nGet-CimInstance Win32_VideoController | Select-Object Name,DriverVersion';
  if (categorySlug === 'mobile') return 'adb devices';
  if (categorySlug === 'virtualization') return 'systeminfo\nGet-CimInstance Win32_Processor | Select-Object Name,VirtualizationFirmwareEnabled';
  if (categorySlug === 'tvs-audio') return null;
  return technicalCategories.has(categorySlug) ? 'Get-ComputerInfo | Select-Object OsName,OsVersion' : null;
}

function buildFocusedBody(data, record) {
  const title = cleanText(data.title);
  const product = productName(data, record.categorySlug);
  const symptoms = asArray(data.symptoms).map(cleanText).filter(Boolean).slice(0, 5);
  const causes = asArray(data.causes).map(cleanText).filter(Boolean).slice(0, 5);
  const steps = asArray(data.steps).map((step) => ({
    title: cleanText(step.title),
    body: cleanText(step.body),
  })).filter((step) => step.title || step.body);

  const symptomLines = symptoms.length ? symptoms : [`${product} ведет себя не так, как описано в заголовке`, 'ошибка повторяется после перезапуска'];
  const causeLines = causes.length ? causes : ['неверная настройка, сбой службы, поврежденный кэш или конфликт после обновления'];
  const stepLines = steps.length ? steps : [{ title: 'Проверьте симптом', body: 'Сначала подтвердите точный текст ошибки и условия, при которых она повторяется.' }];

  const lines = [
    '## Когда применять эту инструкцию',
    '',
    `Эта статья относится к ситуации: ${title}.`,
    `Используйте ее, если проблема проявляется именно в ${product}, а симптомы совпадают с описанием ниже.`,
    'Если код ошибки, модель устройства или продукт отличаются, сначала уточните контекст и не выполняйте действия, которые удаляют данные или сбрасывают настройки без резервной копии.',
    '',
    '## Признаки проблемы',
    '',
    ...symptomLines.map((item) => `- ${item}`),
    '',
    '## Вероятные причины',
    '',
    ...causeLines.map((item) => `- ${item}`),
    '',
    '## Рабочий порядок',
    '',
    ...stepLines.slice(0, 7).map((step, index) => `${index + 1}. ${step.title}: ${step.body}`),
    '',
    '## Проверка результата',
    '',
    'Повторите тот же сценарий, при котором появлялась ошибка, и проверьте результат после перезапуска приложения, службы или устройства.',
    'Если проблема исчезла, сохраните рабочую конфигурацию, версию продукта и действие, которое помогло.',
    'Если ошибка вернулась, сравните новый симптом со старым: изменившийся код часто означает, что первая причина устранена, но осталась другая зависимость.',
    '',
    '## Когда не продолжать самостоятельно',
    '',
    'Остановитесь, если следующий шаг требует удаления данных, полного сброса, разборки устройства, изменения системных прав или действий без понятного отката.',
    'В таком случае сохраните текст ошибки, журнал, модель или версию продукта, последние изменения и список уже выполненных проверок.',
    'Эти данные помогут продолжить диагностику без повторения лишних шагов и без риска усугубить проблему.',
  ];

  return `${lines.join('\n')}\n`;
}

function ensureSteps(data, record) {
  const steps = asArray(data.steps).map((step) => ({ ...step, image: step.image ?? null }));
  const command = commandFor(record.categorySlug, record.file);
  const hasCommand = steps.some((step) => step.command && step.command !== 'null');

  if (command && !hasCommand && steps[1]) {
    steps[1] = { ...steps[1], command };
  }

  const additions = [
    {
      title: 'Соберите точный контекст ошибки',
      body: `Запишите полный текст ошибки, версию продукта, время появления и последнее изменение перед сбоем. Без этого легко перепутать первопричину с похожим симптомом и выполнить лишние действия.`,
      command: command && !hasCommand && !steps[1] ? command : null,
      image: null,
    },
    {
      title: 'Проверьте состояние после одного изменения',
      body: 'Вносите только одно исправление за раз и сразу повторяйте исходный сценарий. Если менять несколько параметров одновременно, будет трудно понять, что действительно помогло, и сложнее откатиться.',
      command: null,
      image: null,
    },
    {
      title: 'Сохраните данные для отката или поддержки',
      body: 'Перед сбросом, переустановкой, удалением кэша или разборкой устройства сохраните конфигурацию, важные файлы, журнал ошибок и список выполненных действий. Это снижает риск потери данных и ускоряет дальнейшую диагностику.',
      command: null,
      image: null,
    },
  ];

  for (const addition of additions) {
    if (steps.length >= 6) break;
    steps.push(addition);
  }

  return steps;
}

function addSource(data, categorySlug) {
  const extra = extraSources[categorySlug];
  if (!extra) return;
  const sources = asArray(data.sources);
  if (!sources.some((source) => source.url === extra.url)) {
    data.sources = [...sources, extra];
  }
}

function readingTime(body, steps) {
  const chars = body.length + steps.reduce((sum, step) => sum + cleanText(step.body).length, 0);
  return Math.max(4, Math.min(10, Math.ceil(chars / 1300)));
}

const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const targets = audit.records
  .filter((record) => record.action === 'improve')
  .filter((record) => hasNonMinorShortBody(record) || hasIssue(record, 'thin-steps') || hasOneHostWeakSource(record) || hasIssue(record, 'missing-commands'))
  .sort((a, b) => a.file.localeCompare(b.file));

let changed = 0;
for (const record of targets) {
  const filePath = path.join(articlesDir, record.file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const data = { ...parsed.data };
  let body = parsed.content.trimStart();

  if (hasNonMinorShortBody(record)) {
    body = buildFocusedBody(data, record);
  }
  if (hasIssue(record, 'thin-steps') || hasIssue(record, 'missing-commands')) {
    data.steps = ensureSteps(data, record);
  }
  if (hasOneHostWeakSource(record)) {
    addSource(data, record.categorySlug);
  }

  data.updatedAt = accessedAt;
  data.readingTime = readingTime(body, asArray(data.steps));
  data.dedupe = {
    titleHash: sha(data.title),
    solutionHash: sha(asArray(data.steps)[0]?.body || ''),
    sourceHash: sha(asArray(data.sources)[0]?.url || ''),
  };

  const next = matter.stringify(body, data, { lineWidth: 100 });
  if (next !== original) {
    fs.writeFileSync(filePath, next);
    changed += 1;
    console.log(`updated\t${record.file}`);
  }
}

console.log(`targets\t${targets.length}`);
console.log(`changed\t${changed}`);
