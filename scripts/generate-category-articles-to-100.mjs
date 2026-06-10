import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'errors');
const CATEGORIES_PATH = path.join(ROOT, 'src', 'data', 'categories.json');
const TARGET_PER_CATEGORY = 100;
const DATE = '2026-06-11';

const split = (value) => value.split('|').map((item) => item.trim()).filter(Boolean);

const SOURCE_SETS = {
  windows: [
    ['Microsoft Windows troubleshooting', 'https://learn.microsoft.com/troubleshoot/windows-client/'],
    ['Microsoft Windows update guidance', 'https://support.microsoft.com/windows/windows-update-faq-8a903416-6f45-0718-f5c7-375e92dddeb2'],
    ['Microsoft Windows command-line reference', 'https://learn.microsoft.com/windows-server/administration/windows-commands/windows-commands'],
  ],
  macos: [
    ['Apple macOS User Guide', 'https://support.apple.com/guide/mac-help/welcome/mac'],
    ['Apple Disk Utility guide', 'https://support.apple.com/guide/disk-utility/welcome/mac'],
    ['Apple safe mode guidance', 'https://support.apple.com/guide/mac-help/start-up-your-mac-in-safe-mode-mh21245/mac'],
    ['Apple Developer documentation', 'https://developer.apple.com/documentation/'],
  ],
  games: [
    ['Steam Support game troubleshooting', 'https://help.steampowered.com/'],
    ['Epic Games player support', 'https://www.epicgames.com/help/'],
    ['Microsoft DirectX diagnostic guidance', 'https://support.microsoft.com/windows/open-and-run-dxdiag-exe-dad7792c-2ad5-f6cd-5a37-bf92228dfd85'],
  ],
  mobile: [
    ['Android Help troubleshooting', 'https://support.google.com/android/'],
    ['Apple iPhone support', 'https://support.apple.com/iphone'],
    ['Samsung Galaxy support', 'https://www.samsung.com/support/mobile-devices/'],
  ],
  web: [
    ['MDN HTTP troubleshooting', 'https://developer.mozilla.org/docs/Web/HTTP'],
    ['Chrome DevTools documentation', 'https://developer.chrome.com/docs/devtools/'],
    ['Web.dev performance guidance', 'https://web.dev/learn/performance/'],
  ],
  programming: [
    ['Python debugging guide', 'https://docs.python.org/3/library/pdb.html'],
    ['Node.js diagnostics documentation', 'https://nodejs.org/en/learn/diagnostics'],
    ['GitHub Actions troubleshooting', 'https://docs.github.com/actions/monitoring-and-troubleshooting-workflows/troubleshooting-workflows'],
  ],
  databases: [
    ['PostgreSQL monitoring documentation', 'https://www.postgresql.org/docs/current/monitoring.html'],
    ['MySQL error reference', 'https://dev.mysql.com/doc/mysql-errors/8.0/en/'],
    ['MongoDB diagnostics documentation', 'https://www.mongodb.com/docs/manual/administration/monitoring/'],
  ],
  devops: [
    ['Kubernetes troubleshooting', 'https://kubernetes.io/docs/tasks/debug/'],
    ['GitHub Actions troubleshooting', 'https://docs.github.com/actions/monitoring-and-troubleshooting-workflows/troubleshooting-workflows'],
    ['NGINX admin guide', 'https://docs.nginx.com/nginx/admin-guide/'],
  ],
  docker: [
    ['Docker Engine troubleshooting', 'https://docs.docker.com/engine/daemon/troubleshoot/'],
    ['Docker Compose documentation', 'https://docs.docker.com/compose/'],
    ['Kubernetes workload debugging', 'https://kubernetes.io/docs/tasks/debug/debug-application/'],
  ],
  hardware: [
    ['Intel support documentation', 'https://www.intel.com/content/www/us/en/support.html'],
    ['Microsoft Device Manager help', 'https://support.microsoft.com/windows/device-manager-faq-8c7f1f8b-7649-4ab8-89f1-3f24acbc6832'],
    ['Crucial memory troubleshooting', 'https://www.crucial.com/support'],
  ],
  network: [
    ['Cisco networking basics', 'https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/networking-basics.html'],
    ['Microsoft network troubleshooting', 'https://support.microsoft.com/windows/fix-network-connection-issues-in-windows-166a28c4-14c1-bdb1-473c-09c1571455d8'],
    ['Cloudflare DNS learning center', 'https://www.cloudflare.com/learning/dns/'],
  ],
  security: [
    ['Microsoft Defender troubleshooting', 'https://learn.microsoft.com/microsoft-365/security/defender-endpoint/troubleshoot-microsoft-defender-antivirus'],
    ['OWASP Web Security Testing Guide', 'https://owasp.org/www-project-web-security-testing-guide/'],
    ['CISA cyber guidance', 'https://www.cisa.gov/resources-tools/resources'],
  ],
  storage: [
    ['Microsoft Storage Spaces guidance', 'https://support.microsoft.com/windows/storage-spaces-in-windows-544eac8b-2f88-1a0e-9715-0d7202f2f2e1'],
    ['Apple Disk Utility guide', 'https://support.apple.com/guide/disk-utility/welcome/mac'],
    ['Synology storage manager help', 'https://kb.synology.com/DSM/help/DSM/StorageManager/storage_pool'],
  ],
  bios: [
    ['Intel BIOS update guidance', 'https://www.intel.com/content/www/us/en/support/articles/000005567/boards-and-kits.html'],
    ['Microsoft Secure Boot overview', 'https://learn.microsoft.com/windows-hardware/design/device-experiences/oem-secure-boot'],
    ['UEFI Forum specifications', 'https://uefi.org/specifications'],
  ],
  office: [
    ['Microsoft 365 troubleshooting', 'https://support.microsoft.com/microsoft-365'],
    ['Microsoft Office repair guidance', 'https://support.microsoft.com/office/repair-an-office-application-7821d4b6-7c1d-4205-aa0e-a6b40c5bb88b'],
    ['Google Workspace Admin Help', 'https://support.google.com/a/'],
  ],
  browsers: [
    ['Chrome Help troubleshooting', 'https://support.google.com/chrome/'],
    ['Mozilla Firefox support', 'https://support.mozilla.org/products/firefox'],
    ['Microsoft Edge help', 'https://support.microsoft.com/microsoft-edge'],
  ],
  email: [
    ['Microsoft Outlook support', 'https://support.microsoft.com/outlook'],
    ['Google Gmail Help', 'https://support.google.com/mail/'],
    ['Microsoft Exchange troubleshooting', 'https://learn.microsoft.com/exchange/troubleshoot/troubleshoot-exchange-online'],
  ],
  design: [
    ['Adobe Creative Cloud support', 'https://helpx.adobe.com/support.html'],
    ['Figma help center', 'https://help.figma.com/'],
    ['Blender manual troubleshooting', 'https://docs.blender.org/manual/en/latest/troubleshooting/index.html'],
  ],
  virtualization: [
    ['VMware Workstation documentation', 'https://docs.vmware.com/en/VMware-Workstation-Pro/'],
    ['VirtualBox manual', 'https://www.virtualbox.org/manual/'],
    ['Microsoft Hyper-V documentation', 'https://learn.microsoft.com/windows-server/virtualization/hyper-v/hyper-v-technology-overview'],
  ],
  appliance: [
    ['CPSC appliance safety guidance', 'https://www.cpsc.gov/Safety-Education/Safety-Guides'],
    ['ENERGY STAR product resources', 'https://www.energystar.gov/products'],
    ['Repair Clinic appliance troubleshooting', 'https://www.repairclinic.com/RepairHelp'],
  ],
  tvAudio: [
    ['HDMI troubleshooting guidance', 'https://www.hdmi.org/'],
    ['Dolby audio support', 'https://support.dolby.com/'],
    ['Consumer Reports TV setup guidance', 'https://www.consumerreports.org/electronics-computers/tvs/'],
  ],
  tools: [
    ['CPSC power tool safety guidance', 'https://www.cpsc.gov/Safety-Education/Safety-Guides'],
    ['OSHA hand and power tools guidance', 'https://www.osha.gov/hand-power-tools'],
    ['UL product safety resources', 'https://www.ul.com/resources'],
  ],
};

