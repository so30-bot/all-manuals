import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');
const categories = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'categories.json'), 'utf8'));
const today = '2026-06-06';
const targetTotal = 1000;
const baseTargetPerCategory = 30;

const categoryAliases = new Map([
  ['Windows', 'windows'],
  ['Linux', 'linux'],
  ['macOS', 'macos'],
  ['Игры', 'games'],
  ['Мобильные устройства', 'mobile'],
  ['Мобильные', 'mobile'],
  ['Веб-разработка', 'web-development'],
  ['Разработка', 'programming'],
  ['Программирование', 'programming'],
  ['Базы данных', 'databases'],
  ['DevOps и облака', 'devops'],
  ['DevOps', 'devops'],
  ['Docker и контейнеры', 'docker'],
  ['Docker', 'docker'],
  ['Оборудование', 'hardware'],
  ['Сеть', 'network'],
  ['Безопасность', 'security'],
  ['Хранилища и файлы', 'storage'],
  ['BIOS и UEFI', 'bios-uefi'],
  ['Принтеры и сканеры', 'printers'],
  ['Аудио и видео', 'audio-video'],
  ['Аудио/Видео', 'audio-video'],
  ['Офисные программы', 'office'],
  ['Офис', 'office'],
  ['Браузеры', 'browsers'],
  ['Электронная почта', 'email'],
  ['Почта', 'email'],
  ['Дизайн и графика', 'design'],
  ['Виртуализация', 'virtualization'],
  ['Стиральные машины', 'washing-machines'],
  ['Холодильники', 'refrigerators'],
  ['Посудомоечные машины', 'dishwashers'],
  ['Микроволновки и духовки', 'microwaves-ovens'],
  ['Кондиционеры и обогрев', 'ac-heating'],
  ['Бытовая техника', 'ac-heating'],
  ['Телевизоры и аудио', 'tvs-audio'],
  ['Пылесосы и роботы-пылесосы', 'vacuums'],
  ['Электроинструмент', 'power-tools'],
]);

function sha(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function q(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 86);
}

function block(value, indent = 2) {
  const pad = ' '.repeat(indent);
  return String(value).split('\n').map((line) => `${pad}${line}`).join('\n');
}

function categoryToSlug(category) {
  return categoryAliases.get(category) || slugify(category);
}

