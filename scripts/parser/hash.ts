import crypto from 'node:crypto';

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalizeText(a).split(' ').filter(Boolean));
  const setB = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }

  return intersection / (setA.size + setB.size - intersection);
}
