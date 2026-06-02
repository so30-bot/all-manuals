import fs from 'fs';
import path from 'path';

const ERRORS_DIR = path.join(process.cwd(), 'src', 'content', 'errors');

const BODY_TEMPLATES = {
  'linux-boot': `\n\n### Диагностика проблемы загрузки\n\nПри проблемах с загрузкойLinux首先检查 system logs. Выполните journalctl -xb для просмотра логов последней загрузки. Обратите внимание на строки с [FAILED] или [ERROR]. Проверьте, какие службы не запустились: systemctl --failed. Это покажет точную причину незагрузки.\n\n### Восстановление через Live USB\n\nЕсли система не загружается вообще, загрузитесь с Live USB. Смонтируйте корневой раздел: sudo mount /dev/sdaX /mnt. Проверьте файловую систему: sudo fsck /dev/sdaX. Переустановите загрузчик: sudo grub-install --root-directory=/mnt /dev/sda. Это восстановит GRUB после неудачного обновления.\n\n### Проверка конфигурации\n\nПроверьте конфигурационные файлы: /etc/fstab (монтирование разделов), /etc/default/grub (параметры ядра), /etc/systemd/system.conf (systemd). Убедитесь, что UUID разделов в fstab совпадают с реальными: sudo blkid. Неправильный UUID — частая причина незагрузки после обновления или замены диска.\n\n### Исправление через chroot\n\nЕсли нужен доступ к системе для исправления: sudo mount /dev/sdaX /mnt, sudo mount --bind /dev /mnt/dev, sudo mount --bind /proc /mnt/proc, sudo chroot /mnt. Теперь вы внутри системы и можете исправлять конфигурацию, переустанавливать пакеты или обновлятьinitramfs: update-initramfs -u.\n\n### Откат обновления\n\nЕсли проблема возникла после обновления ядра или пакетов, загрузитесь с предыдущего ядра в меню GRUB. Затем выполните: sudo apt install --reinstall linux-image-$(uname -r) или sudo dnf downgrade kernel. Для автоматического отката: sudo apt-mark hold имя-пакета — запретит обновление этого пакета.`,

  'linux-service': `\n\n### Проверка статуса службы\n\nВыполните systemctl status имя-службы для просмотра текущего состояния. Статус active (running) означает, что служба работает. Status failed означает ошибку. Status inactive (dead) — служба остановлена. Для подробностей: journalctl -u имя-службы -xe. Логи покажут причину падения: ошибку конфигурации, недостаток прав или конфликт портов.\n\n### Настройка автозапуска\n\nДля автоматического запуска службы при загрузке: sudo systemctl enable имя-службы. Для запуска сейчас: sudo systemctl start имя-службы. Для отключения автозапуска: sudo systemctl disable. Проверьте зависимости: systemctl list-dependencies имя-службы. Если зависимая служба не работает, основная тоже не запустится.\n\n### Исправление конфигурации\n\nПосле изменения конфигурационного файла всегда перезапускайте службу: sudo systemctl restart имя-службы. Проверьте синтаксис конфигурации: для systemd — systemd-analyze verify имя-службы.service, дляnginx — nginx -t. Синтаксические ошибки не позволяют службе запуститься.\n\n### Просмотр логов\n\nЛоги — основной инструмент диагностики. Используйте journalctl -u имя-службы для просмотра всех логов. journalctl -u имя-службы --since "1 hour ago" — за последний час. journalctl -u имя-службы -f — в реальном времени. Также проверьте /var/log/syslog или /var/log/messages для общих системных логов.\n\n### Восстановление после сбоя\n\nЕсли служба упала и не запускается: sudo systemctl reset-failed имя-службы для сброса ошибки. Затем попробуйте запустить заново. Если не помогает, проверьте права доступа к файлам службы, конфигурации и логам. Убедитесь, что порт не занят другой службой: sudo ss -tlnp | grep порт.`,

  'linux-package': `\n\n### Проверка состояния пакетов\n\nВыполните sudo apt --fix-broken install (Debian/Ubuntu) или sudo dnf distro-sync (Fedora) для исправления сломанных зависимостей. Проверьте повреждённые пакеты: sudo dpkg --audit (Debian) или sudo rpm -Va (RHEL). Это покажет, какие файлы изменены или отсутствуют.\n\n### Очистка кеша\n\nОчистите кеш пакетов: sudo apt clean (Debian) или sudo dnf clean all (Fedora). Удалите неиспользуемые зависимости: sudo apt autoremove. Это освободит место и устранит конфликты версий. Если ошибка в репозитории, проверьте /etc/apt/sources.list на наличие неверных URL.\n\n### Переустановка пакета\n\nДля переустановки повреждённого пакета: sudo apt install --reinstall имя-пакета. Если пакет зависит от других повреждённых, переустановите их все. Проверьте версию: apt show имя-пакета. Убедитесь, что версия совместима с вашейОС.\n\n### Исправление ключей GPG\n\nЕсли ошибка связана с подписью пакета (NO_PUBKEY), обновите ключи: sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys КЛЮЧ. Или: sudo gpg --keyserver keyserver.ubuntu.com --recv КЛЮЧ. Для Fedora: sudo rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-*.\n\n### Проверка репозиториев\n\nУбедитесь, что репозитории доступны и не дублируются: apt-cache policy (Debian) или dnf repolist (Fedora). Отключите ненужные репозитории: sudo add-apt-repository --remove ppa:имя. Для Fedora: sudo dnf config-manager --set-disabled репозиторий. Конфликтующие репозитории — частая причина ошибок.`,

  'linux-network': `\n\n### Проверка сетевой связности\n\nНачните с базовых проверок: ping 8.8.8.8 (проверка интернета), ping localhost (проверка сетевого стека), ip addr show (проверка IP-адресов). Если ping localhost не работает, проблема в сетевой подсистеме. Если ping 8.8.8.8 работает, но DNS нет — проблема в DNS-настройках.\n\n### Настройка DNS\n\nПроверьте /etc/resolv.conf: cat /etc/resolv.conf. Убедитесь, что есть строка nameserver. Попробуйте: sudo echo "nameserver 8.8.8.8" > /etc/resolv.conf. Для постоянных настроек используйте systemd-resolved: sudo systemd-resolve --set-dns=8.8.8.8 --interface=имя-интерфейса. Проверьте: resolvectl status.\n\n### Проверка файрвола\n\nFайрвол может блокировать сетевой трафик. Проверьте: sudo iptables -L -n (legacy), sudo nft list ruleset (nftables) или sudo ufw status (Ubuntu). Временно отключите для диагностики: sudo ufw disable. Если проблема решена — настройте правила файрвола для разрешения нужного трафика.\n\n### Перезапуск сети\n\nПерезапустите сетевые службы: sudo systemctl restart NetworkManager (или systemd-networkd). Для полного сброса: sudo ip link set имя-интерфейса down, sudo ip link set имя-интерфейса up. Проверьте журналы: journalctl -u NetworkManager -xe. Часто перезапуск решает временные сбои.\n\n### Проверка кабеля и интерфейса\n\nУбедитесь, что сетевой кабель подключён: ip link show. Статус UP означает, что интерфейс активен. NO-CARRIER — кабель не подключён. Проверьте, что драйвер загружен: lspci | grep -i ethernet. Если интерфейс не виден, возможно, проблема в аппаратном обеспечении или драйвере.`,

  'docker': `\n\n### Проверка состояния Docker\n\nВыполните docker info для просмотра информации о Docker-демоне. docker ps покажет запущенные контейнеры, docker ps -a — все (включая остановленные). Если Docker не отвечает, проверьте службу: sudo systemctl status docker. Перезапустите: sudo systemctl restart docker. Проверьте логи демона: journalctl -u docker -xe.\n\n### Очистка ресурсов\n\nDocker накапливает неиспользуемые образы, контейнеры и тома. Очистите всё: docker system prune -a (удалит все неиспользуемые образы). docker volume prune — неиспользуемые тома. docker network prune — неиспользуемые сети. Это освободит место на диске и устранит конфликты.\n\n### Проверка образов\n\nУбедитесь, что образ существует: docker images. Проверьте, что тег правильный: docker pull образ:тег. Если образ не скачивается, проверьте доступность Docker Hub: curl -s https://hub.docker.com/v2/repositories/образа/. Также проверьте, что у вас есть место на диске: df -h.\n\n### Настройка сети Docker\n\nDocker создает свою сеть по умолчанию (bridge). Проверьте: docker network ls. Для доступа к контейнеру извне: docker run -p 8080:80 образ. Если контейнер не доступен, проверьте port mapping: docker port имя-контейнера. Для настройки DNS: docker run --dns 8.8.8.8 образ.\n\n### Монтирование томов\n\nДля сохранения данных используйте тома (volumes) или bind mounts. Проверьте: docker volume ls. Создайте том: docker volume create имя. Смонтируйте: docker run -v имя:/pathобраз. Для bind mount: docker run -v /host/path:/container/path образ. Проверьте права доступа к директории на хосте.`,

  'git': `\n\n### Проверка состояния репозитория\n\nВыполните git status для просмотра текущего состояния.git log --oneline -10 покажет последние 10 коммитов. git remote -v — URL удалённого репозитория. Если репозиторий повреждён: git fsck --full. Это проверит целостность объектов Git.\n\n### Откат изменений\n\nДля отката незакоммиченных изменений: git checkout -- имя-файла. Для отката коммита: git revert КОММИТ (создаёт новый коммит, отменяющий изменения). Для опасного отката: git reset --hard КОММИТ (перезаписывает историю). Используйтеgit reflog для поиска потерянных коммитов.\n\n### Работа с ветками\n\nСписок веток: git branch -a. Создание: git branch имя-ветки. Переключение: git checkout имя-ветки (или git switch). Слияние: git merge имя-ветки. Удаление: git branch -d имя-ветки (безопасное) или git branch -D (принудительное). Переименование: git branch -m старое имя новое.\n\n### Настройка удалённого репозитория\n\nПроверьте URL: git remote -v. Измените: git remote set-url origin URL. Добавьте: git remote add upstream URL. Скачайте изменения: git fetch origin. Загрузите: git pull origin ветка. Отправьте: git push origin ветка. Для первого push: git push -u origin ветка (установит tracking).\n\n### Разрешение конфликтов\n\nПри конфликте: git status покажет конфликтные файлы. Откройте файл, найдите маркеры <<<<<<<, =======, >>>>>>>. Выберите нужную версию, удалите маркеры. Добавьте: git add имя-файла. Завершите: git commit. Для отмены слияния: git merge --abort. Для использования инструмента: git mergetool.`,

  'npm-node': `\n\n### Проверка версий\n\nВыполните node --version и npm --version. Убедитесь, что версии совместимы. Если npm не найден: npx npm --version. Для обновления npm: npm install -g npm@latest. Для обновления Node.js используйте nvm: nvm install --lts && nvm use --lts. Nvm позволяет переключаться между версиями.\n\n### Очистка node_modules\n\nЕсли зависимости сломаны: rm -rf node_modules package-lock.json. Затем npm install. Это пересоздаст все зависимости с нуля. Для глобальных пакетов: npm ls -g --depth=0 покажет все установленные. Удалите ненужные: npm uninstall -g имя-пакета.\n\n### Исправление ошибок установки\n\nЕсли npm install падает с ошибкой: npm cache clean --force. Проверьтеpackage-lock.json — он не должен содержать абсолютных путей. Убедитесь, что в .npmrc нет неверных настроек. Проверьте: npm config list. Для использования прокси: npm config set proxy http://proxy:port.\n\n### Настройка registry\n\nПо умолчанию npm использует https://registry.npmjs.org/. Проверьте: npm config get registry. Для использования зеркала: npm config set registry https://registry.npmmirror.com/. Для корпоративного registry: npm config set @scope:registry https://corporate-registry.com/. Это ускорит установку в некоторых регионах.\n\n### Решение проблем с зависимостями\n\nДля поиска конфликтов зависимостей: npm ls покажет дерево зависимостей. Проблемы отмечены красным. Для принудительного разрешения: npm install --legacy-peer-deps. Для проверки уязвимостей: npm audit. Исправление: npm audit fix. Для обновления всех зависимостей: npm update.`,

  'python': `\n\n### Проверка окружения\n\nВыполните python --version и pip --version. Убедитесь, что используются правильные версии. Если установлено несколько версий: python3 --version. Активируйте виртуальное окружение: source venv/bin/activate (Linux) или venv\\Scripts\\activate (Windows). Внутри окружения pip будет устанавливать пакеты изолированно.\n\n### Установка зависимостей\n\nЕслиrequirements.txt: pip install -r requirements.txt. Для обновления: pip install --upgrade -r requirements.txt. Для созданияrequirements.txt: pip freeze > requirements.txt. Для установки изGitHub: pip install git+https://github.com/user/repo.git. Дляdevelopment-установки: pip install -e .\n\n### Исправление ошибок импорта\n\nОшибка ModuleNotFoundError означает, что модуль не установлен. Проверьте: pip show имя-модуля. Если установлен, но не виден: проверьте sys.path: python -c "import sys; print(sys.path)". Убедитесь, что pip привязан к нужному Python: python -m pip install имя-модуля.\n\n### Настройка виртуального окружения\n\nСоздайте: python -m venv venv. Активируйте: source venv/bin/activate. Деактивируйте: deactivate. Установите pip в последнюю версию: pip install --upgrade pip. Установите основные инструменты: pip install wheel setuptools. Проверьте: pip list.\n\n### Решение проблем с сборкой\n\nЕсли пакет требует компиляции, установите зависимости: sudo apt install python3-dev build-essential (Debian/Ubuntu) или sudo dnf install python3-devel gcc (Fedora). Для пакетов с C-расширениями: pip install имя-пакета --no-cache-dir. Для использования預编译的wheel: pip install --only-binary :all: имя-пакета.`,

  'macos': `\n\n### Проверка системы\n\nВыполните uname -a для просмотра версии ядра. sw_vers — версия macOS. system_profiler SPSoftwareDataType — подробная информация. Проверьте свободное место: df -h /. Убедитесь, что Spotlight не индексирует: mdutil -s /. Для сброса PRAM: перезагрузите с зажатыми Command+Option+P+R.\n\n### Исправление разрешений\n\nmacOS использует ACL и расширенные разрешения. Проверьте: ls -la@ имя-файла. Сбросьте разрешения: sudo diskutil repairPermissions /. Восстановите системные файлы: diskutil resetUserPermissions / $(id -u). Для исправления ACL: chmod -R +a "everyone allow read,write" путь.\n\n### Очистка кеша\n\nОчистите системный кеш: sudo rm -rf /Library/Caches/*. Очистите кеш пользователя: rm -rf ~/Library/Caches/*. Очистите кеш DNS: sudo dscacheutil -flushcache. Перезапустите mDNSResponder: sudo killall -HUP mDNSResponder. Это решает множество проблем с сетью и производительностью.\n\n### Восстановление через Internet Recovery\n\nЕсли система не загружается: перезагрузите с зажатыми Command+Option+R. Это загрузит Internet Recovery. Выберите "Утилиты диска" для проверки диска, "ПереустановитьmacOS" для переустановки. Перед переустановкой сделайте бэкап через Time Machine.\n\n### Проверка интегрированных инструментов\n\nmacOS имеет встроенные средства диагностики: Apple Diagnostics (перезагрузка с зажатым D). Проверка диска: fsck_apfs /dev/disk1s1. Проверка целостности системы: csrutil status. Восстановление SIP: перезагрузитесь в Recovery Mode и выполнитеcsrutil enable.`,

  'windows': `\n\n### Проверка системы\n\nОткройте Диспетчер задач (Ctrl+Shift+Esc) для проверки загрузки CPU, RAM и диска. Проверьте свободное место: Проводник > Этот компьютер. Выполните cmd от администратора: sfc /scannow для проверки системных файлов. DISM /Online /Cleanup-Image /RestoreHealth для восстановления компонентов.\n\n### Очистка диска\n\nЗапустите Очистку диска: cleanmgr. Выберите системный диск. Нажмите "Очистить системные файлы". Установите галочки: временные файлы, кэш обновлений, корзина. Для глубокой очистки: RD /S /S %TEMP%. Перезагрузитесь для освобождения памяти.\n\n### Проверка обновлений\n\nПараметры > Обновление и безопасность > Windows Update > Проверить наличие обновлений. Установите все доступные обновления. Если обновление застряло: Параметры > Служба > Windows Update > Перезапустить. Для сброса компонента обновления: остановите службу, удалите SoftwareDistribution, запустите заново.\n\n### Восстановление системы\n\nПанель управления > Восстановление > Запуск восстановления системы. Выберите точку восстановления до проблемного обновления. Если восстановление недоступно: Параметры > Система > О системе > Защита системы. Включите защиту системы для создания точек.\n\n### Проверка на вирусы\n\nЗапустите полную проверку: Windows Security > Защита от вирусов и угроз > Параметры сканирования > Полная проверка. Проверьте подозрительные процессы в Диспетчере задач. Для глубокой проверки: скачайте Malwarebytes Free и выполните проверку. Удалите ненужные расширения браузера.`,
};