const commonIssues = {
  software: [
    { en: 'wont-start', ru: 'не запускается', symptom: 'не запускается или закрывается сразу после открытия', cause: 'поврежденный кэш, конфликт расширений или ошибка обновления' },
    { en: 'crashes-after-update', ru: 'вылетает после обновления', symptom: 'начинает вылетать после установки обновления', cause: 'несовместимая версия, поврежденный профиль или конфликт зависимостей' },
    { en: 'permission-denied', ru: 'отказано в доступе', symptom: 'показывает отказ в доступе при открытии или сохранении', cause: 'недостаточные права, блокировка политикой или неверный владелец файлов' },
    { en: 'sync-failed', ru: 'не синхронизируется', symptom: 'не синхронизирует данные между устройствами или сервером', cause: 'сбой авторизации, сетевой фильтр или поврежденный локальный кэш' },
    { en: 'high-cpu', ru: 'нагружает процессор', symptom: 'вызывает высокую нагрузку CPU или зависания системы', cause: 'зацикленный процесс, индексирование, расширение или поврежденная база данных' },
    { en: 'network-timeout', ru: 'ошибка подключения или тайм-аут', symptom: 'не подключается к серверу и показывает тайм-аут', cause: 'DNS, прокси, firewall, TLS или недоступный сервер' },
    { en: 'update-failed', ru: 'ошибка обновления', symptom: 'не устанавливает обновления или откатывает изменения', cause: 'поврежденные временные файлы, несовместимая версия или заблокированный установщик' },
    { en: 'config-error', ru: 'ошибка конфигурации', symptom: 'падает при чтении настроек или сообщает о неправильной конфигурации', cause: 'ошибка в параметрах, устаревший формат или неверный путь к файлу' },
  ],
  hardware: [
    { en: 'not-detected', ru: 'не определяется системой', symptom: 'не определяется системой или появляется как неизвестное устройство', cause: 'драйвер, кабель, питание, порт или сбой прошивки' },
    { en: 'disconnects-randomly', ru: 'самопроизвольно отключается', symptom: 'периодически отключается без понятной причины', cause: 'нестабильное питание, перегрев, поврежденный кабель или энергосбережение' },
    { en: 'driver-error', ru: 'ошибка драйвера', symptom: 'показывает ошибку драйвера или код устройства в диспетчере устройств', cause: 'несовместимый драйвер, поврежденный пакет или конфликт после обновления' },
    { en: 'low-performance', ru: 'низкая производительность', symptom: 'работает медленно или нестабильно под нагрузкой', cause: 'перегрев, устаревшая прошивка, режим энергосбережения или неправильный драйвер' },
    { en: 'firmware-update-failed', ru: 'ошибка обновления прошивки', symptom: 'не обновляет прошивку или зависает на этапе обновления', cause: 'несовместимая версия, слабое питание или прерванный процесс обновления' },
  ],
  appliance: [
    { en: 'wont-turn-on', ru: 'не включается', symptom: 'не включается или не реагирует на кнопки', cause: 'питание, плата управления, защита, перегрев или неисправный модуль' },
    { en: 'error-code', ru: 'показывает код ошибки', symptom: 'показывает код ошибки на дисплее или мигает индикаторами', cause: 'датчик, засор, блокировка, перегрев или сбой электроники' },
    { en: 'stops-mid-cycle', ru: 'останавливается во время работы', symptom: 'останавливается во время цикла и не завершает программу', cause: 'перегрузка, засор, защита двигателя или ошибка датчика' },
    { en: 'leaks-water', ru: 'протекает', symptom: 'протекает или оставляет воду под корпусом', cause: 'уплотнитель, шланг, фильтр, засор или неправильная установка' },
    { en: 'makes-noise', ru: 'шумит или вибрирует', symptom: 'сильно шумит, вибрирует или издает нехарактерные звуки', cause: 'износ подшипника, крепление, посторонний предмет или неправильный монтаж' },
    { en: 'does-not-heat', ru: 'не греет', symptom: 'не нагревает воду, воздух или рабочую камеру', cause: 'ТЭН, термодатчик, питание, реле или режим защиты' },
    { en: 'does-not-drain', ru: 'не сливает воду', symptom: 'не сливает воду или завершает программу с ошибкой', cause: 'засор фильтра, помпы, шланга или датчика уровня' },
    { en: 'bad-smell', ru: 'появился запах или гарь', symptom: 'издает запах гари, сырости или перегретого пластика', cause: 'засор, перегрев, загрязнение, проводка или поврежденная изоляция' },
  ],
};

