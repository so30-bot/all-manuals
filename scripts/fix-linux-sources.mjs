import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');

const sourceSets = {
  arch: [
    { title: 'Arch Linux Wiki - General Recommendations', url: 'https://wiki.archlinux.org/title/General_recommendations' },
    { title: 'Arch Linux Wiki - System maintenance', url: 'https://wiki.archlinux.org/title/System_maintenance' },
    { title: 'Arch Linux Wiki - Pacman', url: 'https://wiki.archlinux.org/title/Pacman' },
  ],
  debian: [
    { title: 'Debian Administrator Handbook', url: 'https://www.debian.org/doc/manuals/debian-handbook/' },
    { title: 'Debian Wiki - Apt', url: 'https://wiki.debian.org/Apt' },
    { title: 'Debian Reference', url: 'https://www.debian.org/doc/manuals/debian-reference/' },
  ],
  fedora: [
    { title: 'Fedora Docs - System Administrator Guide', url: 'https://docs.fedoraproject.org/en-US/fedora/latest/system-administrators-guide/' },
    { title: 'Fedora Docs - DNF System Upgrade', url: 'https://docs.fedoraproject.org/en-US/quick-docs/upgrading-fedora-offline/' },
    { title: 'Fedora Quick Docs', url: 'https://docs.fedoraproject.org/en-US/quick-docs/' },
  ],
  ubuntu: [
    { title: 'Ubuntu Server documentation', url: 'https://documentation.ubuntu.com/server/' },
    { title: 'Ubuntu Community Help Wiki', url: 'https://help.ubuntu.com/community/CommunityHelpWiki' },
    { title: 'Ubuntu Packages and apt documentation', url: 'https://help.ubuntu.com/community/AptGet/Howto' },
  ],
  manjaro: [
    { title: 'Manjaro Wiki - Pacman Overview', url: 'https://wiki.manjaro.org/index.php/Pacman_Overview' },
    { title: 'Manjaro Wiki - System Maintenance', url: 'https://wiki.manjaro.org/index.php/System_Maintenance' },
    { title: 'Arch Linux Wiki - General Troubleshooting', url: 'https://wiki.archlinux.org/title/General_troubleshooting' },
  ],
  linux: [
    { title: 'systemd documentation', url: 'https://www.freedesktop.org/software/systemd/man/latest/' },
    { title: 'Linux kernel documentation', url: 'https://docs.kernel.org/' },
    { title: 'The Linux Documentation Project', url: 'https://tldp.org/' },
  ],
  windows: [
    { title: 'Microsoft Learn - Windows recovery environment', url: 'https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/windows-recovery-environment--windows-re--technical-reference' },
    { title: 'Microsoft Learn - Windows troubleshooting', url: 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/' },
    { title: 'Microsoft Support - Recovery options in Windows', url: 'https://support.microsoft.com/windows/recovery-options-in-windows-31ce2444-7de3-818c-d626-e3b5a3024da5' },
  ],
};

function pickSources(file) {
  const lower = file.toLowerCase();
  if (lower.includes('arch')) return sourceSets.arch;
  if (lower.includes('debian')) return sourceSets.debian;
  if (lower.includes('fedora')) return sourceSets.fedora;
  if (lower.includes('ubuntu')) return sourceSets.ubuntu;
  if (lower.includes('manjaro')) return sourceSets.manjaro;
  if (lower.includes('windows')) return sourceSets.windows;
  return sourceSets.linux;
}

function countSources(frontmatter) {
  const match = frontmatter.match(/sources:\r?\n([\s\S]*?)(?=\r?\n[a-zA-Z]|\r?\n---|$)/);
  return match ? (match[1].match(/url:/g) || []).length : 0;
}

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;

  const frontmatter = fmMatch[1];
  const existingCount = countSources(frontmatter);
  if (existingCount >= 3) continue;

  const existingUrls = new Set([...frontmatter.matchAll(/url:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  const additions = pickSources(file).filter((source) => !existingUrls.has(source.url)).slice(0, 3 - existingCount);
  if (additions.length === 0) continue;

  const sourceText = additions.map((source) => [
    `  - title: '${source.title.replace(/'/g, "''")}'`,
    `    url: '${source.url}'`,
    `    accessedAt: '2026-06-04'`,
  ].join('\n')).join('\n');

  const updated = content.replace(/(sources:\r?\n[\s\S]*?)(\r?\ndedupe:)/, `$1\n${sourceText}$2`);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    changed += 1;
  }
}

console.log(`Updated sources in ${changed} files`);
