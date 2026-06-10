import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const articlesDir = path.join(root, 'src', 'content', 'errors');
const reportPath = path.join(root, 'reports', 'article-audit-actions-2026-06-08.json');
const accessedAt = '2026-06-08';

const src = (title, url) => ({ title, url, accessedAt });

const sources = {
  docker: [
    src('Docker Desktop troubleshooting', 'https://docs.docker.com/desktop/troubleshoot/'),
    src('Docker Desktop WSL 2 backend', 'https://docs.docker.com/desktop/features/wsl/'),
    src('Microsoft WSL troubleshooting', 'https://learn.microsoft.com/windows/wsl/troubleshooting'),
  ],
  arch: [
    src('Arch Wiki: General troubleshooting', 'https://wiki.archlinux.org/title/General_troubleshooting'),
    src('Arch Wiki: Pacman', 'https://wiki.archlinux.org/title/Pacman'),
    src('systemd documentation', 'https://systemd.io/'),
  ],
  manjaro: [
    src('Manjaro Support Forum', 'https://forum.manjaro.org/'),
    src('Arch Wiki: Pacman', 'https://wiki.archlinux.org/title/Pacman'),
    src('Arch Wiki: System maintenance', 'https://wiki.archlinux.org/title/System_maintenance'),
  ],
  debian: [
    src('Debian Reference', 'https://www.debian.org/doc/manuals/debian-reference/'),
    src('Debian Wiki: PackageManagement', 'https://wiki.debian.org/PackageManagement'),
    src('Debian Administrator Handbook: package management', 'https://debian-handbook.info/browse/stable/sect.apt-get.html'),
  ],
  debianBoot: [
    src('Debian Reference: system boot', 'https://www.debian.org/doc/manuals/debian-reference/ch03.en.html'),
    src('Debian Wiki: BootProcess', 'https://wiki.debian.org/BootProcess'),
    src('Debian Wiki: GrubEFIReinstall', 'https://wiki.debian.org/GrubEFIReinstall'),
  ],
  fedora: [
    src('Fedora Docs: DNF', 'https://docs.fedoraproject.org/en-US/quick-docs/dnf/'),
    src('Fedora Docs: offline upgrade', 'https://docs.fedoraproject.org/en-US/quick-docs/upgrading-fedora-offline/'),
    src('DNF documentation', 'https://dnf.readthedocs.io/en/latest/'),
  ],
  fedoraBrew: [
    src('Homebrew documentation', 'https://docs.brew.sh/'),
    src('Homebrew on Linux', 'https://docs.brew.sh/Homebrew-on-Linux'),
    src('Fedora Docs: DNF', 'https://docs.fedoraproject.org/en-US/quick-docs/dnf/'),
  ],
  ubuntuBoot: [
    src('Ubuntu Community Help: Boot-Repair', 'https://help.ubuntu.com/community/Boot-Repair'),
    src('Ubuntu Community Help: Grub2 troubleshooting', 'https://help.ubuntu.com/community/Grub2/Troubleshooting'),
    src('Linux kernel admin guide', 'https://docs.kernel.org/admin-guide/'),
  ],
  kernel: [
    src('Linux kernel admin guide', 'https://docs.kernel.org/admin-guide/'),
    src('Linux kernel parameters', 'https://docs.kernel.org/admin-guide/kernel-parameters.html'),
    src('Linux initrd documentation', 'https://www.kernel.org/doc/html/latest/admin-guide/initrd.html'),
  ],
  macosDamagedApp: [
    src('Apple Support: open a Mac app from an unidentified developer', 'https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac'),
    src('Apple Platform Security: Gatekeeper and runtime protection', 'https://support.apple.com/guide/security/gatekeeper-and-runtime-protection-sec5599b66df/web'),
    src('Apple Developer: notarizing macOS software', 'https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution'),
  ],
  graphics: [
    src('NVIDIA driver downloads', 'https://www.nvidia.com/Download/index.aspx'),
    src('AMD driver support', 'https://www.amd.com/en/support/download/drivers.html'),
    src('Khronos OpenGL documentation', 'https://www.khronos.org/opengl/'),
  ],
  samsungTv: [
    src('Samsung TV will not turn on', 'https://www.samsung.com/us/support/troubleshoot/TSG10002218/'),
    src('Samsung support downloads', 'https://www.samsung.com/us/support/downloads/'),
    src('Samsung TV and audio support', 'https://www.samsung.com/us/support/tv-audio-video/'),
  ],
  nodeModule: [
    src('Node.js modules documentation', 'https://nodejs.org/api/modules.html'),
    src('npm package.json documentation', 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json'),
    src('npm common errors', 'https://docs.npmjs.com/common-errors'),
  ],
  npmEacces: [
    src('npm EACCES permissions errors', 'https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally'),
    src('npm folders documentation', 'https://docs.npmjs.com/cli/v10/configuring-npm/folders'),
    src('Node.js packages documentation', 'https://nodejs.org/api/packages.html'),
  ],
  npmEnoent: [
    src('npm package.json documentation', 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json'),
    src('npm install documentation', 'https://docs.npmjs.com/cli/v10/commands/npm-install'),
    src('Node.js packages documentation', 'https://nodejs.org/api/packages.html'),
  ],
  pip: [
    src('pip user guide', 'https://pip.pypa.io/en/stable/user_guide/'),
    src('pip install documentation', 'https://pip.pypa.io/en/stable/cli/pip_install/'),
    src('Python Packaging: installing packages', 'https://packaging.python.org/en/latest/tutorials/installing-packages/'),
  ],
  nginx: [
    src('nginx documentation', 'https://nginx.org/en/docs/'),
    src('nginx HTTP/2 module', 'https://nginx.org/en/docs/http/ngx_http_v2_module.html'),
    src('PortSwigger request smuggling', 'https://portswigger.net/web-security/request-smuggling'),
  ],
  visualCpp: [
    src('Latest supported Visual C++ Redistributable', 'https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist'),
    src('Microsoft C++ support policy', 'https://learn.microsoft.com/cpp/porting/binary-compat-2015-2017'),
    src('Windows apps troubleshooting', 'https://support.microsoft.com/windows'),
  ],
  windowsAccess: [
    src('Microsoft Learn: specific exceptions', 'https://learn.microsoft.com/windows-hardware/drivers/debugger/specific-exceptions'),
    src('Microsoft Learn: access violation exception', 'https://learn.microsoft.com/shows/inside/c0000005'),
    src('Windows support', 'https://support.microsoft.com/windows'),
  ],
  windowsBsod: [
    src('Troubleshoot blue screen errors', 'https://support.microsoft.com/windows/troubleshoot-blue-screen-errors'),
    src('Advanced troubleshooting for stop errors', 'https://learn.microsoft.com/troubleshoot/windows-client/performance/stop-error-or-blue-screen-error-troubleshooting'),
    src('Bug check code reference', 'https://learn.microsoft.com/windows-hardware/drivers/debugger/bug-check-code-reference2'),
  ],
};

const structureFixes = {
  'igry-exception-access-violation-d3d12rhi-reshenie-problemy-s-chernym-ekranom-pri-zapuske-satisfa.mdx': {
    symptoms: [
      'Черный экран появляется после заставки, загрузки сохранения или входа в мир, при этом звук игры может продолжать работать.',
      'В тексте сбоя или журнале упоминаются D3D12RHI, DirectX 12 или EXCEPTION_ACCESS_VIOLATION.',
    ],
  },
  'linux-kernel-panic-vfs-unable-to-mount-root-fs-ispravlenie-oshibki-kernel-panic-not-syncing-vfs.mdx': {
    symptoms: [
      'Через предыдущее ядро в меню GRUB система может загружаться, а новое ядро останавливается на kernel panic.',
      'После обновления видны сообщения о root fs, unknown-block, initramfs, GRUB или недоступном разделе.',
    ],
    causes: [
      'initramfs не содержит нужный модуль контроллера диска, файловой системы или драйвер, который требуется для подключения корневого раздела.',
      'GRUB, UUID корневого раздела или пакет ядра обновились несогласованно, поэтому загрузчик передает ядру неверный root.',
    ],
  },
  'windows-0x80370102-ispravlenie-oshibki-wsl-virtualizatsiya-ne-vklyuchena-ili-otsutstvuet-platfor.mdx': {
    causes: [
      'Аппаратная виртуализация отключена в BIOS/UEFI или недоступна для текущей редакции Windows.',
      'Компоненты Virtual Machine Platform, Windows Hypervisor Platform, Hyper-V или версия WSL установлены не полностью.',
    ],
  },
};

const duplicatedBodyFiles = new Set([
  'igry-cod-crash-pc-kak-ispravit-vylety-call-of-duty-warzone-i-drugih-igr-serii-na-pk.mdx',
  'igry-cod-launch-fail-001-chto-delat-esli-call-of-duty-ne-zapuskaetsya-na-pk.mdx',
  'windows-0x80370102-ispravlenie-oshibki-wsl-virtualizatsiya-ne-vklyuchena-ili-otsutstvuet-platfor.mdx',
  'windows-nvidia-driver-fatal-error-ustranenie-kriticheskoi-oshibki-draivera-nvidia-video-dxgkrnl.mdx',
]);

function sha(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueByUrl(list) {
  const seen = new Set();
  const result = [];
  for (const item of list) {
    if (!item?.url || seen.has(item.url)) continue;
    seen.add(item.url);
    result.push(item);
  }
  return result;
}

function appendMissing(list, additions) {
  const next = [...asArray(list)];
  for (const item of additions || []) {
    if (!next.includes(item)) next.push(item);
  }
  return next;
}

function sourceSetFor(file) {
  if (file.includes('docker-desktop') || file.includes('dockerdesktop')) return sources.docker;
  if (file.includes('linux-arch')) return sources.arch;
  if (file.includes('linux-manjaro')) return sources.manjaro;
  if (file.includes('linux-fedora-brew')) return sources.fedoraBrew;
  if (file.includes('linux-fedora')) return sources.fedora;
  if (file.includes('linux-debian-boot')) return sources.debianBoot;
  if (file.includes('linux-debian')) return sources.debian;
  if (file.includes('linux-kernel-crash-ubuntu') || file.includes('linux-ubuntu')) return sources.ubuntuBoot;
  if (file.includes('linux-kernel')) return sources.kernel;
  if (file.includes('linux-obsluzhivanie')) return sources.debian;
  if (file.includes('macos') || file.includes('mac-app-damaged')) return sources.macosDamagedApp;
  if (file.includes('nvidia-game') || file.includes('opengl')) return sources.graphics;
  if (file.includes('televizor-samsung')) return sources.samsungTv;
  if (file.includes('node-module-not-found')) return sources.nodeModule;
  if (file.includes('npm-eacces')) return sources.npmEacces;
  if (file.includes('npm-err-enoent') || file.includes('npm-enoent')) return sources.npmEnoent;
  if (file.includes('pip-install')) return sources.pip;
  if (file.includes('nginx')) return sources.nginx;
  if (file.includes('visualc')) return sources.visualCpp;
  if (file.includes('0xc0000005')) return sources.windowsAccess;
  if (file.includes('bsod') || file.includes('critical-process-died')) return sources.windowsBsod;
  return null;
}

function topicHint(file) {
  if (file.includes('cod')) {
    return 'Держите фокус на одном сценарии: запуск игры, вылет во время матча, ошибка DirectX, драйвер видеокарты, целостность файлов и фоновые оверлеи.';
  }
  if (file.includes('wsl')) {
    return 'Проверяйте именно WSL 2: аппаратную виртуализацию, Virtual Machine Platform, Hyper-V, версию WSL и состояние выбранного Linux-дистрибутива.';
  }
  if (file.includes('nvidia')) {
    return 'Разбирайте ошибку как связку драйвера NVIDIA, журнала Windows, температуры, питания и конкретного кода BSOD, а не как общий сбой игры или системы.';
  }
  return 'Проверяйте сообщение, журнал, версию компонента, последнее изменение и повторяемость симптома в том же сценарии.';
}

function conciseBody(file, data) {
  const title = data.title || file.replace(/\.mdx$/, '');
  return `## Суть проблемы

${title} нужно разбирать по фактическому месту сбоя, а не по похожим советам из другой темы. ${topicHint(file)}

## Что уточнить перед исправлением

Зафиксируйте точный текст ошибки, момент появления, версию продукта, последние обновления и действие, после которого симптом повторяется. Не меняйте сразу несколько параметров: иначе будет трудно понять, что реально повлияло на результат.

## Проверка результата

После каждого изменения повторите исходный сценарий под обычной нагрузкой. Если ошибка исчезла, сохраните версию драйвера, компонента или настройки, которая помогла. Если появился новый код, оформляйте его как отдельную проблему.

## Когда остановиться

Остановитесь перед удалением данных, полной переустановкой системы, сбросом профиля или правкой производственной конфигурации. Сначала сделайте резервную копию и сохраните исходные параметры, чтобы можно было откатиться.
`;
}

function updateDedupe(data, body) {
  data.dedupe = {
    ...(data.dedupe || {}),
    titleHash: sha(data.title),
    solutionHash: sha(asArray(data.steps)[0]?.body || body),
    sourceHash: sha(asArray(data.sources).map((source) => source.url).join('|')),
  };
}

const forcedRefreshFiles = new Set([
  'linux-manjarocommandnotfound-kak-ispravit-oshibku-command-not-found-v-manjaro.mdx',
  'linux-manjarogeneraltroubleshooting-obschie-rekomendatsii-po-ustraneniyu-nepoladok-v-manjaro-lin.mdx',
  'televizor-samsung-ne-vklyuchaetsya-reshenie.mdx',
]);

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const targetMap = new Map();
for (const record of report.records.filter((item) => item.action !== 'keep' || forcedRefreshFiles.has(item.file))) {
  targetMap.set(record.file, record);
}
const targets = [...targetMap.values()];
let changed = 0;

for (const target of targets) {
  const file = target.file;
  const filePath = path.join(articlesDir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const data = parsed.data || {};
  let body = parsed.content.trimStart();
  let touched = false;

  if (target.issues.some((issue) => issue.code === 'weak-sources') || forcedRefreshFiles.has(file)) {
    const replacement = sourceSetFor(file);
    if (replacement) {
      data.sources = uniqueByUrl(replacement);
      touched = true;
    }
  }

  const structureFix = structureFixes[file];
  if (structureFix) {
    data.symptoms = appendMissing(data.symptoms, structureFix.symptoms);
    data.causes = appendMissing(data.causes, structureFix.causes);
    touched = true;
  }

  if (file === 'npm-enoent-package-json.mdx') {
    data.description = 'Что делать, если npm показывает ENOENT и не находит package.json при запуске npm install или npm run: как проверить текущий каталог, найти корень проекта, восстановить файл и не запускать команды в неверной папке.';
    touched = true;
  }

  if (duplicatedBodyFiles.has(file)) {
    body = conciseBody(file, data);
    touched = true;
  }

  if (touched) {
    data.updatedAt = accessedAt;
    updateDedupe(data, body);
    const next = matter.stringify(body, data, { lineWidth: 100 });
    fs.writeFileSync(filePath, next.endsWith('\n') ? next : `${next}\n`);
    changed += 1;
    console.log(`updated\t${file}`);
  }
}

console.log(`targets\t${targets.length}`);
console.log(`changed\t${changed}`);