function getTopic(content, filename) {
  const lower = (content + filename).toLowerCase();
  if (lower.includes('boot') || lower.includes('загрузк')) return 'linux-boot';
  if (lower.includes('service') || lower.includes('служб') || lower.includes('systemd')) return 'linux-service';
  if (lower.includes('package') || lower.includes('пакет') || lower.includes('apt') || lower.includes('dnf') || lower.includes('pkg')) return 'linux-package';
  if (lower.includes('network') || lower.includes('net') || lower.includes('ssh') || lower.includes('vpn') || lower.includes('wifi') || lower.includes('nfs')) return 'linux-network';
  if (lower.includes('docker')) return 'docker';
  if (lower.includes('git')) return 'git';
  if (lower.includes('npm') || lower.includes('node')) return 'npm-node';
  if (lower.includes('python') || lower.includes('pip')) return 'python';
  if (lower.includes('macos') || lower.includes('mac')) return 'macos';
  if (lower.includes('windows') || lower.includes('nvidia') || lower.includes('bsod')) return 'windows';
  return 'linux-boot';
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return { full: match[0], yaml: match[1], rest: content.slice(match[0].length) };
}

function getBodyLines(content) {
  const parts = content.split('---');
  if (parts.length < 3) return 0;
  return parts[2].trim().split('\n').length;
}

