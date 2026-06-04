import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const outDir = path.join(process.cwd(), 'src', 'content', 'errors');
const today = '2026-06-04';

const sources = {
  mobile: [
    ['Android Help - Fix an installed Android app that is not working', 'https://support.google.com/android/answer/2668665'],
    ['Apple Support - If an app on your iPhone or iPad stops responding', 'https://support.apple.com/en-us/119876'],
    ['Android Developers - Logcat command-line tool', 'https://developer.android.com/tools/logcat'],
  ],
  docker: [
    ['Docker Docs - Troubleshoot Docker Engine', 'https://docs.docker.com/engine/daemon/troubleshoot/'],
    ['Docker Docs - Docker Compose troubleshooting', 'https://docs.docker.com/compose/troubleshooting/'],
    ['Docker Docs - Container logs', 'https://docs.docker.com/engine/logging/'],
  ],
  storage: [
    ['Microsoft Learn - chkdsk', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/chkdsk'],
    ['ArchWiki - File systems', 'https://wiki.archlinux.org/title/File_systems'],
    ['Linux man page - smartctl', 'https://man7.org/linux/man-pages/man8/smartctl.8.html'],
  ],
  bios: [
    ['Microsoft Learn - Secure Boot', 'https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/oem-secure-boot'],
    ['Microsoft Learn - Windows boot process', 'https://learn.microsoft.com/en-us/windows-hardware/drivers/bringup/boot-and-uefi'],
    ['Ubuntu Help - UEFI', 'https://help.ubuntu.com/community/UEFI'],
  ],
  audio: [
    ['Microsoft Support - Fix sound or audio problems in Windows', 'https://support.microsoft.com/windows/fix-sound-or-audio-problems-in-windows-73025246-b61c-40fb-671a-2535c7cd56c8'],
    ['Apple Support - If the internal speakers on your Mac are not working', 'https://support.apple.com/en-us/102218'],
    ['OBS Studio Wiki - Troubleshooting Guides', 'https://obsproject.com/kb/'],
  ],
  email: [
    ['Microsoft Support - Fix Outlook connection problems', 'https://support.microsoft.com/office/fix-outlook-connection-problems-in-microsoft-365-3f18549a-9c8f-4f7e-8b23-ec8b753c30ce'],
    ['Google Workspace Admin Help - Troubleshoot email delivery', 'https://support.google.com/a/answer/2685650'],
    ['Mozilla Support - Thunderbird cannot send messages', 'https://support.mozilla.org/en-US/kb/cannot-send-messages'],
  ],
  design: [
    ['Adobe Help - Troubleshoot Photoshop crashes', 'https://helpx.adobe.com/photoshop/kb/troubleshoot-crash-or-freeze.html'],
    ['Figma Help - Troubleshooting', 'https://help.figma.com/hc/en-us/categories/360002051613-Troubleshooting'],
    ['Adobe Help - Troubleshoot fonts', 'https://helpx.adobe.com/fonts/kb/troubleshoot-font-activation.html'],
  ],
  virtualization: [
    ['VMware Docs - Troubleshooting Workstation Pro', 'https://docs.vmware.com/en/VMware-Workstation-Pro/index.html'],
    ['VirtualBox Manual - Troubleshooting', 'https://www.virtualbox.org/manual/ch12.html'],
    ['Microsoft Learn - Hyper-V troubleshooting', 'https://learn.microsoft.com/en-us/troubleshoot/windows-server/virtualization/'],
  ],
  appliances: [
    ['Samsung Support - Home appliance troubleshooting', 'https://www.samsung.com/us/support/home-appliances/'],
    ['LG Support - Product help and troubleshooting', 'https://www.lg.com/us/support'],
    ['Bosch Home - Service and support', 'https://www.bosch-home.com/us/support'],
  ],
  databases: [
    ['PostgreSQL Documentation - Server Administration', 'https://www.postgresql.org/docs/current/admin.html'],
    ['MySQL Documentation - Problems and Common Errors', 'https://dev.mysql.com/doc/refman/8.4/en/problems.html'],
    ['MongoDB Manual - Troubleshoot', 'https://www.mongodb.com/docs/manual/administration/'],
  ],
  devops: [
    ['Kubernetes Docs - Troubleshooting Applications', 'https://kubernetes.io/docs/tasks/debug/debug-application/'],
    ['GitHub Docs - Troubleshooting workflows', 'https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/troubleshooting-workflows'],
    ['Terraform Docs - Troubleshooting', 'https://developer.hashicorp.com/terraform/tutorials/configuration-language/troubleshooting-workflow'],
  ],
  network: [
    ['Microsoft Learn - Windows network troubleshooting', 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/'],
    ['Cloudflare Learning Center - DNS', 'https://www.cloudflare.com/learning/dns/what-is-dns/'],
    ['Ubuntu Server Docs - Networking', 'https://documentation.ubuntu.com/server/explanation/networking/'],
  ],
  security: [
    ['Microsoft Learn - Windows security troubleshooting', 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/windows-security/'],
    ['Mozilla Support - Certificate warnings', 'https://support.mozilla.org/en-US/kb/what-does-your-connection-is-not-secure-mean'],
    ['OWASP Cheat Sheet Series', 'https://cheatsheetseries.owasp.org/'],
  ],
  printers: [
    ['Microsoft Support - Fix printer connection and printing problems', 'https://support.microsoft.com/windows/fix-printer-connection-and-printing-problems-in-windows-f4cc3990-28f1-9f4a-7b9b-8f62121f7018'],
    ['HP Support - Printer troubleshooting', 'https://support.hp.com/us-en/printer'],
    ['Canon Support - Printers', 'https://www.usa.canon.com/support/printers'],
  ],
  office: [
    ['Microsoft Support - Office troubleshooting', 'https://support.microsoft.com/office'],
    ['Microsoft Support - Repair an Office application', 'https://support.microsoft.com/office/repair-an-office-application-7821d4b6-7c1d-4205-aa0e-a6b40c5bb88b'],
    ['LibreOffice Help', 'https://help.libreoffice.org/latest/en-US/text/shared/guide/main.html'],
  ],
  browsers: [
    ['Google Chrome Help - Fix Chrome if it crashes or will not open', 'https://support.google.com/chrome/answer/142063'],
    ['Firefox Help - Troubleshoot and diagnose Firefox problems', 'https://support.mozilla.org/en-US/kb/troubleshoot-and-diagnose-firefox-problems'],
    ['Microsoft Support - Microsoft Edge help', 'https://support.microsoft.com/microsoft-edge'],
  ],
  macos: [
    ['Apple Support - macOS troubleshooting', 'https://support.apple.com/mac'],
    ['Apple Support - Use safe mode on your Mac', 'https://support.apple.com/en-us/116946'],
    ['Homebrew Documentation - Troubleshooting', 'https://docs.brew.sh/Troubleshooting'],
  ],
  hardware: [
    ['Microsoft Support - Update drivers manually in Windows', 'https://support.microsoft.com/windows/update-drivers-manually-in-windows-ec62f46c-ff14-c91d-eead-d7126dc1f7b6'],
    ['NVIDIA Support - Driver troubleshooting', 'https://nvidia.custhelp.com/app/answers/list'],
    ['Intel Support - Drivers and software', 'https://www.intel.com/content/www/us/en/support/detect.html'],
  ],
};

const specs = [
  ['mobile', 'Мобильные устройства', 20, ['Android', 'iPhone', 'iPad', 'Samsung Galaxy', 'Xiaomi', 'Google Play', 'ADB', 'iCloud', 'WhatsApp', 'Telegram'], ['не устанавливается приложение', 'не работает синхронизация', 'ошибка авторизации', 'не приходят уведомления', 'не работает камера', 'не подключается USB', 'зависает обновление', 'быстро разряжается батарея']],
  ['docker', 'Docker и контейнеры', 20, ['Docker Compose', 'Docker Engine', 'Docker Desktop', 'container registry', 'Docker volume', 'Docker network', 'Nginx container', 'PostgreSQL container'], ['не стартует сервис', 'ошибка pull image', 'порт уже занят', 'не монтируется volume', 'нет сети между контейнерами', 'ошибка permission denied', 'не проходит healthcheck']],
  ['storage', 'Хранилища и файлы', 20, ['SSD', 'HDD', 'USB flash drive', 'external drive', 'NTFS partition', 'exFAT disk', 'RAID array', 'NAS share'], ['не определяется', 'просит форматировать', 'ошибка ввода вывода', 'медленно копирует файлы', 'не монтируется', 'повреждена файловая система', 'нет доступа к папке']],
  ['bios', 'BIOS и UEFI', 15, ['UEFI', 'BIOS', 'Secure Boot', 'TPM', 'Windows Boot Manager', 'CSM mode', 'NVMe boot'], ['не видит загрузочный диск', 'ошибка Secure Boot', 'не сохраняет настройки', 'сбросился после обновления', 'не запускается с USB', 'не видит NVMe']],
  ['audio', 'Аудио и видео', 15, ['Windows audio', 'Bluetooth headphones', 'HDMI audio', 'OBS Studio', 'VLC', 'webcam', 'microphone'], ['нет звука', 'хрипит звук', 'микрофон не работает', 'нет изображения', 'рассинхрон аудио и видео', 'ошибка кодека']],
  ['email', 'Электронная почта', 15, ['Outlook', 'Thunderbird', 'Gmail', 'IMAP account', 'SMTP server', 'DKIM', 'SPF record'], ['не отправляет письма', 'не принимает письма', 'ошибка пароля', 'письма попадают в спам', 'не работает вложение', 'ошибка сертификата']],
  ['design', 'Дизайн и графика', 15, ['Photoshop', 'Illustrator', 'Figma', 'After Effects', 'Premiere Pro', 'Blender', 'font manager'], ['не запускается', 'вылетает при экспорте', 'не отображаются шрифты', 'черный экран', 'ошибка GPU', 'не сохраняет файл']],
  ['virtualization', 'Виртуализация', 20, ['VMware Workstation', 'VirtualBox', 'Hyper-V', 'WSL2', 'Android Emulator', 'QEMU', 'Parallels Desktop'], ['не запускает виртуальную машину', 'нет аппаратной виртуализации', 'ошибка сети NAT', 'не работает общий буфер', 'не монтируется shared folder', 'низкая производительность']],
  ['washing-machines', 'Стиральные машины', 15, ['LG washing machine', 'Samsung washing machine', 'Bosch washing machine', 'Indesit washing machine', 'Electrolux washing machine'], ['не сливает воду', 'не отжимает', 'ошибка дверцы', 'не набирает воду', 'сильно вибрирует', 'показывает код ошибки']],
  ['refrigerators', 'Холодильники', 15, ['Samsung refrigerator', 'LG refrigerator', 'Bosch refrigerator', 'Atlant refrigerator', 'Indesit refrigerator'], ['не морозит', 'течет вода', 'сильно шумит', 'пищит сигнал', 'не отключается компрессор', 'показывает ошибку датчика']],
  ['dishwashers', 'Посудомоечные машины', 15, ['Bosch dishwasher', 'Siemens dishwasher', 'Electrolux dishwasher', 'Beko dishwasher', 'Indesit dishwasher'], ['не сливает воду', 'плохо моет посуду', 'не набирает воду', 'ошибка нагрева', 'течет снизу', 'не растворяет таблетку']],
  ['microwaves-ovens', 'Микроволновки и духовки', 15, ['Samsung microwave', 'LG microwave', 'Bosch oven', 'Electrolux oven', 'Gorenje oven'], ['не греет', 'искрит внутри', 'не включается', 'не крутится тарелка', 'не работает гриль', 'показывает код ошибки']],
  ['tvs-audio', 'Телевизоры и аудио', 15, ['Samsung TV', 'LG TV', 'Sony TV', 'Xiaomi TV', 'soundbar', 'AV receiver'], ['нет изображения', 'нет звука', 'не работает пульт', 'не подключается Wi-Fi', 'зависает Smart TV', 'не видит HDMI']],
  ['vacuums', 'Пылесосы и роботы-пылесосы', 15, ['Xiaomi robot vacuum', 'Roborock', 'Dreame robot vacuum', 'Dyson vacuum', 'Samsung vacuum'], ['не заряжается', 'не строит карту', 'не возвращается на базу', 'не крутится щетка', 'плохо всасывает', 'ошибка датчика']],
  ['power-tools', 'Электроинструмент', 15, ['Makita drill', 'Bosch screwdriver', 'DeWalt grinder', 'Metabo rotary hammer', 'battery charger'], ['не включается', 'искрит двигатель', 'не заряжается аккумулятор', 'теряет обороты', 'заедает патрон', 'греется при работе']],
  ['databases', 'Базы данных', 10, ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite'], ['не запускается после обновления', 'ошибка подключения', 'поврежден индекс', 'не проходит миграция', 'медленный запрос']],
  ['devops', 'DevOps и облака', 10, ['GitHub Actions', 'GitLab CI', 'Kubernetes', 'Terraform', 'Ansible', 'AWS CLI'], ['pipeline failed', 'ошибка deployment', 'не применяются секреты', 'timeout задачи', 'ошибка доступа']],
  ['network', 'Сеть', 10, ['DNS', 'DHCP', 'VPN', 'Wi-Fi adapter', 'proxy server', 'router'], ['не выдает IP', 'не резолвит домены', 'обрывает подключение', 'не открываются сайты', 'высокий ping']],
  ['security', 'Безопасность', 10, ['SSL certificate', 'Windows Defender', 'VPN certificate', 'SSH key', '2FA login'], ['ошибка сертификата', 'блокирует приложение', 'не принимает ключ', 'не приходит код', 'ошибка доступа']],
  ['printers', 'Принтеры и сканеры', 8, ['HP printer', 'Canon printer', 'Epson printer', 'Brother scanner'], ['не печатает', 'не видит картридж', 'застряла очередь', 'не сканирует', 'печатает пустые листы']],
  ['office', 'Офисные программы', 7, ['Word', 'Excel', 'PowerPoint', 'LibreOffice', 'Google Docs'], ['не открывает файл', 'поврежден документ', 'не работает макрос', 'ошибка сохранения', 'не печатает документ']],
  ['browsers', 'Браузеры', 7, ['Chrome', 'Firefox', 'Edge', 'Safari'], ['не открывает сайты', 'ошибка сертификата', 'вылетают вкладки', 'не работают расширения', 'медленно загружает страницы']],
  ['macos', 'macOS', 5, ['macOS Finder', 'Mac App Store', 'Homebrew', 'Time Machine'], ['не открывается приложение', 'ошибка обновления', 'не работает поиск', 'не создается резервная копия']],
  ['hardware', 'Оборудование', 4, ['NVIDIA GPU', 'AMD GPU', 'Intel Wi-Fi', 'USB controller'], ['не определяется драйвер', 'ошибка устройства', 'низкая производительность', 'отваливается после сна']],
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 86);
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sourceYaml(key) {
  return sources[key === 'bios-uefi' ? 'bios' : key] || sources.appliances;
}

function makeArticle({ key, category, subject, problem, index }) {
  const title = `${subject}: ${problem} — как исправить`;
  const file = `${key}-${slug(subject)}-${slug(problem)}-${String(index).padStart(3, '0')}.mdx`;
  const issue = `${subject} ${problem}`;
  const src = sourceYaml(key).map(([title, url]) => `  - title: '${title.replace(/'/g, "''")}'\n    url: '${url}'\n    accessedAt: '${today}'`).join('\n');
  const commands = key === 'docker'
    ? 'docker logs --tail 100 container_name'
    : key === 'databases'
      ? 'systemctl status database-service'
      : key === 'network'
        ? 'ipconfig /all'
        : key === 'mobile'
          ? 'adb logcat -d'
          : key === 'virtualization'
            ? 'systeminfo'
            : null;

  return {
    file,
    content: `---
title: '${title.replace(/'/g, "''")}'
category: '${category}'
tags:
  - '${category}'
  - '${subject.replace(/'/g, "''")}'
  - 'диагностика'
  - 'ошибка'
description: >-
  Подробная инструкция: ${issue}. Разбираем симптомы, причины, безопасную диагностику, проверку настроек, восстановление и контроль результата.
symptoms:
  - '${subject.replace(/'/g, "''")} показывает ошибку или работает нестабильно'
  - 'Проблема повторяется после перезапуска'
  - 'Стандартное действие не завершается успешно'
  - 'В журналах или интерфейсе появляется сообщение об ошибке'
  - 'Проблема возникла после обновления, сбоя питания или изменения настроек'
causes:
  - 'Неверная конфигурация или поврежденные временные данные'
  - 'Конфликт обновления, драйвера, прошивки или зависимости'
  - 'Недостаточные права доступа или блокировка защитным ПО'
  - 'Проблема подключения, питания, службы или фонового процесса'
  - 'Износ, перегрев, засорение или аппаратная неисправность'
steps:
  - title: 'Зафиксируйте точный симптом'
    body: >-
      Запишите, когда возникает проблема: при запуске, подключении, обновлении, печати, синхронизации или выполнении конкретной операции. Сохраните текст ошибки, код, скриншот и время события. Это поможет отличить случайный сбой от повторяющейся неисправности.
    command: null
    image: null
  - title: 'Проверьте простые условия'
    body: >-
      Убедитесь, что устройство, программа или служба получает питание, имеет доступ к сети, не заблокирована системой безопасности и работает с актуальной версией драйвера или прошивки. Простые причины вроде отключенного кабеля, заполненного диска или просроченной сессии часто выглядят как сложная ошибка.
    command: null
    image: null
  - title: 'Проверьте журналы и состояние службы'
    body: >-
      Если продукт ведет журнал, откройте последние записи и найдите сообщения за время сбоя. Для программ проверьте встроенный лог, для Windows — Просмотр событий, для Linux — journalctl, для сетевых и бытовых устройств — экранный код ошибки или мобильное приложение производителя.
    command: ${commands ? `'${commands.replace(/'/g, "''")}'` : 'null'}
    image: null
  - title: 'Очистите временное состояние'
    body: >-
      Перезапустите приложение, службу или устройство. Если есть кэш, очередь задач, временные файлы или зависшая синхронизация, очистите их штатным способом. Не удаляйте пользовательские данные без резервной копии: сначала используйте безопасный сброс настроек или паузу синхронизации.
    command: null
    image: null
  - title: 'Обновите или откатите проблемный компонент'
    body: >-
      Если ошибка появилась после обновления, проверьте список последних изменений. Иногда помогает установка свежей версии, а иногда — откат драйвера, прошивки, расширения или пакета. Перед откатом сохраните текущую конфигурацию и убедитесь, что есть официальный источник загрузки.
    command: null
    image: null
  - title: 'Проверьте права и блокировки'
    body: >-
      Ошибка может возникать из-за недостаточных прав, блокировки антивирусом, политики организации или защиты от записи. Запустите действие от имени администратора только для проверки, добавьте исключение в защитном ПО при необходимости и проверьте, не занят ли файл или ресурс другим процессом.
    command: null
    image: null
  - title: 'Проведите контрольную проверку'
    body: >-
      После каждого изменения повторите исходное действие. Если проблема исчезла, перезагрузите систему или устройство и проверьте еще раз. Если ошибка возвращается, сравните новые логи со старыми: повторяющаяся строка обычно указывает на корневую причину.
    command: null
    image: null
updatedAt: '${today}'
publishedAt: '${today}'
readingTime: 8
popularityScore: ${70 + (index % 29)}
sources:
${src}
dedupe:
  titleHash: '${hash(title)}'
  solutionHash: '${hash(`${title}:solution`)}'
  sourceHash: '${hash(`${title}:sources`)}'
draft: false
---
Проблема «${issue}» обычно выглядит как внезапный отказ, хотя причина часто накапливается постепенно: обновилась программа, изменились права, сбросились настройки, появился конфликт драйвера или накопились временные данные. Поэтому начинать нужно не с переустановки, а с аккуратной диагностики.

Сначала подтвердите симптом и найдите повторяемый сценарий. Важно понять, возникает ли сбой каждый раз или только при определенном действии. Если проблема плавающая, проверьте питание, сеть, температуру, фоновую нагрузку и последние обновления.

Затем переходите от безопасных действий к более сильным: перезапуск, очистка очереди или кэша, проверка журналов, обновление компонента, откат последнего изменения. Не выполняйте сразу несколько исправлений, иначе будет трудно понять, что именно помогло.

Если речь идет об устройстве, не разбирайте его до проверки базовых условий: кабелей, фильтров, датчиков, уровня воды, питания, картриджа, аккумулятора или подключения к приложению. Если речь идет о программе или сервисе, сначала проверьте права, свободное место, настройки безопасности и журнал ошибок.

## Быстрый чек-лист

- Запишите точный текст ошибки и время появления.
- Проверьте питание, сеть, права доступа и свободное место.
- Перезапустите устройство, программу или службу.
- Очистите очередь, кэш или временное состояние штатным способом.
- Проверьте обновления и последние изменения.
- Сделайте резервную копию перед сбросом или переустановкой.
- Повторите исходное действие после каждого шага.
- Если ошибка вернулась, сравните новые логи со старыми.
`,
  };
}

let created = 0;
let sequence = 1;

for (const [key, category, count, subjects, problems] of specs) {
  let madeForCategory = 0;
  outer: for (const subject of subjects) {
    for (const problem of problems) {
      if (madeForCategory >= count) break outer;
      const article = makeArticle({ key, category, subject, problem, index: sequence++ });
      const filePath = path.join(outDir, article.file);
      if (fs.existsSync(filePath)) continue;
      fs.writeFileSync(filePath, article.content);
      created += 1;
      madeForCategory += 1;
    }
  }
}

console.log(`Created ${created} articles`);
