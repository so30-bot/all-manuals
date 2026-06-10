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

const applianceCategories = new Set([
  'washing-machines',
  'refrigerators',
  'dishwashers',
  'microwaves-ovens',
  'ac-heating',
  'tvs-audio',
  'vacuums',
  'power-tools',
]);

const issueRules = [
  {
    key: '0x80070002',
    label: 'ошибка Windows Update 0x80070002',
    symptom: 'обновление Windows завершается кодом 0x80070002 или сообщением о ненайденном файле',
    cause: 'поврежденный кэш Центра обновления, отсутствующие временные файлы или ошибка системного хранилища компонентов',
  },
  {
    key: 'wont-start',
    label: 'не запускается',
    symptom: 'компонент не открывается, сразу закрывается или зависает на запуске',
    cause: 'поврежденный кэш, конфликт версии, недоступная служба или ошибка конфигурации',
  },
  {
    key: 'crashes-after-update',
    label: 'вылетает после обновления',
    symptom: 'сбой появился сразу после обновления приложения, системы, драйвера или пакета',
    cause: 'несовместимая версия, поврежденный профиль, изменившаяся зависимость или неудачная миграция настроек',
  },
  {
    key: 'config-error',
    label: 'ошибка конфигурации',
    symptom: 'ошибка появляется при чтении настроек, переменных окружения, профиля или файла конфигурации',
    cause: 'неверный параметр, устаревший формат, неправильный путь или конфликт нескольких конфигураций',
  },
  {
    key: 'permission-denied',
    label: 'отказано в доступе',
    symptom: 'операция прерывается сообщением о недостаточных правах или запрете доступа',
    cause: 'неверный владелец файла, заблокированная папка, политика безопасности или запуск не от нужного пользователя',
  },
  {
    key: 'network-timeout',
    label: 'тайм-аут подключения',
    symptom: 'подключение долго ожидает ответ и завершается тайм-аутом',
    cause: 'DNS, прокси, firewall, недоступный сервер, TLS-сбой или нестабильная сеть',
  },
  {
    key: 'sync-failed',
    label: 'не синхронизируется',
    symptom: 'данные не доходят до сервера или не обновляются между устройствами',
    cause: 'ошибка авторизации, конфликт локального кэша, недоступный API или ограничение сети',
  },
  {
    key: 'update-failed',
    label: 'ошибка обновления',
    symptom: 'обновление не устанавливается, откатывается или зависает на проверке',
    cause: 'поврежденные временные файлы, нехватка места, несовместимая версия или заблокированный установщик',
  },
  {
    key: 'high-cpu',
    label: 'высокая нагрузка на процессор',
    symptom: 'процесс долго держит высокую нагрузку CPU, система тормозит или быстро разряжается батарея',
    cause: 'зацикленный процесс, индексирование, конфликт расширения, поврежденный кэш или слишком тяжелая задача',
  },
  {
    key: 'not-detected',
    label: 'не определяется',
    symptom: 'устройство, сервис или функция не отображается там, где должна быть видна',
    cause: 'драйвер, кабель, порт, разрешение, отключенная служба или конфликт прошивки',
  },
  {
    key: 'driver-error',
    label: 'ошибка драйвера',
    symptom: 'система показывает ошибку драйвера, устройство работает нестабильно или не запускается',
    cause: 'несовместимый драйвер, поврежденный пакет, конфликт после обновления или неверная версия прошивки',
  },
  {
    key: 'low-performance',
    label: 'низкая производительность',
    symptom: 'работа стала заметно медленнее, появляются задержки, рывки или зависания',
    cause: 'перегрев, фоновая нагрузка, устаревший драйвер, нехватка ресурсов или неправильный режим питания',
  },
  {
    key: 'disconnects-randomly',
    label: 'самопроизвольно отключается',
    symptom: 'соединение или устройство отключается без понятной закономерности',
    cause: 'нестабильное питание, кабель, энергосбережение, перегрев или слабый сигнал',
  },
  {
    key: 'firmware-update-failed',
    label: 'ошибка обновления прошивки',
    symptom: 'прошивка не устанавливается, зависает или устройство не подтверждает обновление',
    cause: 'неподходящий файл прошивки, прерванное питание, несовместимая версия или ошибка загрузчика',
  },
  {
    key: 'does-not-drain',
    label: 'не сливает воду',
    symptom: 'вода остается внутри или программа завершается ошибкой слива',
    cause: 'засор фильтра, шланга, помпы, сифона или датчика уровня воды',
  },
  {
    key: 'does-not-heat',
    label: 'не греет',
    symptom: 'вода, воздух или рабочая камера не нагреваются до нужной температуры',
    cause: 'нагревательный элемент, термодатчик, реле, режим защиты или ошибка платы управления',
  },
  {
    key: 'leaks-water',
    label: 'протекает',
    symptom: 'под корпусом, дверцей, шлангом или соединением появляется вода',
    cause: 'уплотнитель, шланг, фильтр, перелив, засор или неправильная установка',
  },
  {
    key: 'bad-smell',
    label: 'появился запах',
    symptom: 'появился запах гари, сырости, плесени или перегретого пластика',
    cause: 'загрязнение, застой воды, перегрев, проводка, фильтр или остатки внутри камеры',
  },
  {
    key: 'makes-noise',
    label: 'шумит',
    symptom: 'слышны новые щелчки, скрежет, гул, вибрация или удары',
    cause: 'крепление, посторонний предмет, износ подшипника, вентилятор, насос или неправильная установка',
  },
  {
    key: 'stops-mid-cycle',
    label: 'останавливается во время работы',
    symptom: 'цикл прерывается до завершения, устройство зависает или уходит в защиту',
    cause: 'перегрузка, перегрев, датчик, засор, питание или ошибка управляющей платы',
  },
  {
    key: 'wont-turn-on',
    label: 'не включается',
    symptom: 'нет реакции на кнопку питания, индикаторы не горят или запуск сразу прерывается',
    cause: 'розетка, кабель, блок питания, защита, перегрев или плата управления',
  },
  {
    key: 'error-code',
    label: 'показывает код ошибки',
    symptom: 'на дисплее, индикаторах или в приложении отображается код ошибки',
    cause: 'датчик, блокировка, засор, перегрев, связь модулей или сбой управляющей платы',
  },
];

