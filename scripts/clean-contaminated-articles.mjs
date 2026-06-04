import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src', 'content', 'errors');

const fixes = [
  [/Docker активно исправляет эти ошибки, и обновления thường решают проблему\./g, 'Docker активно исправляет эти ошибки, и обновления часто решают проблему.'],
  [/Сначала сделайтеcommit/g, 'Сначала сделайте commit'],
  [/чемapply/g, 'чем apply'],
  [/Послеapply/g, 'После apply'],
  [/затемgit/g, 'затем git'],
  [/Проверьте, что stash содержит:git/g, 'Проверьте, что stash содержит: git'],
  [/Если stash был удалён \(поп неудачен на старых версиях Git\), восстановите:git/g, 'Если stash был удалён (поп неудачен на старых версиях Git), восстановите: git'],
  [/перед удалением:git/g, 'перед удалением: git'],
  [/^  - title: Пull перед push$/gm, '  - title: Pull перед push'],
  [/Выполнитеforce push/g, 'Выполните force push'],
  [/рекомендуемыйworkflow/g, 'рекомендуемый workflow'],
  [/force, pull/g, 'force, pull'],
  [/пере replay/g, 'переиграет'],
  [/Проверьтеgit/g, 'Проверьте git'],
  [/Используйтеgit/g, 'Используйте git'],
  [/дляnginx/g, 'для nginx'],
  [/обновлятьinitramfs/g, 'обновлять initramfs'],
];

const contaminatedBlocks = [
  /\n\n### Диагностика проблемы загрузки\n\nПри проблемах с загрузкойLinuxсначала检查 system logs\.[\s\S]*?sudo apt-mark hold имя-пакета — запретит обновление этого пакета\.?\s*$/,
  /\n\n### Проверка статуса службы\n\nВыполните systemctl status имя-службы[\s\S]*?sudo ss -tlnp \| grep порт\.?\s*$/,
];

let changed = 0;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.mdx')) continue;

  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [pattern, replacement] of fixes) {
    content = content.replace(pattern, replacement);
  }

  for (const block of contaminatedBlocks) {
    content = content.replace(block, '');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`);
    changed += 1;
  }
}

console.log(`Cleaned ${changed} article files`);