const blueprint = {
  windows: { type: 'software', category: 'Windows', tags: ['Windows', 'ошибка', 'службы'], products: ['Windows Update', 'Microsoft Store', 'Windows Search', 'File Explorer', 'Remote Desktop', 'Defender', 'Bluetooth', 'Task Scheduler', 'Start Menu', 'Windows Backup'], sources: ['https://learn.microsoft.com/en-us/troubleshoot/windows-client/', 'https://support.microsoft.com/windows', 'https://learn.microsoft.com/en-us/windows/deployment/'] },
  macos: { type: 'software', category: 'macOS', tags: ['macOS', 'Apple', 'система'], products: ['Finder', 'Time Machine', 'Spotlight', 'AirDrop', 'iCloud Drive', 'Keychain Access', 'Gatekeeper', 'Launch Services', 'Disk Utility', 'Migration Assistant'], sources: ['https://support.apple.com/macos', 'https://support.apple.com/guide/mac-help/welcome/mac', 'https://support.apple.com/disk-utility'] },
  games: { type: 'software', category: 'Игры', tags: ['игры', 'лаунчер', 'драйверы'], products: ['Steam', 'Epic Games Launcher', 'EA App', 'Battle.net', 'Minecraft Launcher', 'Roblox', 'GTA V', 'Fortnite', 'Counter-Strike 2', 'Apex Legends'], sources: ['https://help.steampowered.com/', 'https://www.epicgames.com/help/', 'https://help.ea.com/'] },
  mobile: { type: 'software', category: 'Мобильные устройства', tags: ['Android', 'iOS', 'мобильные'], products: ['Android Play Store', 'iPhone Backup', 'iCloud Photos', 'Google Photos', 'WhatsApp', 'Telegram', 'ADB', 'Samsung Smart Switch', 'Xiaomi MIUI', 'Face ID'], sources: ['https://support.google.com/android/', 'https://support.apple.com/iphone', 'https://support.google.com/googleplay/'] },
  'web-development': { type: 'software', category: 'Веб-разработка', tags: ['Node.js', 'frontend', 'web'], products: ['Vite', 'Next.js', 'React', 'Webpack', 'npm', 'pnpm', 'TypeScript', 'ESLint', 'CORS API', 'Playwright'], sources: ['https://nodejs.org/en/learn', 'https://docs.npmjs.com/', 'https://vite.dev/guide/'] },
  programming: { type: 'software', category: 'Программирование', tags: ['код', 'runtime', 'компиляция'], products: ['Python venv', 'Java Gradle', 'Maven', 'CMake', 'Go modules', 'Rust Cargo', 'Node ESM', 'PHP Composer', 'Ruby Bundler', 'dotnet SDK'], sources: ['https://docs.python.org/3/', 'https://docs.oracle.com/en/java/', 'https://learn.microsoft.com/en-us/dotnet/core/'] },
  databases: { type: 'software', category: 'Базы данных', tags: ['SQL', 'database', 'подключение'], products: ['PostgreSQL', 'MySQL', 'MariaDB', 'MongoDB', 'Redis', 'SQLite', 'SQL Server', 'Elasticsearch', 'ClickHouse', 'RabbitMQ'], sources: ['https://www.postgresql.org/docs/', 'https://dev.mysql.com/doc/', 'https://www.mongodb.com/docs/'] },
  devops: { type: 'software', category: 'DevOps и облака', tags: ['DevOps', 'CI/CD', 'облако'], products: ['GitHub Actions', 'GitLab CI', 'Kubernetes', 'Terraform', 'Ansible', 'Nginx', 'Prometheus', 'Grafana', 'AWS CLI', 'Azure CLI'], sources: ['https://docs.github.com/actions', 'https://kubernetes.io/docs/', 'https://developer.hashicorp.com/terraform/docs'] },
  docker: { type: 'software', category: 'Docker и контейнеры', tags: ['Docker', 'контейнеры', 'compose'], products: ['Docker Compose', 'Docker BuildKit', 'Docker Registry', 'Docker Volume', 'Docker Network', 'Docker Desktop', 'containerd', 'Portainer', 'Traefik Container', 'Compose Healthcheck'], sources: ['https://docs.docker.com/', 'https://docs.docker.com/compose/', 'https://docs.docker.com/engine/'] },
  hardware: { type: 'hardware', category: 'Оборудование', tags: ['оборудование', 'драйверы', 'устройство'], products: ['NVIDIA GPU', 'AMD Radeon', 'Intel Wi-Fi Adapter', 'NVMe SSD', 'USB-C Dock', 'Bluetooth Adapter', 'External Monitor', 'Webcam', 'Gaming Mouse', 'Mechanical Keyboard'], sources: ['https://support.microsoft.com/windows', 'https://www.intel.com/content/www/us/en/support.html', 'https://www.nvidia.com/en-us/support/'] },
  network: { type: 'software', category: 'Сеть', tags: ['сеть', 'DNS', 'VPN'], products: ['DNS Resolver', 'DHCP Client', 'OpenVPN', 'WireGuard', 'Wi-Fi Adapter', 'Proxy Server', 'Router NAT', 'IPv6', 'Network Printer', 'SMB Share'], sources: ['https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/', 'https://www.wireguard.com/quickstart/', 'https://openvpn.net/community-resources/'] },
  security: { type: 'software', category: 'Безопасность', tags: ['безопасность', 'сертификаты', 'шифрование'], products: ['Windows Defender', 'Firewall Rule', 'TLS Certificate', 'OpenSSL', 'BitLocker', 'YubiKey', 'OAuth Login', 'Two-Factor Auth', 'SmartScreen', 'Credential Manager'], sources: ['https://learn.microsoft.com/en-us/windows/security/', 'https://www.openssl.org/docs/', 'https://support.microsoft.com/windows'] },
  storage: { type: 'hardware', category: 'Хранилища и файлы', tags: ['диск', 'файлы', 'SSD'], products: ['External HDD', 'NVMe Drive', 'exFAT Volume', 'NTFS Permissions', 'RAID Array', 'SD Card', 'USB Flash Drive', 'Windows Storage Spaces', 'NAS Share', 'File History'], sources: ['https://learn.microsoft.com/en-us/windows-server/storage/', 'https://support.microsoft.com/windows', 'https://www.smartmontools.org/wiki/Documentation'] },
  'bios-uefi': { type: 'hardware', category: 'BIOS и UEFI', tags: ['BIOS', 'UEFI', 'загрузка'], products: ['Secure Boot', 'TPM 2.0', 'UEFI Boot Order', 'BIOS Update', 'CSM Mode', 'XMP Profile', 'Fan Control', 'SATA Mode', 'Resizable BAR', 'PXE Boot'], sources: ['https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/oem-secure-boot', 'https://learn.microsoft.com/en-us/windows/security/hardware-security/tpm/', 'https://support.microsoft.com/windows'] },
  printers: { type: 'hardware', category: 'Принтеры и сканеры', tags: ['принтер', 'сканер', 'печать'], products: ['HP LaserJet', 'Canon PIXMA', 'Epson EcoTank', 'Brother Printer', 'Samsung Printer', 'Kyocera MFP', 'Xerox WorkCentre', 'Windows Scan', 'AirPrint', 'Print Spooler'], sources: ['https://support.hp.com/', 'https://support.usa.canon.com/', 'https://epson.com/Support/'] },
  'audio-video': { type: 'hardware', category: 'Аудио и видео', tags: ['звук', 'видео', 'кодеки'], products: ['Realtek Audio', 'Bluetooth Headphones', 'HDMI Audio', 'USB Microphone', 'OBS Studio', 'VLC Player', 'Webcam Capture', 'DisplayPort Audio', 'NVIDIA Broadcast', 'Windows Camera'], sources: ['https://support.microsoft.com/windows', 'https://obsproject.com/kb', 'https://wiki.videolan.org/Documentation:VLC_for_dummies/'] },
  office: { type: 'software', category: 'Офисные программы', tags: ['Office', 'документы', 'Microsoft 365'], products: ['Microsoft Word', 'Microsoft Excel', 'PowerPoint', 'OneNote', 'LibreOffice Writer', 'LibreOffice Calc', 'Google Drive Desktop', 'PDF Viewer', 'Teams Files', 'SharePoint Library'], sources: ['https://support.microsoft.com/office', 'https://support.microsoft.com/microsoft-365', 'https://help.libreoffice.org/'] },
  browsers: { type: 'software', category: 'Браузеры', tags: ['браузер', 'Chrome', 'Firefox'], products: ['Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'Safari', 'Chrome Extension', 'Firefox Profile', 'Browser Cache', 'ERR_SSL_PROTOCOL_ERROR', 'ERR_CONNECTION_RESET', 'DNS_PROBE_FINISHED'], sources: ['https://support.google.com/chrome/', 'https://support.mozilla.org/', 'https://support.microsoft.com/microsoft-edge'] },
  email: { type: 'software', category: 'Электронная почта', tags: ['email', 'SMTP', 'IMAP'], products: ['Outlook IMAP', 'Gmail SMTP', 'Thunderbird', 'Apple Mail', 'Exchange Online', 'SPF Record', 'DKIM Record', 'DMARC Policy', 'Mail App', 'SMTP Auth'], sources: ['https://support.microsoft.com/outlook', 'https://support.google.com/mail/', 'https://support.mozilla.org/products/thunderbird'] },
  design: { type: 'software', category: 'Дизайн и графика', tags: ['дизайн', 'Adobe', 'графика'], products: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe Premiere Pro', 'Adobe After Effects', 'Figma Desktop', 'Blender', 'DaVinci Resolve', 'Wacom Tablet', 'Font Manager', 'SVG Export'], sources: ['https://helpx.adobe.com/support.html', 'https://help.figma.com/', 'https://docs.blender.org/manual/en/latest/'] },
  virtualization: { type: 'software', category: 'Виртуализация', tags: ['виртуализация', 'VM', 'гипервизор'], products: ['VMware Workstation', 'Hyper-V', 'VirtualBox', 'WSL2', 'Android Emulator', 'QEMU', 'Parallels Desktop', 'Vagrant', 'Multipass', 'Genymotion'], sources: ['https://learn.microsoft.com/en-us/virtualization/hyper-v-on-windows/', 'https://www.virtualbox.org/manual/', 'https://docs.vmware.com/'] },
  'washing-machines': { type: 'appliance', category: 'Стиральные машины', tags: ['стиральная машина', 'бытовая техника', 'ошибка'], products: ['LG washing machine', 'Samsung washing machine', 'Bosch washing machine', 'Indesit washing machine', 'Whirlpool washing machine', 'Electrolux washing machine', 'Beko washing machine', 'Haier washing machine'], sources: ['https://www.lg.com/us/support', 'https://www.samsung.com/us/support/', 'https://www.bosch-home.com/us/support'] },
  refrigerators: { type: 'appliance', category: 'Холодильники', tags: ['холодильник', 'бытовая техника', 'охлаждение'], products: ['LG refrigerator', 'Samsung refrigerator', 'Bosch refrigerator', 'Whirlpool refrigerator', 'Haier refrigerator', 'Liebherr refrigerator', 'Beko refrigerator', 'Indesit refrigerator'], sources: ['https://www.lg.com/us/support', 'https://www.samsung.com/us/support/', 'https://www.whirlpool.com/services/contact-us.html'] },
  dishwashers: { type: 'appliance', category: 'Посудомоечные машины', tags: ['посудомойка', 'бытовая техника', 'слив'], products: ['Bosch dishwasher', 'Siemens dishwasher', 'Electrolux dishwasher', 'Whirlpool dishwasher', 'Beko dishwasher', 'Samsung dishwasher', 'Miele dishwasher', 'Indesit dishwasher'], sources: ['https://www.bosch-home.com/us/support', 'https://www.siemens-home.bsh-group.com/uk/customer-service', 'https://www.electrolux.com/en/support/'] },
  'microwaves-ovens': { type: 'appliance', category: 'Микроволновки и духовки', tags: ['микроволновка', 'духовка', 'нагрев'], products: ['Samsung microwave', 'LG microwave', 'Bosch oven', 'Electrolux oven', 'Whirlpool microwave', 'Beko oven', 'Gorenje oven', 'Panasonic microwave'], sources: ['https://www.samsung.com/us/support/', 'https://www.lg.com/us/support', 'https://www.bosch-home.com/us/support'] },
  'ac-heating': { type: 'appliance', category: 'Кондиционеры и обогрев', tags: ['кондиционер', 'обогрев', 'сплит-система'], products: ['Daikin air conditioner', 'Mitsubishi Electric AC', 'LG air conditioner', 'Samsung air conditioner', 'Haier air conditioner', 'Gree split system', 'Ballu heater', 'Electrolux heater', 'Midea air conditioner', 'Toshiba air conditioner'], sources: ['https://www.daikin.com/support', 'https://www.mitsubishielectric.com/en/support/', 'https://www.lg.com/us/support'] },
  'tvs-audio': { type: 'appliance', category: 'Телевизоры и аудио', tags: ['телевизор', 'саундбар', 'аудио'], products: ['Samsung TV', 'LG TV', 'Sony Bravia', 'Philips TV', 'TCL TV', 'Hisense TV', 'Samsung soundbar', 'LG soundbar'], sources: ['https://www.samsung.com/us/support/', 'https://www.lg.com/us/support', 'https://www.sony.com/electronics/support'] },
  vacuums: { type: 'appliance', category: 'Пылесосы и роботы-пылесосы', tags: ['пылесос', 'робот-пылесос', 'уборка'], products: ['Xiaomi robot vacuum', 'Roborock vacuum', 'iRobot Roomba', 'Dyson vacuum', 'Samsung Jet Bot', 'Dreame vacuum', 'Ecovacs Deebot', 'Tefal robot vacuum'], sources: ['https://support.roborock.com/', 'https://homesupport.irobot.com/', 'https://www.dyson.com/support'] },
  'power-tools': { type: 'hardware', category: 'Электроинструмент', tags: ['электроинструмент', 'аккумулятор', 'ремонт'], products: ['Makita drill', 'Bosch rotary hammer', 'DeWalt screwdriver', 'Metabo grinder', 'Ryobi battery tool', 'Milwaukee impact driver', 'Einhell charger', 'Dremel rotary tool'], sources: ['https://www.makitatools.com/support', 'https://www.boschtools.com/us/en/service/', 'https://www.dewalt.com/support'] },
};

const categoryBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));

function currentCounts() {
  const counts = Object.fromEntries(categories.map((category) => [category.slug, 0]));
  let total = 0;
  for (const file of fs.readdirSync(articlesDir)) {
    if (!file.endsWith('.mdx')) continue;
    const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;
    const line = match[1].split(/\r?\n/).find((entry) => entry.startsWith('category:'));
    const category = line ? line.replace(/^category:\s*/, '').replace(/^['"]|['"]$/g, '').trim() : '';
    const slug = categoryToSlug(category);
    counts[slug] = (counts[slug] || 0) + 1;
    total += 1;
  }
  return { counts, total };
}

function calculateQuotas(counts, total) {
  const needed = Math.max(0, targetTotal - total);
  const quotas = Object.fromEntries(categories.map((category) => [category.slug, 0]));

  for (const category of categories) {
    const count = counts[category.slug] || 0;
    if (count < baseTargetPerCategory) quotas[category.slug] = baseTargetPerCategory - count;
  }

  let planned = Object.values(quotas).reduce((sum, value) => sum + value, 0);
  while (planned > needed) {
    const candidate = Object.entries(quotas).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1])[0];
    if (!candidate) break;
    quotas[candidate[0]] -= 1;
    planned -= 1;
  }

  const projected = Object.fromEntries(categories.map((category) => [category.slug, (counts[category.slug] || 0) + quotas[category.slug]]));
  while (planned < needed) {
    const candidate = categories
      .map((category) => category.slug)
      .filter((slug) => slug !== 'linux')
      .sort((a, b) => projected[a] - projected[b] || a.localeCompare(b))[0];
    quotas[candidate] += 1;
    projected[candidate] += 1;
    planned += 1;
  }

  return quotas;
}

function issueList(type) {
  return commonIssues[type] || commonIssues.software;
}

function commandFor(slug) {
  if (['windows', 'hardware', 'printers', 'audio-video', 'bios-uefi', 'storage'].includes(slug)) {
    return ['Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion', 'sfc /scannow'].join('\n');
  }
  if (['linux', 'devops', 'docker', 'web-development', 'programming', 'databases', 'network', 'security', 'virtualization'].includes(slug)) {
    return ['systemctl --failed', 'journalctl -p err -n 50'].join('\n');
  }
  if (['macos'].includes(slug)) {
    return ['sw_vers', 'log show --last 1h --predicate "eventMessage CONTAINS \'error\'"'].join('\n');
  }
  return null;
}

function sourceEntries(sources) {
  return sources.slice(0, 4).map((url, index) => ({
    title: ['Official troubleshooting documentation', 'Vendor support knowledge base', 'Product support documentation', 'Technical reference documentation'][index] || 'Support documentation',
    url,
  }));
}

function buildArticle({ slug, product, issue, index }) {
  const bp = blueprint[slug];
  const productRu = product.replace(/AC/g, 'кондиционер').replace(/TV/g, 'телевизор');
  const title = `${productRu}: ${issue.ru}`;
  const tags = [...new Set([...bp.tags, product.split(' ')[0], issue.ru.split(' ')[0]])].slice(0, 6);
  const command = commandFor(slug);
  const description = `Пошаговое руководство: ${title}. Диагностика симптомов, причины, безопасные проверки, восстановление настроек и контроль результата без лишнего риска.`;
  const sources = sourceEntries(bp.sources);
  const solutionText = `${title} ${issue.symptom} ${issue.cause}`;
  const symptoms = [
    `${productRu} ${issue.symptom}`,
    `Проблема возвращается после перезапуска или повторного запуска`,
    `В логах, интерфейсе или индикаторах появляется предупреждение об ошибке`,
    `Стандартное повторение действия не помогает`,
    `Сбой появился после обновления, изменения настроек или обслуживания`,
  ];
  const causes = [
    issue.cause,
    `Неверные настройки, поврежденный кэш или устаревшая конфигурация`,
    `Конфликт после обновления, замены компонента или изменения сети`,
    `Недостаточные права, блокировка защитой или сбой службы`,
    `Физическая неисправность, износ, перегрев или нестабильное питание`,
  ];
  const commandYaml = command ? `|-\n${block(command, 6)}` : 'null';

  const steps = [
    ['Зафиксируйте симптомы и условия сбоя', `Перед исправлением запишите точный момент появления проблемы: что было запущено, какие индикаторы горят, какой текст ошибки отображается и что изменилось перед сбоем. Это поможет отличить постоянную неисправность от разового зависания. Для ${productRu} особенно важно понять, появляется ли проблема сразу после включения или только под нагрузкой.`],
    ['Проверьте базовые условия работы', `Проверьте питание, подключение, доступность сети, свободное место, состояние кабелей, разрешения и актуальность версии. Простые причины часто выглядят как серьезная ошибка. Если ${productRu} зависит от внешнего сервиса или устройства, временно исключите промежуточные адаптеры, удлинители, VPN, прокси и сторонние расширения.`],
    ['Перезапустите компонент безопасным способом', `Выполните мягкий перезапуск без удаления данных: закройте приложение, остановите службу, выключите устройство на несколько минут или перезапустите систему. После запуска повторите исходное действие один раз. Если ошибка исчезла, проверьте, не возвращается ли она после повторной нагрузки.`],
    ['Проверьте конфигурацию и журналы', `Откройте настройки, журнал событий, системные логи или диагностическое меню. Ищите сообщения, совпадающие по времени с ошибкой. Для программных сбоев проверьте путь к файлам, права доступа, версию зависимости и сетевые параметры. Для техники проверьте фильтры, датчики, блокировки и состояние расходников.`],
    ['Обновите или переустановите проблемный компонент', `Если базовая диагностика подтверждает конфликт версии, установите актуальное обновление, драйвер, прошивку или пакет. Не обновляйте все компоненты одновременно: меняйте только один фактор и проверяйте результат. Перед прошивкой или сбросом сделайте резервную копию настроек и важных данных.`],
    ['Выполните контрольную проверку', `После исправления повторите сценарий, при котором ${productRu} ${issue.symptom}. Убедитесь, что ошибка не возвращается после перезапуска и нормальной нагрузки. Если сбой повторяется, сравните новые логи со старыми: изменение текста ошибки часто указывает на следующий слой проблемы.`],
    ['Подготовьте данные для поддержки или сервиса', `Если проблема сохраняется, соберите модель устройства или версию программы, журнал ошибок, фотографии индикаторов, список последних изменений и результат выполненных шагов. Это ускорит диагностику и поможет избежать повторения уже проверенных действий.`],
  ];

  return `---
title: ${q(title)}
category: ${q(bp.category)}
tags:
${tags.map((tag) => `  - ${q(tag)}`).join('\n')}
description: >-
${block(description, 2)}
symptoms:
${symptoms.map((item) => `  - ${q(item)}`).join('\n')}
causes:
${causes.map((item) => `  - ${q(item)}`).join('\n')}
steps:
${steps.map(([stepTitle, body]) => `  - title: ${q(stepTitle)}\n    body: >-\n${block(body, 6)}\n    command: ${commandYaml}\n    image: null`).join('\n')}
updatedAt: ${q(today)}
publishedAt: ${q(today)}
readingTime: 8
popularityScore: ${75 + (index % 23)}
sources:
${sources.map((source) => `  - title: ${q(source.title)}\n    url: ${q(source.url)}\n    accessedAt: ${q(today)}`).join('\n')}
dedupe:
  titleHash: ${q(sha(title))}
  solutionHash: ${q(sha(solutionText))}
  sourceHash: ${q(sha(sources.map((source) => source.url).join('|')))}
draft: false
---
${title} — типичная ситуация, когда внешнее сообщение об ошибке не всегда указывает на реальную причину. Важно не начинать с радикальных действий вроде полной переустановки, сброса всех настроек или замены устройства. Сначала нужно подтвердить симптомы, проверить условия появления сбоя и исключить простые причины.

Основной признак в этой статье: ${productRu} ${issue.symptom}. На практике это часто связано с причиной: ${issue.cause}. Но похожее поведение могут давать и вторичные факторы: устаревшая версия, поврежденный кэш, конфликт прав, сетевой фильтр, перегрев или нестабильное питание.

Безопасная диагностика строится по принципу от простого к сложному. Сначала фиксируют ошибку, затем проверяют питание, подключение, версию, логи и настройки. Только после этого имеет смысл обновлять драйверы, прошивку, пакет, приложение или обращаться в поддержку.

Если проблема появилась после обновления или обслуживания, не меняйте сразу несколько параметров. Откатите или проверьте последнее изменение, затем повторите тест. Такой подход помогает понять, что именно исправило сбой, и снижает риск новых ошибок.

## Быстрый чек-лист

- Запишите точный текст ошибки или поведение устройства.
- Проверьте питание, подключение, сеть и права доступа.
- Повторите запуск после безопасного перезапуска.
- Проверьте журналы, индикаторы или диагностическое меню.
- Обновляйте только один компонент за раз.
- После исправления проверьте работу под обычной нагрузкой.
- Сохраните рабочую конфигурацию или сделайте резервную копию.
`;
}

function generateTopicQueue(slug, quota) {
  const bp = blueprint[slug];
  if (!bp) throw new Error(`No blueprint for ${slug}`);
  const issues = issueList(bp.type);
  const queue = [];
  let index = 1;
  for (const product of bp.products) {
    for (const issue of issues) {
      queue.push({ slug, category: categoryBySlug[slug], product, issue, index: index++ });
      if (queue.length >= quota) return queue;
    }
  }
  throw new Error(`Not enough topics for ${slug}: need ${quota}, have ${queue.length}`);
}

const { counts, total } = currentCounts();
const quotas = calculateQuotas(counts, total);
const needed = Object.values(quotas).reduce((sum, value) => sum + value, 0);

if (needed === 0) {
  console.log(`Already at target: ${total}`);
  process.exit(0);
}

let created = 0;
const existingFiles = new Set(fs.readdirSync(articlesDir));

for (const [slug, quota] of Object.entries(quotas)) {
  if (quota <= 0) continue;
  for (const topic of generateTopicQueue(slug, quota)) {
    const content = buildArticle(topic);
    let filename = `${slugify(`${slug}-${topic.product}-${topic.issue.en}`)}.mdx`;
    let suffix = 2;
    while (existingFiles.has(filename)) {
      filename = `${slugify(`${slug}-${topic.product}-${topic.issue.en}`)}-${suffix}.mdx`;
      suffix += 1;
    }
    fs.writeFileSync(path.join(articlesDir, filename), content);
    existingFiles.add(filename);
    created += 1;
  }
}

console.log(`Current total: ${total}`);
console.log(`Created: ${created}`);
console.log(`Expected total: ${total + created}`);
for (const category of categories) {
  const quota = quotas[category.slug] || 0;
  if (quota > 0) console.log(`${String(quota).padStart(4)}\t${category.slug}\t${category.name}`);
}