const BRAND_SOURCES = {
  samsung: ['Samsung support', 'https://www.samsung.com/support/'],
  lg: ['LG support', 'https://www.lg.com/support'],
  sony: ['Sony support', 'https://www.sony.com/electronics/support'],
  bosch: ['Bosch home appliance support', 'https://www.bosch-home.com/us/support'],
  siemens: ['Siemens home appliance service', 'https://www.siemens-home.bsh-group.com/service'],
  electrolux: ['Electrolux support', 'https://www.electrolux.com/support/'],
  xiaomi: ['Xiaomi support', 'https://www.mi.com/global/support/'],
  roborock: ['Roborock support', 'https://support.roborock.com/'],
  dreame: ['Dreame support', 'https://www.dreametech.com/pages/support'],
  hp: ['HP printer support', 'https://support.hp.com/printer'],
  canon: ['Canon printer support', 'https://www.usa.canon.com/support'],
  epson: ['Epson printer support', 'https://epson.com/Support/sl/s'],
  brother: ['Brother support', 'https://support.brother.com/'],
  makita: ['Makita support', 'https://www.makitatools.com/service'],
  dewalt: ['DeWalt support', 'https://www.dewalt.com/support'],
  daikin: ['Daikin support', 'https://www.daikincomfort.com/support'],
  mitsubishi: ['Mitsubishi Electric support', 'https://www.mitsubishicomfort.com/customer-support'],
};

