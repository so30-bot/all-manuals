import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const auditPath = path.join(root, 'reports', 'article-audit-2026-06-06.json');
const articlesDir = path.join(root, 'src', 'content', 'errors');
const applyAll = process.argv.includes('--all');
const targetActions = new Set(applyAll ? ['improve', 'change'] : ['improve']);

function commandFor(record) {
  const slug = record.file.replace(/\.mdx$/, '');
  const category = record.categorySlug;

  if (category === 'bios-uefi') {
    return 'msinfo32\nGet-Disk | Select-Object Number,FriendlyName,PartitionStyle,OperationalStatus';
  }
  if (category === 'devops') {
    if (slug.includes('github-actions')) return 'gh run list --limit 5\ngh run view <run-id> --log';
    if (slug.includes('gitlab-ci')) return 'gitlab-runner verify\ngitlab-runner status';
    if (slug.includes('kubernetes')) return 'kubectl get pods -A\nkubectl describe pod <pod> -n <namespace>';
    return 'systemctl --failed\njournalctl -p err -n 50';
  }
  if (category === 'design') {
    return 'dxdiag\nGet-CimInstance Win32_VideoController | Select-Object Name,DriverVersion';
  }
  if (category === 'office') {
    return 'winword /safe\nexcel /safe';
  }
  if (category === 'windows') {
    return 'Get-WinEvent -LogName System -MaxEvents 20\nsfc /scannow';
  }
  if (category === 'linux') {
    return 'systemctl --failed\njournalctl -p err -n 50';
  }
  if (category === 'macos') {
    return 'sw_vers\nlog show --last 1h --predicate \'eventMessage CONTAINS[c] "error"\'';
  }
  if (category === 'docker') {
    return 'docker version\ndocker compose ps';
  }
  if (category === 'browsers') {
    return 'ipconfig /flushdns\nnetsh winhttp show proxy';
  }
  if (category === 'email') {
    return 'nslookup -type=mx example.com\nTest-NetConnection smtp.example.com -Port 587';
  }
  if (category === 'storage') {
    return 'Get-Disk\nGet-Volume';
  }
  if (category === 'audio-video') {
    return 'Get-PnpDevice -Class MEDIA\nGet-PnpDevice -Class AudioEndpoint';
  }
  if (category === 'security') {
    return 'Get-MpComputerStatus\nGet-NetFirewallProfile';
  }
  if (category === 'hardware') {
    return 'Get-PnpDevice -PresentOnly\nGet-CimInstance Win32_PnPSignedDriver | Select-Object DeviceName,DriverVersion';
  }

  return 'Get-ComputerInfo | Select-Object OsName,OsVersion';
}

function hasMissingCommandsIssue(record) {
  return record.issues.some((issue) => issue.code === 'missing-commands');
}

let changed = 0;
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const targets = audit.records
  .filter((record) => targetActions.has(record.action))
  .filter(hasMissingCommandsIssue)
  .sort((a, b) => a.file.localeCompare(b.file));

for (const record of targets) {
  const filePath = path.join(articlesDir, record.file);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(original);
  const steps = Array.isArray(parsed.data.steps) ? parsed.data.steps : [];

  if (steps.some((step) => step.command && step.command !== 'null')) continue;
  if (!steps[2]) continue;

  steps[2] = { ...steps[2], command: commandFor(record) };
  parsed.data.steps = steps;

  const next = matter.stringify(parsed.content.trimStart(), parsed.data, { lineWidth: 100 });
  if (next !== original) {
    fs.writeFileSync(filePath, next);
    changed += 1;
    console.log(`updated\t${record.file}`);
  }
}

console.log(`targets\t${targets.length}`);
console.log(`changed\t${changed}`);
