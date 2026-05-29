import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import matter from 'gray-matter';

const ARTICLES_DIR = path.resolve('src/content/errors');
const OUTPUT_DIR = path.resolve('public/images/og');

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function generateSvg(title: string, category: string): string {
  const escapedTitle = escapeXml(title);
  const escapedCategory = escapeXml(category);
  const lines = wrapLines(title, 40);
  const lineHeight = 56;
  const totalHeight = lines.length * lineHeight;
  const startY = 310 - totalHeight / 2 + lineHeight / 2;

  const tspans = lines.map((line, i) => {
    const dy = i === 0 ? startY - 300 : lineHeight;
    return `    <tspan x="600" dy="${dy}">${escapeXml(line)}</tspan>`;
  }).join('\n');

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ogBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#ogBg)"/>
  <circle cx="1100" cy="50" r="200" fill="#1e40af" opacity="0.12"/>
  <circle cx="100" cy="580" r="150" fill="#7c3aed" opacity="0.08"/>
  <rect x="60" y="60" width="1080" height="510" rx="32" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <rect x="100" y="110" width="160" height="36" rx="18" fill="#1e40af"/>
  <text x="180" y="128" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="700" fill="#93c5fd" text-anchor="middle" dominant-baseline="central">${escapedCategory.toUpperCase()}</text>
  <text x="600" y="300" font-family="Arial,Helvetica,sans-serif" font-size="40" font-weight="800" fill="#ffffff" text-anchor="middle">
${tspans}
  </text>
  <rect x="500" y="380" width="200" height="4" rx="2" fill="#38bdf8"/>
  <text x="600" y="450" font-family="Arial,Helvetica,sans-serif" font-size="20" fill="#64748b" text-anchor="middle" letter-spacing="3">ALL-MANUALS.RU</text>
</svg>`;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
  let generated = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8');
      const { data } = matter(content);
      const title = data.title || '';
      const category = data.category || 'Общее';
      const slug = file.replace(/\.mdx$/, '');
      const outputPath = path.join(OUTPUT_DIR, `${slug}.png`);

      const svg = generateSvg(title, category);
      await sharp(Buffer.from(svg)).png().toFile(outputPath);
      generated++;
    } catch (err) {
      failed++;
      console.error(`Failed OG for ${file}:`, (err as Error).message);
    }
  }

  console.log(`OG images: ${generated} generated, ${failed} failed`);
}

main();