const PROBLEMS = {
  software: [
    ['does-not-start', 'не запускается после обновления', 'окно закрывается без понятной ошибки', 'служба, кеш или профиль обновились не полностью'],
    ['access-denied', 'показывает отказ в доступе', 'операция обрывается на правах или политике безопасности', 'права, ACL или корпоративная политика не совпадают с действием'],
    ['slow-response', 'работает заметно медленнее обычного', 'задержки появляются при открытии, сохранении или синхронизации', 'ресурс занят фоновым процессом, индексом или сетевым ожиданием'],
    ['settings-reset', 'сбрасывает настройки после перезапуска', 'выбранные параметры не сохраняются', 'профиль, конфигурационный файл или синхронизация перезаписывают изменения'],
    ['crash-on-open', 'падает при открытии файла или проекта', 'ошибка повторяется на одном наборе данных', 'поврежден кеш, расширение или несовместимая версия компонента'],
    ['update-loop', 'застревает в цикле обновления', 'обновление скачивается повторно и не доходит до результата', 'пакет обновления, подпись или временное хранилище не проходят проверку'],
    ['sync-error', 'не синхронизирует данные', 'локальные изменения не появляются на другом устройстве', 'токен, время системы или конфликт версий блокируют обмен'],
    ['service-stopped', 'останавливает службу или процесс', 'служба стартует вручную, но снова падает', 'зависимость, порт или учетная запись запуска настроены неверно'],
    ['certificate-error', 'ругается на сертификат или доверие', 'браузер, клиент или агент не доверяет соединению', 'цепочка сертификатов, дата или прокси подменяют проверку'],
    ['log-flood', 'забивает журнал повторяющейся ошибкой', 'одинаковые события появляются каждые несколько минут', 'автозапуск повторяет неудачное действие без паузы'],
  ],
  database: [
    ['connection-refused', 'не принимает подключения', 'клиенты получают отказ или таймаут', 'порт, bind address, firewall или пул подключений настроены неверно'],
    ['slow-query', 'медленно выполняет запросы', 'отчет или API ждут ответ дольше обычного', 'план запроса, индекс или блокировка изменились после роста данных'],
    ['migration-failed', 'не применяет миграцию', 'схема остается на старой версии', 'миграция конфликтует с данными, типами или правами пользователя'],
    ['replication-lag', 'дает отставание репликации', 'реплика показывает старые данные', 'журнал транзакций, сеть или нагрузка на диск не успевают за мастером'],
    ['deadlocks', 'ловит взаимные блокировки', 'часть транзакций откатывается', 'операции обновляют таблицы в разном порядке'],
    ['backup-failed', 'не создает резервную копию', 'backup завершается неполным файлом или ошибкой доступа', 'нет места, прав или стабильного соединения с хранилищем'],
    ['high-cpu', 'нагружает CPU', 'процесс базы держит высокую загрузку', 'появился тяжелый запрос, статистика устарела или включен лишний сбор метрик'],
    ['disk-growth', 'быстро занимает диск', 'каталог данных растет быстрее прогноза', 'логи, WAL/binlog или временные файлы не очищаются'],
    ['encoding-error', 'возвращает ошибку кодировки', 'импорт или запрос ломается на отдельных строках', 'клиент и база используют разные charset/collation'],
    ['permission-denied', 'отказывает пользователю в операции', 'роль видит базу, но не может читать или менять объект', 'grant выдан не на ту схему, таблицу или sequence'],
  ],
  appliance: [
    ['does-not-start', 'не запускается', 'панель реагирует не всегда или цикл не стартует', 'питание, блокировка, режим ожидания или защита мешают старту'],
    ['stops-mid-cycle', 'останавливается в середине цикла', 'работа прерывается до штатного завершения', 'датчик, перегрев, вода или питание дают защитное отключение'],
    ['leaks-water', 'подтекает снизу или у двери', 'после работы остается вода рядом с корпусом', 'уплотнение, шланг, фильтр или перекос корпуса нарушают герметичность'],
    ['bad-smell', 'появился запах при работе', 'запах усиливается после прогрева или простоя', 'остатки, фильтр, конденсат или вентиляция требуют очистки'],
    ['noise-vibration', 'шумит или вибрирует сильнее обычного', 'появился стук, гул или дребезг', 'нагрузка распределена неравномерно, крепеж ослаб или узел изношен'],
    ['error-code', 'показывает код ошибки', 'индикатор или дисплей повторяет один код', 'контроллер видит сбой датчика, нагрева, питания или связи'],
    ['poor-result', 'плохо выполняет основную функцию', 'результат хуже при обычной загрузке и настройках', 'режим, фильтр, расходник или датчик не соответствуют условиям'],
    ['overheats', 'перегревается или выключается по защите', 'корпус заметно горячее обычного', 'вентиляция, нагрузка или загрязнение мешают отводу тепла'],
    ['panel-unresponsive', 'не реагирует на кнопки', 'нажатия срабатывают с задержкой или не срабатывают', 'блокировка панели, влага или сбой контроллера мешают вводу'],
    ['after-cleaning', 'стал работать хуже после чистки', 'проблема появилась сразу после обслуживания', 'деталь установлена не до конца или разъем задет при сборке'],
  ],
  printer: [
    ['offline', 'показывает статус Offline', 'задание остается в очереди и не печатается', 'порт, сеть или служба печати видят устройство по старому адресу'],
    ['paper-jam', 'пишет о замятии бумаги', 'лист не проходит тракт или датчик видит застревание', 'бумага, ролик подачи или датчик загрязнены'],
    ['faded-print', 'печатает бледно или полосами', 'на листе появляются пропуски цвета и текста', 'тонер, чернила, головка или режим качества не подходят задаче'],
    ['driver-error', 'ругается на драйвер', 'печать падает сразу после отправки', 'драйвер, язык печати или очередь повреждены'],
    ['scan-fails', 'не сканирует на компьютер', 'сканер виден, но файл не сохраняется', 'служба сканирования, права папки или сетевой профиль настроены неверно'],
    ['duplex-fails', 'не печатает с двух сторон', 'дуплекс пропадает из настроек или дает ошибку', 'лоток, драйвер или формат бумаги не поддерживают режим'],
    ['wifi-lost', 'теряет Wi-Fi подключение', 'после сна принтер исчезает из сети', 'роутер, DHCP или энергосбережение меняют доступность устройства'],
    ['wrong-size', 'печатает не в тот размер', 'поля и масштаб отличаются от документа', 'формат бумаги задан в приложении, драйвере и лотке по-разному'],
    ['ink-not-detected', 'не видит картридж или тонер', 'расходник установлен, но статус остается ошибочным', 'контакт, чип или защитная лента мешают распознаванию'],
    ['queue-stuck', 'застряла очередь печати', 'новые задания не проходят после одного сбоя', 'spooler держит поврежденное задание или временный файл'],
  ],
  tools: [
    ['does-not-start', 'не включается', 'кнопка нажимается, но мотор не стартует', 'аккумулятор, щетки, блокировка или защита по температуре мешают запуску'],
    ['low-power', 'потерял мощность под нагрузкой', 'обороты падают быстрее обычного', 'аккумулятор, патрон, оснастка или редуктор перегружены'],
    ['overheats', 'перегревается при короткой работе', 'корпус и батарея быстро становятся горячими', 'пыль, тупая оснастка или длительная нагрузка нарушают охлаждение'],
    ['battery-drains', 'быстро разряжает аккумулятор', 'время работы стало заметно меньше', 'аккумулятор изношен, зарядное устройство дает ошибку или режим слишком тяжелый'],
    ['sparks-smell', 'искрит или пахнет гарью', 'появился запах, дым или яркие искры', 'щетки, коллектор, проводка или перегруз требуют остановки и проверки'],
    ['chuck-slip', 'проворачивает патрон или оснастку', 'сверло или насадка смещается при работе', 'патрон загрязнен, изношен или затянут не тем усилием'],
    ['vibration', 'сильно вибрирует', 'инструмент уводит в сторону и сложнее держать', 'оснастка, подшипник или крепление имеют биение'],
    ['charger-error', 'зарядное устройство показывает ошибку', 'индикатор мигает нештатно и батарея не заряжается', 'температура, контакты или несовместимый аккумулятор блокируют заряд'],
    ['mode-switch', 'не переключает режим', 'муфта или режим удара не фиксируется', 'переключатель загрязнен или механизм остановлен под нагрузкой'],
    ['after-service', 'работает хуже после обслуживания', 'проблема появилась после замены расходника', 'оснастка, крышка или разъем установлены не до конца'],
  ],
};

