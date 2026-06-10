import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');
const reportsDir = path.join(root, 'reports');
const outJson = path.join(reportsDir, 'article-audit-strict-2026-06-08.json');
const outCsv = path.join(reportsDir, 'article-audit-strict-2026-06-08.csv');
const outMd = path.join(reportsDir, 'article-audit-strict-2026-06-08.md');

const categories = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'categories.json'), 'utf8'));
const categorySlugByName = new Map(categories.map((category) => [category.name, category.slug]));

const genericCauseMarkers = [
  'поврежденный кеш, временные файлы, профиль пользователя',
  'повреждённый кеш, временные файлы, профиль пользователя',
  'неверные права доступа, путь к файлу',
  'конфликт после обновления, несовместимая версия',
  'недоступная сеть, служба, зависимость',
  'загрязнение фильтра, воздуховода, дренажа',
  'неправильная установка, перегрузка, перекос корпуса',
  'износ расходника, датчика, двигателя',
  'загрязнение, застой воды, перегрев, проводка',
];

const genericBodyMarkers = [
  'Используйте материал, если тема совпадает',
  'Если у вас другой код, другая модель или ошибка возникла в другом продукте',
  'Что проверить в первую очередь',
  'Наиболее вероятные причины',
  'Порядок без лишнего риска',
];

const genericSourceTitles = [
  'Product support documentation',
  'Troubleshooting documentation',
  'Technical reference',
  'Official troubleshooting documentation',
  'Vendor support knowledge base',
  'Technical reference documentation',
  'Product support documentation',
];

const forbiddenByCategory = {
  'tvs-audio': ['дренаж', 'помпа', 'шланг', 'уплотнител', 'камера', 'слив', 'стир', 'таблетк'],
  vacuums: ['нагревател', 'духовк', 'конфорк', 'компрессор холодильника'],
  'power-tools': ['дренаж', 'помпа', 'шланг', 'камера', 'слив', 'стир', 'таблетк'],
  printers: ['дренаж', 'помпа', 'шланг', 'слив', 'стир', 'камера'],
  browsers: ['дренаж', 'помпа', 'шланг', 'нагревател', 'фильтр дверцы'],
  docker: ['дверц', 'барабан', 'шланг', 'фильтр насоса', 'нагревател'],
  windows: ['дверц', 'барабан', 'помпа', 'шланг', 'таблетк'],
};

const requiredTopicTerms = {
  windows: ['windows', 'служб', 'драйвер', 'обновлен', 'журнал', 'powershell', 'dism', 'sfc'],
  linux: ['linux', 'systemd', 'journalctl', 'ядр', 'пакет', 'загруз', 'sudo'],
  macos: ['macos', 'finder', 'apple', 'brew', 'launchctl', 'диск'],
  docker: ['docker', 'compose', 'контейнер', 'образ', 'volume', 'registry', 'buildkit'],
  databases: ['sql', 'postgresql', 'mysql', 'mariadb', 'индекс', 'миграц', 'запрос'],
  devops: ['ci', 'pipeline', 'deploy', 'kubernetes', 'runner', 'секрет', 'лог'],
  'web-development': ['node', 'npm', 'vite', 'react', 'next', 'nginx', 'docker', 'pip'],
  programming: ['python', 'java', 'maven', 'gradle', 'venv', 'модуль', 'пакет'],
  network: ['dns', 'dhcp', 'vpn', 'wi-fi', 'ip', 'сеть', 'подключ'],
  security: ['сертификат', 'firewall', 'defender', 'tls', 'ключ', 'доступ'],
  storage: ['диск', 'ssd', 'hdd', 'nvme', 'файлов', 'раздел', 'mount'],
  'bios-uefi': ['bios', 'uefi', 'secure boot', 'tpm', 'nvme', 'загруз'],
  'audio-video': ['звук', 'audio', 'hdmi', 'микрофон', 'кодек', 'bluetooth', 'realtek'],
  office: ['word', 'excel', 'office', 'документ', 'макрос', 'файл'],
  browsers: ['chrome', 'firefox', 'edge', 'браузер', 'расширен', 'кэш', 'сертификат'],
  email: ['imap', 'smtp', 'gmail', 'outlook', 'thunderbird', 'письм', 'почт'],
  design: ['photoshop', 'illustrator', 'figma', 'gpu', 'шрифт', 'экспорт'],
  virtualization: ['vmware', 'virtualbox', 'hyper-v', 'wsl', 'виртуал', 'nat', 'guest'],
  hardware: ['gpu', 'wi-fi', 'драйвер', 'устройств', 'порт', 'кабель', 'nvidia', 'amd'],
  printers: ['принтер', 'печать', 'драйвер', 'картридж', 'скан', 'очеред'],
  mobile: ['android', 'ios', 'приложен', 'синхронизац', 'камера', 'уведомлен'],
  games: ['steam', 'epic', 'игр', 'launcher', 'directx', 'vulkan', 'fps'],
  'washing-machines': ['стиральн', 'барабан', 'слив', 'дверц', 'фильтр', 'отжим'],
  refrigerators: ['холодильник', 'мороз', 'компрессор', 'датчик', 'дренаж', 'камера'],
  dishwashers: ['посудомоеч', 'посуд', 'слив', 'таблетк', 'фильтр', 'разбрызг'],
  'microwaves-ovens': ['микроволнов', 'духовк', 'гриль', 'тарелк', 'нагрев', 'искр'],
  'ac-heating': ['кондиционер', 'обогрев', 'дренаж', 'фильтр', 'сплит', 'компрессор'],
  'tvs-audio': ['телевизор', 'tv', 'hdmi', 'звук', 'изображен', 'пульт', 'экран', 'подсвет'],
  vacuums: ['пылесос', 'робот', 'щетк', 'карта', 'датчик', 'база', 'всасыв'],
  'power-tools': ['шуруповерт', 'дрель', 'болгарк', 'перфоратор', 'патрон', 'аккумулятор', 'двигател'],
};

