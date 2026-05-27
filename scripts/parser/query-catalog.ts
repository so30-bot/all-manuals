type QueryGroup = {
  name: string;
  subjects: string[];
  intents: string[];
};

const commonIntents = [
  'ошибка как исправить',
  'не запускается как исправить',
  'крашит при запуске решение',
  'error code fix',
  'failed to start fix',
  'crash fix latest',
  'не работает после обновления',
  'черный экран решение',
  'вылетает без ошибки решение'
];

const groups: QueryGroup[] = [
  {
    name: 'games-pc',
    subjects: [
      'Counter-Strike 2', 'Dota 2', 'PUBG Battlegrounds', 'Apex Legends', 'Valorant', 'Fortnite', 'Warzone', 'Call of Duty',
      'Battlefield 2042', 'GTA V', 'GTA Online', 'Red Dead Redemption 2', 'Cyberpunk 2077', 'The Witcher 3', 'Baldur\'s Gate 3',
      'Elden Ring', 'Dark Souls 3', 'Armored Core 6', 'Hogwarts Legacy', 'Starfield', 'Skyrim', 'Fallout 4', 'Fallout 76',
      'Minecraft Java', 'Minecraft Bedrock', 'Roblox', 'Terraria', 'Stardew Valley', 'The Sims 4', 'Cities Skylines 2',
      'Forza Horizon 5', 'Microsoft Flight Simulator', 'Euro Truck Simulator 2', 'Farming Simulator', 'Palworld', 'Helldivers 2',
      'The Finals', 'Escape from Tarkov', 'Rust', 'DayZ', 'ARK Survival Ascended', 'No Man\'s Sky', 'Subnautica', 'Sons of the Forest',
      'Project Zomboid', 'War Thunder', 'World of Tanks', 'World of Warcraft', 'Final Fantasy XIV', 'Path of Exile', 'Diablo IV',
      'League of Legends', 'Teamfight Tactics', 'Overwatch 2', 'Rainbow Six Siege', 'Destiny 2', 'Rocket League', 'EA FC',
      'FIFA', 'NBA 2K', 'Mortal Kombat 1', 'Tekken 8', 'Street Fighter 6', 'Resident Evil 4 Remake', 'Resident Evil Village',
      'Phasmophobia', 'Lethal Company', 'Among Us', 'Sea of Thieves', 'Grounded', 'Valheim', 'Hades', 'Hades 2',
      'Factorio', 'Satisfactory', 'RimWorld', 'Crusader Kings 3', 'Hearts of Iron IV', 'Europa Universalis IV', 'Total War Warhammer 3',
      'Civilization VI', 'Age of Empires IV', 'Warhammer 40K Darktide', 'Vermintide 2'
    ],
    intents: commonIntents
  },
  {
    name: 'game-launchers-anticheat',
    subjects: [
      'Steam', 'Epic Games Launcher', 'EA App', 'Ubisoft Connect', 'Battle.net', 'Rockstar Games Launcher', 'GOG Galaxy',
      'Xbox App PC', 'Riot Client', 'Wargaming Game Center', 'VK Play', 'Faceit AC', 'Easy Anti-Cheat', 'BattlEye',
      'Riot Vanguard', 'EA AntiCheat', 'Ricochet Anti-Cheat', 'Steam Deck', 'Proton', 'DXVK', 'Vulkan shader cache'
    ],
    intents: [
      'ошибка запуска игры как исправить', 'ошибка авторизации решение', 'не скачивает игру решение', 'ошибка обновления решение',
      'anti cheat error fix', 'античит не запускается решение', 'ошибка библиотеки DLL решение', 'disk write error fix',
      'cloud sync error fix', 'manifest unavailable fix'
    ]
  },
  {
    name: 'directx-gpu-audio-game-runtime',
    subjects: [
      'DirectX', 'DirectX 11', 'DirectX 12', 'Vulkan', 'OpenGL', 'NVIDIA driver', 'AMD Adrenalin', 'Intel Arc driver',
      'GeForce Experience', 'NVIDIA App', 'DLSS', 'FSR', 'Frame Generation', 'Visual C++ Redistributable', '.NET Framework',
      'XAudio2_7.dll', 'd3d11.dll', 'd3d12.dll', 'dxgi.dll', 'nvlddmkm.sys', 'amdxc64.dll', 'shader compilation', 'gamepad',
      'DualSense PC', 'Xbox controller PC', 'Realtek audio', 'spatial sound Windows'
    ],
    intents: [
      'ошибка игры как исправить', 'fatal error fix', 'device removed fix', 'out of video memory fix', 'не найден dll решение',
      'driver timeout fix', 'низкий fps после обновления', 'звук пропал в игре решение', 'контроллер не работает в игре'
    ]
  },
  {
    name: 'windows',
    subjects: [
      'Windows 11', 'Windows 10', 'Windows Update', 'Microsoft Store', 'Defender', 'BitLocker', 'OneDrive Windows',
      'Task Manager', 'Explorer.exe', 'Start Menu', 'SearchIndexer', 'Remote Desktop', 'Hyper-V', 'WSL', 'Windows Terminal',
      'PowerShell', 'Command Prompt', 'Device Manager', 'Disk Management', 'Event Viewer', 'Task Scheduler', 'Services.msc',
      'Registry Editor', 'Group Policy', 'Windows Security', 'Bluetooth Windows', 'Wi-Fi Windows', 'VPN Windows', 'Printer Windows',
      'USB device Windows', 'BSOD', 'CRITICAL_PROCESS_DIED', 'SYSTEM_SERVICE_EXCEPTION', 'IRQL_NOT_LESS_OR_EQUAL',
      'PAGE_FAULT_IN_NONPAGED_AREA', 'KERNEL_SECURITY_CHECK_FAILURE', 'INACCESSIBLE_BOOT_DEVICE', '0x80070002', '0x80070005',
      '0x80070422', '0x800f081f', '0x80073712', '0xc0000005', '0xc000007b', '0xc0000142', '0xc0000225', '0xc000021a'
    ],
    intents: [
      'как исправить', 'ошибка решение', 'не запускается решение', 'после обновления не работает', 'служба не запускается',
      'код ошибки исправить', 'blue screen fix', 'access denied fix', 'failed to install fix', 'boot error fix'
    ]
  },
  {
    name: 'linux-macos',
    subjects: [
      'Ubuntu', 'Debian', 'Fedora', 'Arch Linux', 'Manjaro', 'Linux Mint', 'Kali Linux', 'CentOS', 'Rocky Linux', 'AlmaLinux',
      'apt', 'dpkg', 'snap', 'flatpak', 'dnf', 'yum', 'pacman', 'systemd', 'NetworkManager', 'PipeWire', 'PulseAudio', 'Wayland',
      'Xorg', 'GRUB', 'kernel panic', 'NVIDIA Linux driver', 'Docker Linux', 'SSH Linux', 'cron', 'nginx Linux', 'Apache Linux',
      'macOS Sonoma', 'macOS Sequoia', 'MacBook', 'Finder', 'Time Machine', 'iCloud Drive', 'Gatekeeper', 'Homebrew', 'zsh',
      'Launch Services', 'Disk Utility', 'AirDrop', 'Continuity Camera'
    ],
    intents: [
      'ошибка как исправить', 'command not found fix', 'permission denied fix', 'failed to start service fix', 'package error fix',
      'boot error fix', 'не работает после обновления', 'kernel error fix', 'brew error fix', 'mac app damaged fix'
    ]
  },
  {
    name: 'android-ios-mobile',
    subjects: [
      'Android', 'Samsung Galaxy', 'Xiaomi', 'Redmi', 'POCO', 'Huawei', 'Honor', 'Realme', 'OPPO', 'Vivo', 'OnePlus',
      'Google Pixel', 'Android Auto', 'Google Play', 'Google Play Services', 'Gboard', 'Chrome Android', 'WhatsApp Android',
      'Telegram Android', 'Bluetooth Android', 'Wi-Fi Android', 'NFC Android', 'mobile hotspot Android', 'iPhone', 'iPad', 'iOS',
      'iCloud', 'App Store', 'Face ID', 'Touch ID', 'AirPods', 'Apple Watch', 'CarPlay', 'iMessage', 'FaceTime', 'Safari iOS'
    ],
    intents: [
      'ошибка как исправить', 'приложение не запускается решение', 'не обновляется решение', 'не подключается решение',
      'battery drain fix', 'authentication error fix', 'sync error fix', 'не приходят уведомления решение', 'не работает камера решение'
    ]
  },
  {
    name: 'desktop-software',
    subjects: [
      'Google Chrome', 'Microsoft Edge', 'Mozilla Firefox', 'Opera', 'Brave', 'Tor Browser', 'Adobe Photoshop', 'Adobe Premiere Pro',
      'Adobe After Effects', 'Adobe Illustrator', 'Adobe Acrobat', 'DaVinci Resolve', 'Blender', 'AutoCAD', 'SolidWorks', 'Fusion 360',
      'Microsoft Word', 'Microsoft Excel', 'Microsoft Outlook', 'Microsoft Teams', 'Zoom', 'Discord', 'Telegram Desktop', 'WhatsApp Desktop',
      'OBS Studio', 'VLC', 'Spotify', 'iTunes Windows', '7-Zip', 'WinRAR', 'Notepad++', 'VS Code', 'JetBrains Toolbox', 'PyCharm',
      'IntelliJ IDEA', 'Android Studio', 'Unity Hub', 'Unreal Engine', 'VirtualBox', 'VMware Workstation', 'Parallels Desktop',
      'Docker Desktop', 'Postman', 'Figma Desktop', 'Canva', 'qBittorrent', 'uTorrent', 'AnyDesk', 'TeamViewer'
    ],
    intents: [
      'ошибка как исправить', 'не открывается решение', 'crash fix', 'installation failed fix', 'update failed fix',
      'login error fix', 'sync error fix', 'не сохраняет файл решение', 'high cpu usage fix', 'black screen fix'
    ]
  },
  {
    name: 'web-dev',
    subjects: [
      'Node.js', 'npm', 'pnpm', 'Yarn', 'Bun', 'Vite', 'Webpack', 'Rollup', 'Next.js', 'React', 'Vue', 'Nuxt', 'SvelteKit',
      'Astro', 'Angular', 'TypeScript', 'ESLint', 'Prettier', 'Tailwind CSS', 'PostCSS', 'Docker', 'Docker Compose', 'Kubernetes',
      'Git', 'GitHub Actions', 'GitLab CI', 'Nginx', 'Apache', 'Caddy', 'Cloudflare Pages', 'Vercel', 'Netlify', 'Firebase',
      'Supabase', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Prisma', 'Drizzle ORM', 'GraphQL', 'REST API', 'OpenAPI',
      'Python pip', 'Poetry', 'Django', 'Flask', 'FastAPI', 'PHP Composer', 'Laravel', 'Ruby Bundler', 'Go modules', 'Rust Cargo'
    ],
    intents: [
      'error fix', 'build failed fix', 'install error fix', 'dependency error fix', 'permission denied fix', 'module not found fix',
      'cannot find module fix', 'type error fix', 'deploy failed fix', 'connection refused fix', 'timeout fix'
    ]
  },
  {
    name: 'network-cloud-security',
    subjects: [
      'Wi-Fi router', 'TP-Link router', 'Keenetic router', 'ASUS router', 'MikroTik', 'Ubiquiti UniFi', 'Zyxel', 'D-Link',
      'DNS', 'Cloudflare DNS', 'VPN', 'WireGuard', 'OpenVPN', 'Tailscale', 'ZeroTier', 'SSH', 'RDP', 'SMB', 'NAS Synology',
      'QNAP NAS', 'TrueNAS', 'Nextcloud', 'Google Drive', 'Dropbox', 'OneDrive', 'Yandex Disk', 'Cloudflare SSL', 'Let\'s Encrypt',
      'Certbot', 'Nginx Proxy Manager', 'fail2ban', 'pfSense', 'OPNsense'
    ],
    intents: [
      'ошибка подключения как исправить', 'connection refused fix', 'timeout fix', 'dns error fix', 'ssl error fix',
      'certificate error fix', 'не подключается решение', 'authentication failed fix', 'network unreachable fix'
    ]
  },
  {
    name: 'hardware-peripherals',
    subjects: [
      'NVIDIA GPU', 'AMD Radeon', 'Intel GPU', 'Intel CPU', 'AMD Ryzen', 'motherboard BIOS', 'UEFI', 'SSD NVMe', 'HDD',
      'RAM XMP', 'DDR5', 'USB device', 'USB-C', 'Bluetooth adapter', 'webcam', 'microphone', 'headphones', 'Realtek driver',
      'printer HP', 'printer Canon', 'printer Epson', 'printer Brother', 'scanner', 'Wacom tablet', 'Elgato Stream Deck',
      'Elgato capture card', 'Logitech mouse', 'Logitech keyboard', 'Razer Synapse', 'Corsair iCUE', 'ASUS Armoury Crate',
      'MSI Center', 'Gigabyte Control Center', 'Lenovo Vantage', 'HP Support Assistant', 'Dell SupportAssist', 'battery laptop',
      'touchpad laptop', 'fingerprint reader', 'external monitor', 'HDMI', 'DisplayPort'
    ],
    intents: [
      'ошибка драйвера как исправить', 'device not recognized fix', 'driver failed fix', 'не определяется решение',
      'не печатает решение', 'нет звука решение', 'не работает Bluetooth решение', 'black screen fix', 'overheating fix'
    ]
  },
  {
    name: 'consoles-smart-home-tv',
    subjects: [
      'PlayStation 5', 'PlayStation 4', 'Xbox Series X', 'Xbox Series S', 'Xbox One', 'Nintendo Switch', 'Steam Deck',
      'LG Smart TV', 'Samsung Smart TV', 'Android TV', 'Google TV', 'Apple TV', 'Mi Box', 'Chromecast', 'Fire TV Stick',
      'Yandex Station', 'Alexa Echo', 'Google Nest', 'Home Assistant', 'Xiaomi Mi Home', 'Tuya Smart', 'Philips Hue',
      'robot vacuum Xiaomi', 'Roborock', 'Eufy', 'GoPro', 'DJI drone', 'Canon camera', 'Sony camera', 'Garmin watch'
    ],
    intents: [
      'ошибка как исправить', 'не подключается решение', 'не обновляется решение', 'network error fix', 'account error fix',
      'black screen fix', 'pairing failed fix', 'firmware update failed fix'
    ]
  }
];