const PROFILES = {
  windows: {
    sourceSet: 'windows',
    tags: ['Windows', 'журнал событий', 'службы'],
    focus: 'Windows, службы, драйверы, журнал событий, обновления, PowerShell, DISM и SFC',
    command: 'Get-WinEvent -LogName System -MaxEvents 40',
    topics: split('Windows Update|Microsoft Store|Проводник Windows|служба печати Windows|Windows Defender|RDP подключение|VPN профиль Windows|Bluetooth в Windows|BitLocker|OneDrive в Windows|планировщик заданий Windows|служба поиска Windows'),
    problems: PROBLEMS.software,
  },
  macos: {
    sourceSet: 'macos',
    tags: ['macOS', 'Finder', 'Disk Utility'],
    focus: 'macOS, Finder, Disk Utility, launchctl, безопасный режим, права доступа и системные журналы',
    command: 'log show --last 1h --style compact',
    topics: split('Finder|Time Machine|iCloud Drive на Mac|Safari в macOS|AirDrop на Mac|Disk Utility|Spotlight|Bluetooth на Mac|Mail в macOS|Keychain Access|Launch Services|Mac App Store'),
    problems: PROBLEMS.software,
  },
  games: {
    sourceSet: 'games',
    tags: ['игры', 'Steam', 'DirectX'],
    focus: 'игра, Steam, Epic Games Launcher, DirectX, Vulkan, FPS, шейдеры и драйвер видеокарты',
    command: 'dxdiag',
    topics: split('Steam игра|Epic Games Launcher|DirectX 12 игра|Vulkan игра|игровой лаунчер|онлайн матчмейкинг|античит игры|сохранения игры|шейдерный кеш|геймпад в игре|облачные сохранения Steam|оверлей Discord в игре'),
    problems: PROBLEMS.software,
  },
  mobile: {
    sourceSet: 'mobile',
    tags: ['Android', 'iPhone', 'мобильное устройство'],
    focus: 'Android, iPhone, мобильная сеть, Wi-Fi, Bluetooth, батарея, разрешения приложений и синхронизация',
    command: null,
    topics: split('Android приложение|iPhone приложение|мобильный интернет|Bluetooth на телефоне|Wi-Fi на смартфоне|камера телефона|геолокация телефона|push уведомления|Google Play|App Store|резервная копия телефона|аккумулятор смартфона'),
    problems: PROBLEMS.software,
  },
  'web-development': {
    sourceSet: 'web',
    tags: ['frontend', 'HTTP', 'DevTools'],
    focus: 'HTTP, DevTools, JavaScript, CSS, CORS, кеш браузера, API запросы и производительность страницы',
    command: 'npm run build',
    topics: split('React приложение|Vue приложение|Next.js страница|Astro сайт|Vite сборка|REST API запрос|CORS настройка|Service Worker|CSS Grid верстка|шрифт на сайте|форма авторизации|клиентский роутинг'),
    problems: PROBLEMS.software,
  },
  programming: {
    sourceSet: 'programming',
    tags: ['код', 'debug', 'CI'],
    focus: 'код, стек ошибки, зависимости, тесты, переменные окружения, Git, CI и логирование',
    command: 'npm test',
    topics: split('Node.js скрипт|Python скрипт|TypeScript проект|Git репозиторий|GitHub Actions workflow|REST клиент|CLI утилита|юнит тесты|JSON конфигурация|dotenv окружение|пакет npm|Python virtualenv'),
    problems: PROBLEMS.software,
  },
  databases: {
    sourceSet: 'databases',
    tags: ['база данных', 'SQL', 'мониторинг'],
    focus: 'база данных, SQL, индекс, транзакция, блокировка, репликация, backup и план запроса',
    command: 'EXPLAIN ANALYZE SELECT 1;',
    topics: split('PostgreSQL таблица|MySQL база|MongoDB коллекция|Redis кеш|SQLite файл|SQL Server база|миграция Prisma|backup базы данных|пул подключений|реплика PostgreSQL|индекс SQL|транзакция базы'),
    problems: PROBLEMS.database,
  },
  devops: {
    sourceSet: 'devops',
    tags: ['DevOps', 'Kubernetes', 'CI/CD'],
    focus: 'CI/CD, Kubernetes, NGINX, systemd, деплой, healthcheck, лог сервиса и rollback',
    command: 'kubectl get pods -A',
    topics: split('Kubernetes deployment|GitHub Actions pipeline|NGINX reverse proxy|systemd сервис|SSH deploy|TLS сертификат сервера|cron job|Prometheus alert|load balancer|blue-green deploy|Docker registry|Linux service healthcheck'),
    problems: PROBLEMS.software,
  },
  docker: {
    sourceSet: 'docker',
    tags: ['Docker', 'Compose', 'контейнеры'],
    focus: 'Docker, контейнер, образ, Compose, volume, сеть bridge, registry, healthcheck и логи контейнера',
    command: 'docker compose ps',
    topics: split('Docker Compose сервис|Docker image build|Docker volume|Docker network|контейнер PostgreSQL|контейнер NGINX|Docker registry login|multi-stage Dockerfile|healthcheck контейнера|Docker Desktop|compose env файл|контейнер Node.js'),
    problems: PROBLEMS.software,
  },
  hardware: {
    sourceSet: 'hardware',
    tags: ['железо', 'драйвер', 'диагностика'],
    focus: 'железо, драйвер, BIOS, температура, питание, PCIe, USB, память и диспетчер устройств',
    command: 'msinfo32',
    topics: split('видеокарта ПК|оперативная память|SSD накопитель|USB устройство|Bluetooth адаптер|звуковая карта|сетевой адаптер|веб-камера|ноутбук после сна|кулер процессора|монитор через HDMI|тачпад ноутбука'),
    problems: PROBLEMS.software,
  },
  network: {
    sourceSet: 'network',
    tags: ['сеть', 'DNS', 'роутер'],
    focus: 'сеть, роутер, DNS, DHCP, Wi-Fi, Ethernet, ping, traceroute, MTU и firewall',
    command: 'ping 8.8.8.8',
    topics: split('Wi-Fi роутер|DNS резолвер|DHCP сервер|Ethernet подключение|VPN туннель|домашняя сеть|mesh Wi-Fi|порт forwarding|сетевой принтер|IP камера|NAS в сети|гостевая сеть'),
    problems: PROBLEMS.software,
  },
  security: {
    sourceSet: 'security',
    tags: ['безопасность', 'антивирус', 'доступ'],
    focus: 'безопасность, антивирус, firewall, сертификат, MFA, права доступа, аудит и подозрительная активность',
    command: 'Get-MpComputerStatus',
    topics: split('Microsoft Defender|firewall правило|MFA вход|сертификат TLS|парольная политика|VPN доступ|учетная запись администратора|подозрительный процесс|браузерное расширение|фишинговое письмо|доступ к папке|журнал аудита'),
    problems: PROBLEMS.software,
  },
  storage: {
    sourceSet: 'storage',
    tags: ['хранилище', 'диск', 'backup'],
    focus: 'диск, SSD, HDD, файловая система, SMART, backup, RAID, NAS, права доступа и свободное место',
    command: 'chkdsk C: /scan',
    topics: split('SSD диск|HDD диск|внешний USB диск|сетевой NAS|RAID массив|раздел Windows|Time Machine backup|Storage Spaces|карта памяти|файловый сервер|папка с правами|резервная копия'),
    problems: PROBLEMS.software,
  },
  'bios-uefi': {
    sourceSet: 'bios',
    tags: ['BIOS', 'UEFI', 'Secure Boot'],
    focus: 'BIOS, UEFI, Secure Boot, TPM, порядок загрузки, прошивка, CMOS и настройки платы',
    command: 'msinfo32',
    topics: split('Secure Boot|TPM 2.0|порядок загрузки UEFI|обновление BIOS|настройки CMOS|XMP профиль памяти|UEFI Boot Manager|Legacy boot|виртуализация VT-x|кулер в BIOS|SATA режим|USB boot'),
    problems: PROBLEMS.software,
  },
  printers: {
    sourceSet: 'office',
    neutralSources: [
      ['Microsoft printer troubleshooting', 'https://support.microsoft.com/windows/fix-printer-connection-and-printing-problems-in-windows-fdb383ed-86f8-4837-9ef6-79e8970c6861'],
      ['Apple printer setup help', 'https://support.apple.com/guide/mac-help/add-a-printer-to-your-printer-list-mh14004/mac'],
      ['CUPS printing system documentation', 'https://openprinting.github.io/cups/doc/'],
    ],
    tags: ['принтер', 'печать', 'драйвер'],
    focus: 'принтер, драйвер печати, очередь, Wi-Fi, USB, тонер, картридж, сканер и формат бумаги',
    command: 'Get-Service Spooler',
    topics: split('HP LaserJet принтер|Canon PIXMA принтер|Epson EcoTank принтер|Brother MFC принтер|Samsung Xpress принтер|сетевой принтер|USB принтер|МФУ для офиса|фотопринтер|лазерный принтер|сканер МФУ|очередь печати Windows'),
    problems: PROBLEMS.printer,
  },
  'audio-video': {
    sourceSet: 'tvAudio',
    tags: ['аудио', 'видео', 'HDMI'],
    focus: 'аудио, видео, HDMI, DisplayPort, кодек, микрофон, камера, разрешение, частота обновления и драйвер',
    command: 'mmsys.cpl',
    topics: split('HDMI звук|USB микрофон|веб-камера|Bluetooth наушники|DisplayPort монитор|захват видео|OBS Studio|4K монитор|саундбар через HDMI ARC|кодек видео|динамики ноутбука|проектор'),
    problems: PROBLEMS.software,
  },
  office: {
    sourceSet: 'office',
    tags: ['Office', 'документы', 'синхронизация'],
    focus: 'Microsoft Office, Word, Excel, Outlook, OneDrive, макросы, шаблон документа и совместная работа',
    command: null,
    topics: split('Microsoft Word документ|Excel книга|PowerPoint презентация|Outlook профиль|OneDrive синхронизация|Teams встреча|Google Docs файл|PDF экспорт|макрос Excel|общий документ|шаблон Office|Microsoft 365 вход'),
    problems: PROBLEMS.software,
  },
  browsers: {
    sourceSet: 'browsers',
    tags: ['браузер', 'Chrome', 'Firefox'],
    focus: 'браузер, Chrome, Firefox, Edge, cookies, кеш, расширение, профиль, TLS и DevTools',
    command: null,
    topics: split('Google Chrome|Mozilla Firefox|Microsoft Edge|профиль браузера|расширение браузера|cookies сайта|кеш браузера|загрузка файлов|вкладки браузера|синхронизация Chrome|прокси браузера|уведомления сайта'),
    problems: PROBLEMS.software,
  },
  email: {
    sourceSet: 'email',
    tags: ['почта', 'Outlook', 'Gmail'],
    focus: 'почта, Outlook, Gmail, IMAP, SMTP, Exchange, SPF, DKIM, вложения, фильтры и синхронизация',
    command: null,
    topics: split('Outlook почта|Gmail аккаунт|IMAP подключение|SMTP отправка|Exchange ящик|почтовые вложения|фильтр почты|подпись письма|общий почтовый ящик|архив Outlook|почта на телефоне|DKIM домена'),
    problems: PROBLEMS.software,
  },
  design: {
    sourceSet: 'design',
    tags: ['дизайн', 'графика', 'экспорт'],
    focus: 'дизайн, Figma, Adobe, Blender, шрифт, слой, экспорт, цветовой профиль, GPU и рендер',
    command: null,
    topics: split('Figma файл|Adobe Photoshop проект|Illustrator документ|Blender сцена|цветовой профиль|шрифты в макете|экспорт PNG|экспорт SVG|слои дизайна|прототип Figma|3D рендер|плагин дизайна'),
    problems: PROBLEMS.software,
  },
  virtualization: {
    sourceSet: 'virtualization',
    tags: ['виртуализация', 'VM', 'Hyper-V'],
    focus: 'виртуализация, виртуальная машина, Hyper-V, VirtualBox, VMware, снапшот, сеть NAT и гостевые дополнения',
    command: 'Get-VM',
    topics: split('VirtualBox VM|VMware Workstation VM|Hyper-V виртуальная машина|снапшот VM|виртуальный диск VHDX|сеть NAT VM|bridged сеть VM|гостевые дополнения|USB passthrough|Linux VM|Windows VM|виртуальный TPM'),
    problems: PROBLEMS.software,
  },
  'washing-machines': {
    sourceSet: 'appliance',
    tags: ['стиральная машина', 'барабан', 'слив'],
    focus: 'стиральная машина, барабан, слив, насос, шланг, люк, фильтр, отжим и нагрев воды',
    command: null,
    topics: split('Samsung стиральная машина|LG стиральная машина|Bosch стиральная машина|Siemens стиральная машина|Electrolux стиральная машина|стиральная машина с сушкой|узкая стиральная машина|инверторная стиральная машина|фронтальная стиральная машина|вертикальная стиральная машина|сливной насос стиральной машины|люк стиральной машины'),
    problems: PROBLEMS.appliance,
  },
  refrigerators: {
    sourceSet: 'appliance',
    tags: ['холодильник', 'компрессор', 'температура'],
    focus: 'холодильник, морозилка, компрессор, испаритель, термостат, уплотнитель, конденсат и температура',
    command: null,
    topics: split('Samsung холодильник|LG холодильник|Bosch холодильник|Siemens холодильник|Electrolux холодильник|No Frost холодильник|двухкамерный холодильник|морозильная камера|винный шкаф|мини-холодильник|дверь холодильника|датчик температуры холодильника'),
    problems: PROBLEMS.appliance,
  },
  dishwashers: {
    sourceSet: 'appliance',
    tags: ['посудомоечная машина', 'мойка', 'фильтр'],
    focus: 'посудомоечная машина, фильтр, слив, насос, разбрызгиватель, соль, ополаскиватель и нагрев воды',
    command: null,
    topics: split('Bosch посудомоечная машина|Siemens посудомоечная машина|Electrolux посудомоечная машина|Samsung посудомоечная машина|LG посудомоечная машина|встраиваемая посудомоечная машина|узкая посудомоечная машина|настольная посудомоечная машина|фильтр посудомойки|слив посудомойки|разбрызгиватель посудомойки|дверца посудомойки'),
    problems: PROBLEMS.appliance,
  },
  'microwaves-ovens': {
    sourceSet: 'appliance',
    tags: ['микроволновка', 'духовка', 'нагрев'],
    focus: 'микроволновка, духовка, нагрев, гриль, конвекция, тарелка, дверца, вентилятор и защита',
    command: null,
    topics: split('Samsung микроволновка|LG микроволновка|Bosch духовой шкаф|Siemens духовка|Electrolux духовка|микроволновка с грилем|встраиваемая духовка|конвекционная духовка|тарелка микроволновки|дверца микроволновки|таймер духовки|вентилятор духовки'),
    problems: PROBLEMS.appliance,
  },
  'ac-heating': {
    sourceSet: 'appliance',
    tags: ['кондиционер', 'отопление', 'фильтр'],
    focus: 'кондиционер, отопление, сплит-система, фильтр, дренаж, компрессор, термостат и поток воздуха',
    command: null,
    topics: split('Daikin кондиционер|Mitsubishi кондиционер|LG кондиционер|Samsung кондиционер|сплит-система|мобильный кондиционер|тепловой насос|электрический обогреватель|термостат отопления|фильтр кондиционера|дренаж кондиционера|наружный блок кондиционера'),
    problems: PROBLEMS.appliance,
  },
  'tvs-audio': {
    sourceSet: 'tvAudio',
    tags: ['телевизор', 'звук', 'HDMI'],
    focus: 'телевизор, Smart TV, HDMI, ARC, звук, пульт, Wi-Fi, прошивка, приложение и изображение',
    command: null,
    topics: split('Samsung Smart TV|LG Smart TV|Sony Bravia TV|Android TV|саундбар|HDMI ARC|пульт телевизора|приложение Smart TV|Wi-Fi телевизора|4K телевизор|Bluetooth на телевизоре|цифровые каналы'),
    problems: PROBLEMS.software,
  },
  vacuums: {
    sourceSet: 'appliance',
    tags: ['пылесос', 'фильтр', 'тяга'],
    focus: 'пылесос, робот-пылесос, фильтр, контейнер, щетка, датчик, база зарядки, тяга и аккумулятор',
    command: null,
    topics: split('Xiaomi робот-пылесос|Roborock робот-пылесос|Dreame робот-пылесос|Samsung пылесос|LG пылесос|беспроводной пылесос|моющий пылесос|вертикальный пылесос|турбощетка пылесоса|контейнер пылесоса|база зарядки робота|датчики робота-пылесоса'),
    problems: PROBLEMS.appliance,
  },
  'power-tools': {
    sourceSet: 'tools',
    tags: ['электроинструмент', 'аккумулятор', 'безопасность'],
    focus: 'электроинструмент, аккумулятор, зарядное устройство, патрон, редуктор, щетки, оснастка и защита',
    command: null,
    topics: split('Makita шуруповерт|Bosch дрель|DeWalt шуруповерт|аккумуляторная дрель|перфоратор|угловая шлифмашина|лобзик|циркулярная пила|зарядное устройство инструмента|аккумулятор инструмента|патрон дрели|режим удара дрели'),
    problems: PROBLEMS.tools,
  },
};