const brandHosts = {
  samsung: ['samsung.com'],
  lg: ['lg.com'],
  sony: ['sony.com'],
  bosch: ['bosch-home.com', 'bosch-home.ru', 'boschtools.com'],
  siemens: ['siemens-home.bsh-group.com'],
  electrolux: ['electrolux.com'],
  xiaomi: ['mi.com', 'xiaomi.com'],
  roborock: ['roborock.com'],
  dreame: ['dreame.tech', 'dreame.com'],
  hp: ['hp.com'],
  canon: ['canon.com'],
  epson: ['epson.com'],
  brother: ['brother.com'],
  makita: ['makitatools.com', 'makita.com'],
  dewalt: ['dewalt.com'],
  daikin: ['daikin.com'],
  mitsubishi: ['mitsubishielectric.com'],
};

function plain(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[`*_>#()[\]{}.,:;!?'"\\/|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function sourceHost(source) {
  try {
    return new URL(source.url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function hasAny(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

function detectBrand(file, data) {
  const text = plain(`${file} ${data.title} ${asArray(data.tags).join(' ')}`);
  return Object.keys(brandHosts).find((brand) => text.includes(brand)) || '';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function addIssue(record, severity, code, message) {
  record.issues.push({ severity, code, message });
}

function severityRank(severity) {
  return { blocker: 4, major: 3, medium: 2, minor: 1 }[severity] || 0;
}

function classify(record) {
  const maxSeverity = Math.max(0, ...record.issues.map((issue) => severityRank(issue.severity)));
  if (maxSeverity >= 4) return 'blocker';
  if (maxSeverity >= 3) return 'fix';
  if (maxSeverity >= 2) return 'review';
  return 'pass';
}

const files = fs.readdirSync(articlesDir).filter((file) => file.endsWith('.mdx')).sort((a, b) => a.localeCompare(b));
const records = [];

for (const file of files) {
  const fullPath = path.join(articlesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const record = {
    file,
    path: path.relative(root, fullPath).replaceAll(path.sep, '/'),
    title: '',
    category: '',
    categorySlug: '',
    bodyChars: 0,
    steps: 0,
    sources: 0,
    action: 'pass',
    issues: [],
  };

  try {
    const parsed = matter(content);
    const data = parsed.data || {};
    const body = parsed.content || '';
    const allText = plain([
      data.title,
      data.description,
      asArray(data.symptoms).join(' '),
      asArray(data.causes).join(' '),
      asArray(data.steps).map((step) => `${step.title} ${step.body} ${step.command || ''}`).join(' '),
      body,
    ].join(' '));

    record.title = data.title || '';
    record.category = data.category || '';
    record.categorySlug = categorySlugByName.get(record.category) || '';
    record.bodyChars = body.trim().length;
    record.steps = asArray(data.steps).length;
    record.sources = asArray(data.sources).length;

    if (!record.title || !record.category || !data.description || record.steps < 5 || record.sources < 3) {
      addIssue(record, 'blocker', 'missing-core-content', 'required title/category/description/steps/sources are incomplete');
    }

    if (/^Короткая инструкция по теме:/i.test(String(data.description || '').trim())) {
      addIssue(record, 'major', 'templated-description', 'description starts with a generic template phrase');
    }

    const bodyMarkerHits = genericBodyMarkers.filter((marker) => body.includes(marker)).length;
    const stepTitleHits = asArray(data.steps).filter((step) => step.title && body.includes(step.title)).length;
    if (bodyMarkerHits >= 3 || (body.includes('## Порядок без лишнего риска') && stepTitleHits >= 3)) {
      addIssue(record, 'major', 'duplicated-frontmatter-in-body', 'MDX body repeats symptoms/causes/steps already rendered from frontmatter');
    }

    const genericCauseHits = asArray(data.causes).filter((cause) => {
      const text = plain(cause);
      return genericCauseMarkers.some((marker) => text.includes(plain(marker)));
    }).length;
    if (genericCauseHits >= 2) {
      addIssue(record, 'major', 'generic-causes', `${genericCauseHits} causes are broad template causes`);
    }

    const slug = record.categorySlug;
    if (slug && requiredTopicTerms[slug] && !hasAny(allText, requiredTopicTerms[slug])) {
      addIssue(record, 'major', 'low-category-specificity', `content does not contain enough terms for category ${slug}`);
    }

    const forbiddenHits = slug && forbiddenByCategory[slug]
      ? forbiddenByCategory[slug].filter((term) => allText.includes(term))
      : [];
    if (forbiddenHits.length >= 2) {
      addIssue(record, 'major', 'cross-topic-terminology', `contains likely unrelated terms: ${forbiddenHits.join(', ')}`);
    }

    const sourceTitles = asArray(data.sources).map((source) => String(source.title || ''));
    const genericSourceHits = sourceTitles.filter((title) => genericSourceTitles.includes(title)).length;
    if (genericSourceHits >= 2) {
      addIssue(record, 'major', 'generic-source-titles', `${genericSourceHits} sources use generic titles`);
    }

    const brand = detectBrand(file, data);
    if (brand) {
      const allowedHosts = brandHosts[brand];
      const competitorHosts = asArray(data.sources)
        .map(sourceHost)
        .filter((host) => Object.entries(brandHosts).some(([otherBrand, hosts]) => otherBrand !== brand && hosts.some((allowed) => host.endsWith(allowed))));
      const hasOwnSource = asArray(data.sources)
        .map(sourceHost)
        .some((host) => allowedHosts.some((allowed) => host.endsWith(allowed)));
      if (competitorHosts.length > 0 && !hasOwnSource) {
        addIssue(record, 'major', 'brand-source-mismatch', `brand ${brand} article lacks own official source and cites ${competitorHosts.join(', ')}`);
      } else if (competitorHosts.length > 0) {
        addIssue(record, 'medium', 'competitor-source-noise', `brand ${brand} article cites competitor support hosts: ${competitorHosts.join(', ')}`);
      }
    }

    const stopwordTags = asArray(data.tags).filter((tag) => ['не', 'или', 'и', 'в', 'на', 'сбой', 'ошибка'].includes(plain(tag)));
    if (stopwordTags.length > 0) {
      addIssue(record, 'medium', 'low-value-tags', `low-value tags: ${stopwordTags.join(', ')}`);
    }

    if (file.length > 125) {
      addIssue(record, 'medium', 'long-url-slug', `filename is ${file.length} characters`);
    }

    record.action = classify(record);
  } catch (error) {
    addIssue(record, 'blocker', 'parse-error', error.message);
    record.action = classify(record);
  }

  records.push(record);
}

const actions = ['pass', 'review', 'fix', 'blocker'];
const summary = Object.fromEntries(actions.map((action) => [action, records.filter((record) => record.action === action).length]));
const issueCounts = {};
for (const record of records) {
  for (const issue of record.issues) issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
}

const sorted = [...records].sort((a, b) =>
  actions.indexOf(b.action) - actions.indexOf(a.action) ||
  b.issues.length - a.issues.length ||
  a.file.localeCompare(b.file)
);

const csvRows = [
  ['action', 'file', 'title', 'category', 'steps', 'sources', 'issues'].map(csvCell).join(','),
  ...sorted.map((record) =>
    [
      record.action,
      record.path,
      record.title,
      record.category,
      record.steps,
      record.sources,
      record.issues.map((issue) => `${issue.severity}:${issue.code}:${issue.message}`).join('; '),
    ].map(csvCell).join(',')
  ),
];

const issueRows = Object.entries(issueCounts)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([code, count]) => `| ${code} | ${count} |`)
  .join('\n');

const sampleRows = sorted
  .filter((record) => record.action !== 'pass')
  .slice(0, 50)
  .map((record) => `| ${record.action} | \`${record.path}\` | ${record.title.replaceAll('|', '\\|')} | ${record.issues.map((issue) => issue.code).join(', ')} |`)
  .join('\n');

const md = `# Strict article quality audit, 2026-06-08

Checked files: ${records.length}

## Summary

| Action | Count |
| --- | ---: |
| pass | ${summary.pass} |
| review | ${summary.review} |
| fix | ${summary.fix} |
| blocker | ${summary.blocker} |

## Issue Counts

| Issue | Count |
| --- | ---: |
${issueRows || '| - | 0 |'}

## First Files To Fix

| Action | File | Title | Issues |
| --- | --- | --- | --- |
${sampleRows || '| pass | - | - | - |'}
`;

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outJson, JSON.stringify({ summary, issueCounts, records }, null, 2));
fs.writeFileSync(outCsv, `${csvRows.join('\n')}\n`);
fs.writeFileSync(outMd, md);

console.log(`files\t${records.length}`);
for (const action of actions) console.log(`${action}\t${summary[action]}`);
console.log(`report\t${path.relative(root, outMd)}`);
console.log(`csv\t${path.relative(root, outCsv)}`);
console.log(`json\t${path.relative(root, outJson)}`);