const explicitErrorCodes = [
  '0xc000007b', '0xc0000142', '0xc0000005', '0xc0000906', '0xc000012f', '0xc0000135', '0xc0000022', '0xc00000e9',
  '0x80070005', '0x80070002', '0x80070422', '0x800f081f', '0x80073712', '0x80070643', '0x80240023', '0x80072f8f',
  '0x803f8001', '0x87e0000f', '0x87dd0005', 'CE-108255-1', 'CE-107891-6', 'NP-34958-9', 'WS-116521-6',
  'SU-42118-6', 'E-8210604A', '0x87DD0006', '0x800704cf', '0x80073cf9', '0x80073d0d', 'BLZBNTAGT00000870',
  'BLZBNTBGS000003F8', 'LS-0013', 'IS-0009', 'EAC index not found', 'VAN 9001', 'VAN 1067', 'VAL 5', 'VAL 43',
  'VAC unable to verify', 'DXGI_ERROR_DEVICE_REMOVED', 'DXGI_ERROR_DEVICE_HUNG', 'Out of video memory', 'Unreal Engine fatal error',
  'Java error 1603', 'npm ERR! ENOENT', 'npm ERR! EACCES', 'npm ERR! ECONNRESET', 'Docker WSL integration error'
];

export function buildDefaultQueries(): string[] {
  const queries = new Set<string>();

  for (const group of groups) {
    for (const subject of group.subjects) {
      for (const intent of group.intents) {
        queries.add(`${subject} ${intent}`);
      }
    }
  }

  for (const code of explicitErrorCodes) {
    queries.add(`${code} как исправить`);
    queries.add(`${code} error fix`);
    queries.add(`${code} решение Windows игры программы`);
  }

  return [...queries];
}

export function getQueryCatalogSummary() {
  return {
    groups: groups.map((group) => ({ name: group.name, subjects: group.subjects.length, intents: group.intents.length })),
    explicitErrorCodes: explicitErrorCodes.length,
    totalQueries: buildDefaultQueries().length
  };
}