function slugify(value) {
  const dictionary = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return value
    .toLowerCase()
    .split('')
    .map((char) => dictionary[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function detectBrand(value) {
  const lower = value.toLowerCase();
  return Object.keys(BRAND_SOURCES).find((brand) => lower.includes(brand));
}

function sourceObject([title, url]) {
  return { title, url, accessedAt: DATE };
}

function buildSources(profile, topicName) {
  const neutral = (profile.neutralSources ?? SOURCE_SETS[profile.sourceSet] ?? SOURCE_SETS.appliance).map(sourceObject);
  const brand = detectBrand(topicName);
  const brandSource = brand ? sourceObject(BRAND_SOURCES[brand]) : null;
  const result = brandSource ? [brandSource, ...neutral] : neutral;
  const seen = new Set();
  return result.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  }).slice(0, 4);
}

function hash(value) {
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 16);
}

function sentence(value) {
  return value.endsWith('.') ? value : `${value}.`;
}

function buildArticle({ categoryName, categorySlug, profile, topicName, problem, serial }) {
  const [, problemTitle, problemSymptom, problemCause] = problem;
  const title = `${topicName}: ${problemTitle}`;
  const description = `${topicName} ${problemTitle}: как проверить симптомы, найти вероятную причину и исправить без лишних действий. Материал сфокусирован на ${profile.focus}, поэтому читатель видит именно проверки по теме, а не общие советы.`;
  const symptoms = [
    `${topicName}: ${problemSymptom}.`,
    `Проблема повторяется после перезапуска или нового запуска рабочего цикла.`,
    `В логах, индикаторах или статусе видно однотипное предупреждение, связанное с ${profile.focus}.`,
    `После изменения настроек результат временно улучшается, но затем снова возвращается к ошибке.`,
  ];
  const causes = [
    sentence(problemCause),
    `Неверный режим, профиль, драйвер, датчик или служба мешают нормальной работе компонента.`,
    `Кеш, очередь, временное состояние или устаревшая настройка конфликтуют с текущей конфигурацией.`,
    `Внешний фактор вроде питания, сети, расходника, версии прошивки или прав доступа искажает диагностику.`,
  ];
  const stepLead = profile.command
    ? `Выполните безопасную диагностическую команду \`${profile.command}\` или откройте штатный журнал, чтобы подтвердить время и контекст сбоя.`
    : `Откройте штатный журнал, статус, индикаторы или экран диагностики, чтобы подтвердить время и контекст сбоя.`;
  const steps = [
    {
      title: 'Зафиксируйте точный сценарий',
      body: `Повторите проблему один раз и запишите, что именно делает ${topicName}, на каком этапе появляется сбой и какие настройки были изменены перед этим.`,
      command: null,
    },
    {
      title: 'Проверьте журнал и статус',
      body: stepLead,
      command: profile.command,
    },
    {
      title: 'Исключите простые внешние причины',
      body: `Проверьте питание, подключение, сеть, расходники, свободное место, права доступа или режим работы. Для темы ${categoryName} это часто быстрее, чем сразу менять сложные настройки.`,
      command: null,
    },
    {
      title: 'Верните проблемный параметр к базовому состоянию',
      body: `Отключите недавно добавленное расширение, профиль, режим, устройство, картридж, фильтр или интеграцию и проверьте, меняется ли поведение ${topicName}.`,
      command: null,
    },
    {
      title: 'Обновите только подтвержденный компонент',
      body: `Обновляйте драйвер, прошивку, пакет, приложение или расходник только после того, как журнал или тест показал связь с ним. Так меньше риск добавить вторую проблему.`,
      command: null,
    },
    {
      title: 'Проверьте исправление контрольным запуском',
      body: `Запустите тот же сценарий повторно, сравните статус, журнал и результат. Если ошибка вернулась, откатите последнее изменение и переходите к следующей подтвержденной причине.`,
      command: null,
    },
  ];

  const body = `## Суть проблемы

${title} обычно выглядит как один повторяемый сбой, но причина может быть в разных слоях: ${profile.focus}. Поэтому начинать лучше не с полного сброса, а с короткой проверки сценария. Зафиксируйте, когда проявляется проблема, что было изменено перед первым появлением и зависит ли сбой от конкретного файла, режима, сети, загрузки или устройства.

## Что проверить перед исправлением

Сначала отделите постоянный сбой от случайного. Если ${topicName} ломается только в одном режиме, проверяйте именно этот режим и связанные с ним настройки. Если ошибка появляется везде, смотрите базовые условия: питание, подключение, права, доступность сервиса, состояние расходников, свободное место и актуальность версии. Для категории ${categoryName} важны признаки по теме: ${profile.focus}. Они помогают не перепутать первопричину с последствиями.

## Как вносить изменения

Меняйте только один параметр за раз и записывайте результат. Начинайте с обратимых действий: перезапуск службы или цикла, очистка очереди, проверка фильтра, временное отключение расширения, повторная авторизация, выбор стандартного режима. Полный сброс, замена детали, переустановка или перепрошивка нужны только тогда, когда простая диагностика уже показала, что проблема действительно в этом узле.

## Проверка результата

После исправления повторите тот же сценарий, в котором ошибка проявлялась изначально. Убедитесь, что исчез не только видимый симптом, но и предупреждение в журнале, индикаторе, очереди или статусе. Если проблема вернулась через несколько минут, после сна, после перезагрузки или после следующего цикла, значит причина осталась активной и нужно проверить следующий пункт из списка причин.

## Когда остановиться

Остановитесь, если появляется запах гари, следы перегрева, вода возле электрики, повторное срабатывание защиты, потеря данных или ошибка безопасности. В таких случаях безопаснее сохранить текущее состояние, отключить питание или доступ и передать диагностику специалисту либо официальной поддержке.`;

  const sources = buildSources(profile, topicName);
  const titleHashInput = [categorySlug, title, description].join('\n');
  const solutionHashInput = [
    categorySlug,
    ...symptoms,
    ...causes,
    ...steps.map((step) => `${step.title}:${step.body}`),
    body,
  ].join('\n');
  const sourceHashInput = [
    categorySlug,
    ...sources.map((source) => source.url),
  ].join('\n');
  const popularitySeed = Number.parseInt(hash(`${title}:${serial}`).slice(0, 6), 16);
  const wordCount = `${body} ${description} ${steps.map((step) => step.body).join(' ')}`.split(/\s+/).length;

  return {
    data: {
      title,
      category: categoryName,
      tags: Array.from(new Set([...profile.tags, topicName.split(' ')[0], 'диагностика'])).slice(0, 6),
      description,
      symptoms,
      causes,
      steps,
      updatedAt: DATE,
      publishedAt: DATE,
      readingTime: Math.max(3, Math.ceil(wordCount / 180)),
      popularityScore: 40 + (popularitySeed % 55),
      sources,
      dedupe: {
        titleHash: hash(titleHashInput),
        solutionHash: hash(solutionHashInput),
        sourceHash: hash(sourceHashInput),
      },
      draft: false,
    },
    body,
  };
}