const categorySourceTitles = {
  windows: ['Microsoft Windows troubleshooting', 'Windows support documentation', 'Windows deployment documentation'],
  linux: ['Linux man pages', 'Distribution troubleshooting documentation', 'Linux system logs reference'],
  macos: ['Apple macOS support', 'Mac Help user guide', 'Apple Disk Utility support'],
  docker: ['Docker documentation', 'Docker Compose documentation', 'Docker Engine documentation'],
  devops: ['CI/CD product documentation', 'Deployment troubleshooting documentation', 'Cloud platform documentation'],
  databases: ['Database server documentation', 'SQL troubleshooting documentation', 'Database administration guide'],
  programming: ['Runtime documentation', 'Package manager documentation', 'Build tool documentation'],
  'web-development': ['Web framework documentation', 'Node.js documentation', 'Package manager documentation'],
  network: ['Network troubleshooting documentation', 'DNS and connectivity documentation', 'Operating system network tools'],
  security: ['Security product documentation', 'Firewall troubleshooting documentation', 'Endpoint protection documentation'],
  browsers: ['Browser support documentation', 'Browser profile troubleshooting', 'Network settings documentation'],
  email: ['Email client support documentation', 'Mail protocol documentation', 'Account configuration documentation'],
  office: ['Microsoft Office support', 'Office repair documentation', 'Document recovery documentation'],
  design: ['Application support documentation', 'GPU troubleshooting documentation', 'Creative app preferences documentation'],
  virtualization: ['Virtualization platform documentation', 'Hypervisor troubleshooting documentation', 'Guest tools documentation'],
  hardware: ['Hardware vendor support', 'Driver troubleshooting documentation', 'Device manager documentation'],
  storage: ['Storage troubleshooting documentation', 'Filesystem documentation', 'Backup documentation'],
  'bios-uefi': ['Firmware setup documentation', 'Secure Boot documentation', 'Storage boot documentation'],
  'audio-video': ['Audio device troubleshooting', 'Video device troubleshooting', 'Driver support documentation'],
  printers: ['Printer support documentation', 'Driver installation documentation', 'Print queue troubleshooting'],
  mobile: ['Android support documentation', 'iPhone support documentation', 'Mobile sync documentation'],
  games: ['Game launcher support', 'Graphics driver support', 'Game troubleshooting documentation'],
};

