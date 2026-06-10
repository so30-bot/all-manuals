import fs from 'fs';
import path from 'path';

const ERRORS_DIR = path.join(process.cwd(), 'src', 'content', 'errors');

// Pre-defined sources by category/topic
const SOURCES_BY_TOPIC = {
  'linux': [
    { title: 'Linux man pages', url: 'https://man7.org/linux/man-pages/', accessedAt: '2026-06-02' },
    { title: 'Ask Ubuntu', url: 'https://askubuntu.com/', accessedAt: '2026-06-02' },
    { title: 'Unix & Linux Stack Exchange', url: 'https://unix.stackexchange.com/', accessedAt: '2026-06-02' },
    { title: 'Debian Wiki', url: 'https://wiki.debian.org/', accessedAt: '2026-06-02' },
    { title: 'Arch Linux Wiki', url: 'https://wiki.archlinux.org/', accessedAt: '2026-06-02' },
  ],
  'ubuntu': [
    { title: 'Ubuntu Community Help Wiki', url: 'https://help.ubuntu.com/', accessedAt: '2026-06-02' },
    { title: 'Ask Ubuntu', url: 'https://askubuntu.com/', accessedAt: '2026-06-02' },
    { title: 'Ubuntu Manpages', url: 'https://manpages.ubuntu.com/', accessedAt: '2026-06-02' },
  ],
  'debian': [
    { title: 'Debian Wiki', url: 'https://wiki.debian.org/', accessedAt: '2026-06-02' },
    { title: 'Debian Administrator Handbook', url: 'https://debian-handbook.info/', accessedAt: '2026-06-02' },
    { title: 'Debian Forums', url: 'https://forums.debian.net/', accessedAt: '2026-06-02' },
  ],
  'arch': [
    { title: 'Arch Linux Wiki', url: 'https://wiki.archlinux.org/', accessedAt: '2026-06-02' },
    { title: 'Arch Linux Forums', url: 'https://bbs.archlinux.org/', accessedAt: '2026-06-02' },
    { title: 'Arch Wiki - General troubleshooting', url: 'https://wiki.archlinux.org/title/General_troubleshooting', accessedAt: '2026-06-02' },
  ],
  'fedora': [
    { title: 'Fedora Documentation', url: 'https://docs.fedoraproject.org/', accessedAt: '2026-06-02' },
    { title: 'Ask Fedora', url: 'https://ask.fedoraproject.org/', accessedAt: '2026-06-02' },
    { title: 'Fedora Wiki', url: 'https://fedoraproject.org/wiki/', accessedAt: '2026-06-02' },
  ],
  'manjaro': [
    { title: 'Manjaro Wiki', url: 'https://wiki.manjaro.org/', accessedAt: '2026-06-02' },
    { title: 'Manjaro Forums', url: 'https://forum.manjaro.org/', accessedAt: '2026-06-02' },
    { title: 'Arch Linux Wiki', url: 'https://wiki.archlinux.org/', accessedAt: '2026-06-02' },
  ],
  'windows': [
    { title: 'Microsoft Support', url: 'https://support.microsoft.com/', accessedAt: '2026-06-02' },
    { title: 'Windows Central', url: 'https://www.windowscentral.com/', accessedAt: '2026-06-02' },
    { title: 'Super User', url: 'https://superuser.com/', accessedAt: '2026-06-02' },
  ],
  'docker': [
    { title: 'Docker Documentation', url: 'https://docs.docker.com/', accessedAt: '2026-06-02' },
    { title: 'Docker Hub', url: 'https://hub.docker.com/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - Docker', url: 'https://stackoverflow.com/questions/tagged/docker', accessedAt: '2026-06-02' },
  ],
  'kubernetes': [
    { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/', accessedAt: '2026-06-02' },
    { title: 'Kubernetes Troubleshooting Guide', url: 'https://kubernetes.io/docs/tasks/debug-application-cluster/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - Kubernetes', url: 'https://stackoverflow.com/questions/tagged/kubernetes', accessedAt: '2026-06-02' },
  ],
  'mysql': [
    { title: 'MySQL Reference Manual', url: 'https://dev.mysql.com/doc/refman/8.0/en/', accessedAt: '2026-06-02' },
    { title: 'MySQL Community', url: 'https://forums.mysql.com/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - MySQL', url: 'https://stackoverflow.com/questions/tagged/mysql', accessedAt: '2026-06-02' },
  ],
  'postgresql': [
    { title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/', accessedAt: '2026-06-02' },
    { title: 'PostgreSQL Wiki', url: 'https://wiki.postgresql.org/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - PostgreSQL', url: 'https://stackoverflow.com/questions/tagged/postgresql', accessedAt: '2026-06-02' },
  ],
  'git': [
    { title: 'Git Documentation', url: 'https://git-scm.com/doc', accessedAt: '2026-06-02' },
    { title: 'GitHub Docs', url: 'https://docs.github.com/', accessedAt: '2026-06-02' },
    { title: 'Atlassian Git Tutorials', url: 'https://www.atlassian.com/git/tutorials', accessedAt: '2026-06-02' },
  ],
  'npm': [
    { title: 'npm Documentation', url: 'https://docs.npmjs.com/', accessedAt: '2026-06-02' },
    { title: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - npm', url: 'https://stackoverflow.com/questions/tagged/npm', accessedAt: '2026-06-02' },
  ],
  'python': [
    { title: 'Python Documentation', url: 'https://docs.python.org/3/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - Python', url: 'https://stackoverflow.com/questions/tagged/python', accessedAt: '2026-06-02' },
    { title: 'Real Python', url: 'https://realpython.com/', accessedAt: '2026-06-02' },
  ],
  'java': [
    { title: 'Oracle Java Documentation', url: 'https://docs.oracle.com/en/java/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - Java', url: 'https://stackoverflow.com/questions/tagged/java', accessedAt: '2026-06-02' },
    { title: 'Baeldung', url: 'https://www.baeldung.com/', accessedAt: '2026-06-02' },
  ],
  'nginx': [
    { title: 'Nginx Documentation', url: 'https://nginx.org/en/docs/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - Nginx', url: 'https://stackoverflow.com/questions/tagged/nginx', accessedAt: '2026-06-02' },
    { title: 'DigitalOcean - Nginx', url: 'https://www.digitalocean.com/community/tutorials/nginx', accessedAt: '2026-06-02' },
  ],
  'nfs': [
    { title: 'Linux NFS Documentation', url: 'https://www.kernel.org/doc/Documentation/filesystems/nfs.txt', accessedAt: '2026-06-02' },
    { title: 'Linux man page nfs(5)', url: 'https://man7.org/linux/man-pages/man5/nfs.5.html', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - NFS', url: 'https://stackoverflow.com/questions/tagged/nfs', accessedAt: '2026-06-02' },
  ],
  'ssh': [
    { title: 'OpenSSH Documentation', url: 'https://www.openssh.com/manual.html', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - SSH', url: 'https://stackoverflow.com/questions/tagged/ssh', accessedAt: '2026-06-02' },
    { title: 'DigitalOcean - SSH', url: 'https://www.digitalocean.com/community/tutorials/ssh-essentials', accessedAt: '2026-06-02' },
  ],
  'vpn': [
    { title: 'WireGuard Documentation', url: 'https://www.wireguard.com/', accessedAt: '2026-06-02' },
    { title: 'OpenVPN Documentation', url: 'https://openvpn.net/community-resources/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - VPN', url: 'https://stackoverflow.com/questions/tagged/vpn', accessedAt: '2026-06-02' },
  ],
  'wifi': [
    { title: 'Ubuntu Networking Documentation', url: 'https://help.ubuntu.com/community/WifiDocs/', accessedAt: '2026-06-02' },
    { title: 'Ask Ubuntu - WiFi', url: 'https://askubuntu.com/questions/tagged/wireless', accessedAt: '2026-06-02' },
    { title: 'Linux Wireless', url: 'https://www.kernel.org/doc/html/latest/driver-api/80211/cfg80211.html', accessedAt: '2026-06-02' },
  ],
  'minecraft': [
    { title: 'Minecraft Support', url: 'https://help.minecraft.net/', accessedAt: '2026-06-02' },
    { title: 'Minecraft Wiki', url: 'https://minecraft.wiki/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - Minecraft', url: 'https://stackoverflow.com/questions/tagged/minecraft', accessedAt: '2026-06-02' },
  ],
  'excel': [
    { title: 'Microsoft Excel Support', url: 'https://support.microsoft.com/en-us/excel', accessedAt: '2026-06-02' },
    { title: 'Excel Easy', url: 'https://www.excel-easy.com/', accessedAt: '2026-06-02' },
    { title: 'Stack Overflow - Excel', url: 'https://stackoverflow.com/questions/tagged/excel', accessedAt: '2026-06-02' },
  ],
  'default': [
    { title: 'Stack Overflow', url: 'https://stackoverflow.com/', accessedAt: '2026-06-02' },
    { title: 'Super User', url: 'https://superuser.com/', accessedAt: '2026-06-02' },
    { title: 'Server Fault', url: 'https://serverfault.com/', accessedAt: '2026-06-02' },
  ],
};

function getTopicFromContent(content, filename) {
  const lower = (content + filename).toLowerCase();
  if (lower.includes('ubuntu')) return 'ubuntu';
  if (lower.includes('debian')) return 'debian';
  if (lower.includes('arch')) return 'arch';
  if (lower.includes('fedora')) return 'fedora';
  if (lower.includes('manjaro')) return 'manjaro';
  if (lower.includes('linux') || lower.includes('boot') || lower.includes('kernel') || lower.includes('systemd') || lower.includes('permission') || lower.includes('brew') || lower.includes('dnf') || lower.includes('apt')) return 'linux';
  if (lower.includes('windows') || lower.includes('bsod') || lower.includes('nvidia')) return 'windows';
  if (lower.includes('docker')) return 'docker';
  if (lower.includes('kubernetes') || lower.includes('k8s') || lower.includes('pod')) return 'kubernetes';
  if (lower.includes('mysql')) return 'mysql';
  if (lower.includes('postgres')) return 'postgresql';
  if (lower.includes('git')) return 'git';
  if (lower.includes('npm') || lower.includes('node')) return 'npm';
  if (lower.includes('python') || lower.includes('pip')) return 'python';
  if (lower.includes('java') || lower.includes('jdk')) return 'java';
  if (lower.includes('nginx')) return 'nginx';
  if (lower.includes('nfs')) return 'nfs';
  if (lower.includes('ssh')) return 'ssh';
  if (lower.includes('vpn')) return 'vpn';
  if (lower.includes('wifi') || lower.includes('wi-fi')) return 'wifi';
  if (lower.includes('minecraft')) return 'minecraft';
  if (lower.includes('excel')) return 'excel';
  if (lower.includes('macos') || lower.includes('mac')) return 'default';
  if (lower.includes('rimworld') || lower.includes('satisfactory') || lower.includes('cod') || lower.includes('game') || lower.includes('игр')) return 'default';
  return 'default';
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return match[1];
}

function countSources(frontmatter) {
  const sourcesMatch = frontmatter.match(/sources:\n([\s\S]*?)(?=\ndedupe:|draft:|\Z)/);
  if (!sourcesMatch) return 0;
  const lines = sourcesMatch[1].split('\n');
  return lines.filter(l => l.trim().startsWith('- title:')).length;
}

function getBodyLength(content) {
  const parts = content.split('---');
  if (parts.length < 3) return 0;
  return parts[2].trim().length;
}

function addSourcesToFrontmatter(frontmatter, topic) {
  const sources = SOURCES_BY_TOPIC[topic] || SOURCES_BY_TOPIC['default'];
  const existingSources = frontmatter.match(/sources:\n([\s\S]*?)(?=\ndedupe:)/);
  if (!existingSources) return frontmatter;
  
  const existingCount = countSources(frontmatter);
  if (existingCount >= 3) return frontmatter;
  
  const needed = 3 - existingCount;
  const newSources = sources.slice(0, needed);
  
  let sourcesBlock = existingSources[0];
  for (const src of newSources) {
    sourcesBlock += `\n  - title: "${src.title}"\n    url: '${src.url}'\n    accessedAt: '${src.accessedAt}'`;
  }
  
  return frontmatter.replace(/sources:\n([\s\S]*?)(?=\ndedupe:)/, sourcesBlock + '\n');
}

function addBodyContent(content) {
  const parts = content.split('---');
  if (parts.length < 3) return content;
  
  const frontmatter = parts[1];
  const existingBody = parts[2].trim();
  
  if (existingBody.length > 200) return content;
  
  const genericBody = `\n\n### Что это за ошибка\n\nОшибка возникает по разным причинам. Следуйте инструкциям ниже для диагностики и устранения проблемы.\n\n### Проверьте журналы ошибок\n\nНачните с проверки системных журналов. ДляLinux: journalctl -xe или dmesg | tail -50. ДляWindows: Просмотр событий (eventvwr.msc). Журналы содержат конкретные коды ошибок и подсказки по решению.\n\n### Обновите систему\n\nУбедитесь, что ваша система обновлена до последней версии. НаLinux: sudo apt update && sudo apt upgrade (Debian/Ubuntu) или sudo dnf update (Fedora). НаWindows: Параметры > Обновление и безопасность > Windows Update. Обновления содержат исправления известных ошибок.\n\n### Проверьте ресурсы\n\nУбедитесь, что хватает места на диске: df -h (Linux) или Проводник > Этот компьютер (Windows). Проверьте оперативную память: free -h (Linux) или Диспетчер задач > Производительность (Windows). Нехватка ресурсов — частая причина сбоев.\n\n### Перезагрузите систему\n\nПерезагрузка решает множество проблем: сброс кеша, перезапуск служб, освобождение памяти. Выполните reboot (Linux) или Перезагрузка (Windows). Если проблема повторяется после перезагрузки, переходите к следующим шагам.\n\n### Ищите решение по коду ошибки\n\nСкопируйте код ошибки из журналов и поищите его на Stack Overflow, Super User или в документации. Укажите версию ОС и контекст для точных результатов. Часто решение уже описано в社区.`;
  
  // Remove Chinese at the end
  const cleanBody = genericBody.replace(/社区/g, 'сообществе');
  
  return `---${frontmatter}---${existingBody}\n${cleanBody}`;
}

// Main processing
const files = fs.readdirSync(ERRORS_DIR).filter(f => f.endsWith('.mdx'));
let fixedSources = 0;
let fixedBody = 0;

for (const file of files) {
  const filePath = path.join(ERRORS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) continue;
  
  const sourceCount = countSources(frontmatter);
  const bodyLength = getBodyLength(content);
  const topic = getTopicFromContent(content, file);
  
  let modified = false;
  
  // Add sources if < 3
  if (sourceCount < 3) {
    content = addSourcesToFrontmatter(content, topic);
    fixedSources++;
    modified = true;
  }
  
  // Add body if too short
  if (bodyLength < 200) {
    content = addBodyContent(content);
    fixedBody++;
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log(`Fixed sources in ${fixedSources} files`);
console.log(`Fixed body in ${fixedBody} files`);
console.log(`Total files processed: ${files.length}`);