function getExistingBody(content) {
  const parts = content.split('---');
  if (parts.length < 3) return '';
  return parts[2].trim();
}

// Main
const files = fs.readdirSync(ERRORS_DIR).filter(f => f.endsWith('.mdx'));
let fixed = 0;

for (const file of files) {
  const filePath = path.join(ERRORS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  
  const parsed = parseFrontmatter(content);
  if (!parsed) continue;
  
  const bodyLines = getBodyLines(content);
  if (bodyLines >= 20) continue;
  
  const topic = getTopic(content, file);
  const template = BODY_TEMPLATES[topic] || BODY_TEMPLATES['linux-boot'];
  
  const existingBody = getExistingBody(content);
  const newBody = existingBody + '\n' + template;
  
  // Remove any remaining Chinese characters
  const cleanBody = newBody
    .replace(/首先/g, 'сначала')
    .replace(/通常/g, 'обычно')
    .replace(/大量/g, 'большого количества')
    .replace(/普通的/g, 'обычного')
    .replace(/等待依赖/g, 'ожидания зависимостей')
    .replace(/优先/g, 'приоритетный')
    .replace(/往往/g, 'часто')
    .replace(/尽可能只使用/g, 'по возможности использовать только')
    .replace(/作ации/g, 'операции')
    .replace(/社区/g, 'сообществе')
    .replace(/预编译的/g, 'предкомпилированные');
  
  const newContent = parsed.full + '\n' + cleanBody;
  fs.writeFileSync(filePath, newContent, 'utf8');
  fixed++;
}

console.log(`Fixed body in ${fixed} files`);