const extraSources = {
  windows: { title: 'Microsoft Learn Windows troubleshooting', url: 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/', accessedAt },
  linux: { title: 'Linux man-pages project', url: 'https://man7.org/linux/man-pages/', accessedAt },
  macos: { title: 'Apple Developer documentation', url: 'https://developer.apple.com/documentation/', accessedAt },
  docker: { title: 'Moby project issue tracker', url: 'https://github.com/moby/moby', accessedAt },
  devops: { title: 'Kubernetes troubleshooting documentation', url: 'https://kubernetes.io/docs/tasks/debug/', accessedAt },
  databases: { title: 'PostgreSQL documentation', url: 'https://www.postgresql.org/docs/', accessedAt },
  programming: { title: 'Git documentation', url: 'https://git-scm.com/doc', accessedAt },
  'web-development': { title: 'Node.js documentation', url: 'https://nodejs.org/en/learn', accessedAt },
  network: { title: 'Microsoft network troubleshooting', url: 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/', accessedAt },
  security: { title: 'Microsoft Defender documentation', url: 'https://learn.microsoft.com/en-us/defender-endpoint/', accessedAt },
  browsers: { title: 'Mozilla browser support', url: 'https://support.mozilla.org/products/firefox', accessedAt },
  email: { title: 'Mozilla Thunderbird support', url: 'https://support.mozilla.org/products/thunderbird', accessedAt },
  office: { title: 'Microsoft Office support', url: 'https://support.microsoft.com/office', accessedAt },
  design: { title: 'Adobe help center', url: 'https://helpx.adobe.com/support.html', accessedAt },
  virtualization: { title: 'VirtualBox manual', url: 'https://www.virtualbox.org/manual/', accessedAt },
  hardware: { title: 'Microsoft device manager troubleshooting', url: 'https://support.microsoft.com/windows', accessedAt },
  storage: { title: 'Microsoft storage troubleshooting', url: 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/backup-and-storage/', accessedAt },
  'bios-uefi': { title: 'Microsoft Secure Boot documentation', url: 'https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/oem-secure-boot', accessedAt },
  'audio-video': { title: 'Microsoft sound troubleshooting', url: 'https://support.microsoft.com/windows/fix-sound-or-audio-problems-in-windows', accessedAt },
  printers: { title: 'Microsoft printer troubleshooting', url: 'https://support.microsoft.com/windows/fix-printer-connection-and-printing-problems-in-windows', accessedAt },
  mobile: { title: 'Android Help', url: 'https://support.google.com/android/', accessedAt },
  games: { title: 'Steam support', url: 'https://help.steampowered.com/', accessedAt },
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

function sentence(value) {
  const text = cleanText(value);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function firstMeaningful(values, fallback) {
  return asArray(values).map(cleanText).find(Boolean) || fallback;
}

function detectIssue(file, data) {
  const haystack = `${file} ${data.title || ''} ${asArray(data.tags).join(' ')} ${asArray(data.symptoms).join(' ')}`.toLowerCase();
  return issueRules.find((rule) => haystack.includes(rule.key)) || {
    key: 'general',
    label: 'сбой в работе',
    symptom: firstMeaningful(data.symptoms, 'ошибка повторяется при обычном сценарии работы'),
    cause: firstMeaningful(data.causes, 'неверная настройка, сбой службы, поврежденный кэш или конфликт после изменений'),
  };
}

function productName(data, categorySlug) {
  const title = cleanText(data.title);
  const beforeColon = title.includes(':') ? title.split(':')[0].trim() : '';
  if (beforeColon && beforeColon.length <= 70 && !/^ошибка\s/i.test(beforeColon)) return beforeColon;

  const tag = asArray(data.tags).map(cleanText).find((entry) => entry && !/ошибка|решение|fix/i.test(entry));
  if (tag) return tag;

  const fallbackByCategory = {
    windows: 'Windows',
    linux: 'Linux',
    macos: 'macOS',
    docker: 'Docker',
    databases: 'сервер базы данных',
    devops: 'CI/CD или облачный сервис',
    'web-development': 'веб-приложение',
    programming: 'проект',
    network: 'сетевое подключение',
    security: 'защитный компонент',
    browsers: 'браузер',
    email: 'почтовый клиент',
    office: 'офисное приложение',
    design: 'графическое приложение',
    virtualization: 'виртуальная машина',
    hardware: 'устройство',
    storage: 'накопитель',
    'bios-uefi': 'BIOS/UEFI',
    'audio-video': 'аудио- или видеоустройство',
    printers: 'принтер или сканер',
    mobile: 'мобильное устройство',
    games: 'игра или лаунчер',
  };

  return fallbackByCategory[categorySlug] || cleanText(data.category) || 'устройство';
}

function commandSet(categorySlug, file) {
  const slug = file.toLowerCase();
  if (categorySlug === 'windows' && slug.includes('0x80070002')) {
    return [
      'Get-WinEvent -LogName System -MaxEvents 40 | Select-Object TimeCreated,ProviderName,Id,LevelDisplayName,Message',
      'DISM /Online /Cleanup-Image /ScanHealth\nsfc /verifyonly',
    ];
  }
  if (categorySlug === 'windows') {
    return ['Get-WinEvent -LogName System -MaxEvents 40', 'DISM /Online /Cleanup-Image /ScanHealth\nsfc /verifyonly'];
  }
  if (categorySlug === 'linux') {
    return ['systemctl --failed\njournalctl -p err -n 80 --no-pager', 'df -h\nfree -h'];
  }
  if (categorySlug === 'macos') {
    return ['sw_vers\nlog show --last 1h --predicate \'eventMessage CONTAINS[c] "error"\' --style compact', 'df -h'];
  }
  if (categorySlug === 'docker') {
    return ['docker version\ndocker compose config', 'docker compose ps\ndocker compose logs --tail=80'];
  }
  if (categorySlug === 'devops') {
    if (slug.includes('github-actions')) return ['gh run list --limit 5', 'gh run view <run-id> --log'];
    if (slug.includes('gitlab-ci')) return ['gitlab-runner status', 'gitlab-runner verify'];
    if (slug.includes('kubernetes')) return ['kubectl get pods -A', 'kubectl describe pod <pod> -n <namespace>'];
    return ['systemctl --failed', 'journalctl -p err -n 80 --no-pager'];
  }
  if (categorySlug === 'databases') {
    return ['systemctl --failed\nss -lntp', 'journalctl -p err -n 80 --no-pager'];
  }
  if (categorySlug === 'web-development' || categorySlug === 'programming') {
    return ['node --version\nnpm --version\ngit status --short', 'npm doctor'];
  }
  if (categorySlug === 'network') {
    return ['ipconfig /all\nnslookup example.com', 'Test-NetConnection example.com -Port 443'];
  }
  if (categorySlug === 'email') {
    return ['nslookup -type=mx example.com', 'Test-NetConnection smtp.example.com -Port 587'];
  }
  if (categorySlug === 'security') {
    return ['Get-MpComputerStatus\nGet-NetFirewallProfile', 'Get-WinEvent -LogName System -MaxEvents 40'];
  }
  if (categorySlug === 'storage') {
    return ['Get-Disk\nGet-Volume', 'Get-WinEvent -LogName System -MaxEvents 40'];
  }
  if (categorySlug === 'bios-uefi') {
    return ['msinfo32', 'Get-Disk | Select-Object Number,FriendlyName,PartitionStyle,OperationalStatus'];
  }
  if (categorySlug === 'hardware' || categorySlug === 'audio-video' || categorySlug === 'printers') {
    return ['Get-PnpDevice -PresentOnly', 'Get-CimInstance Win32_PnPSignedDriver | Select-Object DeviceName,DriverVersion'];
  }
  if (categorySlug === 'browsers') {
    return ['ipconfig /flushdns\nnetsh winhttp show proxy', 'Get-Process | Where-Object ProcessName -match "chrome|msedge|firefox"'];
  }
  if (categorySlug === 'office' || categorySlug === 'design') {
    return ['Get-WinEvent -LogName Application -MaxEvents 40', 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10'];
  }
  if (categorySlug === 'virtualization') {
    return ['systeminfo', 'Get-CimInstance Win32_Processor | Select-Object Name,VirtualizationFirmwareEnabled'];
  }
  if (categorySlug === 'mobile') {
    return ['adb devices', 'Get-PnpDevice -PresentOnly | Where-Object FriendlyName -match "Android|iPhone|Apple"'];
  }
  if (categorySlug === 'games') {
    return ['dxdiag', 'Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion'];
  }
  return [];
}

function technicalSteps(categorySlug, file, product, issue) {
  const commands = commandSet(categorySlug, file);
  const diagnostics = commands[0] || null;
  const deeperCheck = commands[1] || null;

  if (categorySlug === 'docker') {
    return [
      step('Проверьте compose-файл и версию Docker', `${product}: ${issue.label}. Начните с проверки, что Docker Engine доступен, а compose-файл читается без ошибок. Команда docker compose config должна завершиться успешно; если она показывает строку и номер ошибки, исправляйте именно этот параметр, а не пересоздавайте контейнеры вслепую.`, diagnostics),
      step('Посмотрите состояние сервисов и последние логи', `Сравните, какие сервисы находятся в состоянии exited, unhealthy или restarting. Логи нужны за тот же период, когда проявляется симптом: так проще отделить ошибку приложения внутри контейнера от ошибки сети, volume, образа или healthcheck.`, deeperCheck),
      step('Проверьте переменные окружения и пути', `Убедитесь, что .env, volumes, относительные пути и имена сетей совпадают с текущим каталогом проекта. Для ${product} частая причина сбоя - compose-файл ссылается на файл, сеть или volume, которых уже нет после переноса проекта.`),
      step('Исключите проблему образа или registry', `Если сбой связан с pull, build или запуском после обновления, проверьте тег образа и доступ к registry. Не используйте latest для проверки гипотезы: временно закрепите конкретный тег, чтобы понять, изменилась ли проблема из-за новой сборки.`),
      step('Перезапускайте только затронутый сервис', `Не удаляйте все volumes и контейнеры сразу. Перезапустите один сервис, у которого есть ошибка, и проверьте результат. Удаление volume допустимо только после резервной копии данных и подтверждения, что проблема именно в состоянии этого volume.`),
      step('Зафиксируйте рабочую конфигурацию', `Когда ${product} снова работает, сохраните compose-файл, .env без секретов, версии образов и фрагмент логов. Это позволит откатиться к рабочему состоянию, если ошибка вернется после следующего обновления.`),
    ];
  }

  if (categorySlug === 'windows' && file.toLowerCase().includes('0x80070002')) {
    return [
      step('Проверьте журналы Windows Update', `Ошибка 0x80070002 обычно означает, что Windows не нашла нужный файл обновления или не смогла прочитать часть кэша. Сначала соберите события Windows Update и системные ошибки за последние попытки установки, чтобы не лечить не тот компонент.`, diagnostics),
      step('Проверьте хранилище компонентов без удаления данных', `Запустите проверку DISM и SFC в режиме диагностики. Если ScanHealth или verifyonly сообщает о повреждениях, переходите к восстановлению системных файлов; если повреждений нет, фокусируйтесь на кэше обновлений, свободном месте и сети.`, deeperCheck),
      step('Убедитесь, что хватает места и работает сеть', `Проверьте свободное место на системном диске, дату и время, доступ к серверам Microsoft и отсутствие прокси, который подменяет трафик. Ошибка 0x80070002 может появляться, когда файл обновления не скачался полностью.`),
      step('Сбросьте только кэш обновлений', `Если журналы указывают на SoftwareDistribution или catroot2, остановите службы обновления и переименуйте кэш, а не удаляйте системные каталоги. Перед действиями создайте точку восстановления или резервную копию важных данных.`),
      step('Повторите установку одного обновления', `Запустите проверку обновлений повторно и установите сначала проблемный пакет. Не запускайте одновременно сторонние оптимизаторы, чистильщики реестра и массовое обновление драйверов: это усложнит диагностику.`),
      step('Сравните новый код ошибки со старым', `Если код изменился, исходная проблема с кэшем могла быть решена, а дальше мешает другой компонент. Сохраните номер KB, код ошибки и последние строки журнала Windows Update для точного продолжения диагностики.`),
    ];
  }

  return [
    step('Подтвердите точный симптом', `${product}: ${issue.label}. Проверьте, что проблема совпадает с описанием: ${issue.symptom}. Запишите текст ошибки, время появления, версию компонента и действие, после которого сбой повторяется. Это защищает от лишних исправлений и помогает не спутать первопричину с последствиями.`),
    step('Соберите диагностические данные', `Посмотрите журналы, статус служб, версию пакета и состояние ресурсов. Ищите сообщения за тот же момент, когда проявился сбой. Если журнал пустой, проверьте, запускается ли нужная служба или процесс вообще.`, diagnostics),
    step('Проверьте конфигурацию и доступ', `Сравните текущие настройки с рабочим состоянием: путь к файлам, переменные окружения, права пользователя, сетевые адреса, профиль и включенные расширения. Для этой проблемы наиболее вероятна причина: ${issue.cause}.`, deeperCheck),
    step('Изолируйте внешние зависимости', `Временно исключите VPN, прокси, сторонние расширения, нестабильную сеть, внешний диск или новый драйвер. Меняйте один фактор за раз и сразу повторяйте исходный сценарий, иначе будет трудно понять, что именно повлияло на результат.`),
    step('Исправляйте минимальным изменением', `Начните с самого обратимого действия: перезапуск службы, очистка локального кэша, исправление одного параметра или откат последнего обновления. Не переустанавливайте весь продукт, пока логи не подтверждают повреждение установки.`),
    step('Проверьте результат под обычной нагрузкой', `После правки повторите сценарий, при котором ${issue.symptom}. Если ошибка исчезла, зафиксируйте версию, измененный параметр и команду проверки. Если вернулась, сравните новый журнал со старым и переходите к следующей конкретной причине.`),
  ];
}

function applianceSteps(categorySlug, product, issue) {
  const isPowerTool = categorySlug === 'power-tools';
  const deviceWord = isPowerTool ? 'инструмент' : 'устройство';
  return [
    step('Остановите работу и уберите риск', `Перед проверкой выключите ${deviceWord}, отключите питание и дайте ему остыть. Если есть запах гари, дым, следы плавления, вода рядом с электрикой или срабатывает автомат, не продолжайте самостоятельный ремонт и обратитесь в сервис.`),
    step('Сверьте симптом с фактическим поведением', `${product}: ${issue.label}. Проверьте, что наблюдается именно этот симптом: ${issue.symptom}. Отдельно отметьте, появляется ли ошибка сразу после включения, во время нагрузки, после нагрева, при наборе воды или на конкретной программе.`),
    step('Проверьте простые внешние причины', `Осмотрите питание, кабель, вилку, розетку, шланги, фильтры, дверцу, защелки, вентиляцию и положение корпуса. Для такой проблемы наиболее вероятна причина: ${issue.cause}. Не разбирайте корпус, если гарантия действует или нет опыта безопасной работы с электрикой.`),
    step('Очистите доступные элементы без разборки', `Уберите загрязнение, промойте съемный фильтр, проверьте дренаж или воздуховод, удалите посторонние предметы и убедитесь, что ничего не мешает движущимся частям. Не используйте острые предметы там, где можно повредить уплотнитель, датчик или покрытие.`),
    step('Сделайте короткий контрольный запуск', `После сборки запустите короткий режим без повышенной нагрузки и наблюдайте за звуком, запахом, нагревом, протечкой и кодами ошибки. Если симптом повторился быстро, остановите проверку: дальнейшая работа может усилить повреждение.`),
    step('Подготовьте данные для сервиса', `Если проблема осталась, запишите модель, серийный номер, код ошибки, условия появления и выполненные проверки. Эти данные помогут мастеру быстрее отличить засор, расходник и настройку от неисправности платы, датчика, двигателя или нагревательного элемента.`),
  ];
}

function step(title, body, command = null) {
  return { title, body, command, image: null };
}

function buildSymptoms(product, issue, categorySlug) {
  if (applianceCategories.has(categorySlug)) {
    return [
      `${product}: ${issue.symptom}`,
      'симптом повторяется после короткой паузы или повторного запуска',
      'на дисплее, индикаторах или в приложении появляется ошибка либо необычный сигнал',
      'обычная чистка или повторный запуск не решают проблему',
    ];
  }

  return [
    `${product}: ${issue.symptom}`,
    'ошибка повторяется после перезапуска или нового запуска той же операции',
    'в журнале, интерфейсе или консоли есть сообщение, связанное с этим сбоем',
    'проблема появилась после обновления, изменения настроек, переноса данных или смены сети',
  ];
}

function buildCauses(issue, categorySlug) {
  if (applianceCategories.has(categorySlug)) {
    return [
      issue.cause,
      'загрязнение фильтра, воздуховода, дренажа, камеры или доступных узлов',
      'неправильная установка, перегрузка, перекос корпуса или заблокированная дверца',
      'срабатывание защиты из-за перегрева, влаги, утечки или нестабильного питания',
      'износ расходника, датчика, двигателя, нагревателя, насоса или платы управления',
    ];
  }

  return [
    issue.cause,
    'поврежденный кэш, временные файлы, профиль пользователя или локальное состояние',
    'неверные права доступа, путь к файлу, переменная окружения или системная политика',
    'конфликт после обновления, несовместимая версия, драйвер или расширение',
    'недоступная сеть, служба, зависимость, внешний диск или сервер авторизации',
  ];
}

function buildBody(data, categorySlug, product, issue, steps) {
  const symptoms = buildSymptoms(product, issue, categorySlug);
  const causes = buildCauses(issue, categorySlug);
  const title = cleanText(data.title);
  const isAppliance = applianceCategories.has(categorySlug);

  const lines = [
    `## Когда применять эту инструкцию`,
    '',
    `Используйте материал, если тема совпадает с вашей ситуацией: ${title}.`,
    `Ключевой признак: ${symptoms[0]}.`,
    `Если у вас другой код, другая модель или ошибка возникла в другом продукте, сначала уточните симптом и не выполняйте действия, которые меняют данные или настройки без резервной копии.`,
    '',
    `## Что проверить в первую очередь`,
    '',
    `- ${symptoms[0]}`,
    `- ${symptoms[1]}`,
    `- ${symptoms[2]}`,
    `- ${symptoms[3]}`,
    '',
    `## Наиболее вероятные причины`,
    '',
    `- ${causes[0]}`,
    `- ${causes[1]}`,
    `- ${causes[2]}`,
    `- ${causes[3]}`,
    `- ${causes[4]}`,
    '',
    `## Порядок без лишнего риска`,
    '',
    `1. ${steps[0].title}: ${sentence(steps[0].body)}`,
    `2. ${steps[1].title}: ${sentence(steps[1].body)}`,
    `3. ${steps[2].title}: ${sentence(steps[2].body)}`,
    `4. ${steps[3].title}: ${sentence(steps[3].body)}`,
    `5. ${steps[4].title}: ${sentence(steps[4].body)}`,
    `6. ${steps[5].title}: ${sentence(steps[5].body)}`,
    '',
    `## Как понять, что проблема решена`,
    '',
    `Повторите тот же сценарий, при котором появлялся сбой, и проверьте результат после перезапуска.`,
    isAppliance
      ? `Для техники важно, чтобы не возвращались запах, протечка, посторонний шум, перегрев и код ошибки.`
      : `Для программ и систем важно, чтобы в журнале не появлялась новая ошибка того же уровня и операция завершалась стабильно.`,
    `Если симптом вернулся, сравните новые признаки со старыми: изменение кода ошибки часто означает, что первичная причина уже устранена, но осталась другая зависимость.`,
    '',
    `## Когда остановиться`,
    '',
    isAppliance
      ? `Остановитесь, если есть следы гари, воды рядом с электрикой, повторное срабатывание защиты, сильный нагрев или необходимость разбирать закрытый корпус.`
      : `Остановитесь, если следующий шаг требует удаления данных, сброса профиля, переустановки системы или изменения прав без понятного отката.`,
    `Сохраните модель или версию продукта, точный текст ошибки, последние изменения и список уже выполненных проверок.`,
  ];

  return `${lines.join('\n')}\n`;
}

function normalizeSources(sources, categorySlug) {
  const titles = categorySourceTitles[categorySlug] || ['Product support documentation', 'Troubleshooting documentation', 'Technical reference'];
  const normalized = asArray(sources).map((source, index) => ({
    title: /Official troubleshooting documentation|Vendor support knowledge base|Product support documentation|Technical reference documentation/.test(source.title || '')
      ? titles[index % titles.length]
      : cleanText(source.title) || titles[index % titles.length],
    url: source.url,
    accessedAt: source.accessedAt || accessedAt,
  }));

  const hosts = new Set();
  for (const source of normalized) {
    try {
      hosts.add(new URL(source.url).hostname.toLowerCase());
    } catch {
      // Keep invalid URLs for the schema checker to report; this script does not guess replacements.
    }
  }

  const extra = extraSources[categorySlug];
  if (extra && normalized.length >= 3) {
    let extraHost = '';
    try {
      extraHost = new URL(extra.url).hostname.toLowerCase();
    } catch {
      extraHost = '';
    }
    if (extraHost && !hosts.has(extraHost) && !normalized.some((source) => source.url === extra.url)) {
      normalized.push(extra);
    }
  }

  return normalized;
}

function readingTimeFor(body, steps) {
  const chars = body.length + steps.reduce((sum, entry) => sum + entry.body.length + (entry.command?.length || 0), 0);
  return Math.max(4, Math.min(10, Math.ceil(chars / 1300)));
}

function rewriteRecord(record) {
  const filePath = path.join(articlesDir, record.file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const data = { ...parsed.data };
  const categorySlug = record.categorySlug;
  const product = productName(data, categorySlug);
  const issue = detectIssue(record.file, data);
  const steps = applianceCategories.has(categorySlug)
    ? applianceSteps(categorySlug, product, issue)
    : technicalSteps(categorySlug, record.file, product, issue);
  const body = buildBody(data, categorySlug, product, issue, steps);

  data.description = `Короткая инструкция по теме: ${cleanText(data.title)}. Симптомы, вероятные причины, безопасные проверки и порядок действий без лишних общих советов.`;
  data.symptoms = buildSymptoms(product, issue, categorySlug);
  data.causes = buildCauses(issue, categorySlug);
  data.steps = steps;
  data.sources = normalizeSources(data.sources, categorySlug);
  data.readingTime = readingTimeFor(body, steps);
  data.updatedAt = accessedAt;
  data.dedupe = {
    titleHash: sha(data.title),
    solutionHash: sha(data.steps[0]?.body || ''),
    sourceHash: sha(data.sources[0]?.url || ''),
  };

  const next = matter.stringify(body, data, { lineWidth: 100 });
  if (next !== original) {
    fs.writeFileSync(filePath, next);
    return true;
  }
  return false;
}

if (!fs.existsSync(auditPath)) {
  throw new Error(`Audit report not found: ${auditPath}`);
}

const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const targets = audit.records
  .filter((record) => record.generatedBatch)
  .filter((record) => technicalCategories.has(record.categorySlug) || applianceCategories.has(record.categorySlug))
  .sort((a, b) => a.file.localeCompare(b.file));

let changed = 0;
for (const record of targets) {
  if (rewriteRecord(record)) {
    changed += 1;
    console.log(`updated\t${record.file}`);
  }
}

console.log(`targets\t${targets.length}`);
console.log(`changed\t${changed}`);