function readExisting() {
  const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.mdx'));
  const counts = new Map();
  const slugs = new Set();
  for (const file of files) {
    slugs.add(file.replace(/\.mdx$/, ''));
    const fullPath = path.join(CONTENT_DIR, file);
    const parsed = matter.read(fullPath);
    if (!parsed.data.draft) {
      counts.set(parsed.data.category, (counts.get(parsed.data.category) ?? 0) + 1);
    }
  }
  return { counts, slugs };
}

function main() {
  const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
  const { counts, slugs } = readExisting();
  const generated = [];

  for (const category of categories) {
    const current = counts.get(category.name) ?? 0;
    const need = Math.max(0, TARGET_PER_CATEGORY - current);
    if (!need) continue;

    const profile = PROFILES[category.slug];
    if (!profile) {
      throw new Error(`No generation profile for category "${category.slug}"`);
    }

    let created = 0;
    let serial = 0;
    const topics = profile.topics;
    const problems = profile.problems;

    while (created < need) {
      const topicName = topics[serial % topics.length];
      const problem = problems[Math.floor(serial / topics.length) % problems.length];
      const round = Math.floor(serial / (topics.length * problems.length));
      const baseSlug = [
        category.slug,
        slugify(topicName),
        problem[0],
        round > 0 ? `v${round + 1}` : '',
      ].filter(Boolean).join('-');
      serial += 1;

      if (slugs.has(baseSlug)) {
        if (serial > topics.length * problems.length * 4) {
          throw new Error(`Could not find free slug for ${category.slug}`);
        }
        continue;
      }

      const article = buildArticle({
        categoryName: category.name,
        categorySlug: category.slug,
        profile,
        topicName,
        problem,
        serial,
      });
      const markdown = matter.stringify(article.body, article.data, { lineWidth: 100 });
      const filename = `${baseSlug}.mdx`;
      fs.writeFileSync(path.join(CONTENT_DIR, filename), markdown, 'utf8');
      slugs.add(baseSlug);
      generated.push({ category: category.slug, filename });
      created += 1;
    }

    counts.set(category.name, current + created);
    console.log(`${category.slug}: ${current} -> ${current + created} (+${created})`);
  }

  console.log(`Generated ${generated.length} articles`);
}

main();
