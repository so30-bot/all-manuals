import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { CompiledArticle, ParserConfig } from './types';

export async function processArticleImages(article: CompiledArticle, slug: string, config: ParserConfig): Promise<CompiledArticle> {
  const allowImages = process.env.PARSER_ALLOW_LICENSED_IMAGES === 'true';
  if (!allowImages) return article;

  await fs.mkdir(path.join(config.imagesDir, slug), { recursive: true });

  const steps = await Promise.all(article.steps.map(async (step, index) => {
    const sourceImage = step.image?.src;
    if (!sourceImage || !isLikelyLicensed(sourceImage)) return { ...step, image: null };

    try {
      const response = await fetch(sourceImage, { headers: { 'user-agent': 'AllManualsBot/0.1 (+https://all-manuals.ru/dmca/)' } });
      if (!response.ok) return { ...step, image: null };

      const buffer = Buffer.from(await response.arrayBuffer());
      const fileName = `step-${index + 1}.webp`;
      const outputPath = path.join(config.imagesDir, slug, fileName);
      const metadata = await sharp(buffer).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outputPath);

      return {
        ...step,
        image: {
          src: `/images/errors/${slug}/${fileName}`,
          alt: step.image?.alt || step.title,
          width: metadata.width,
          height: metadata.height
        }
      };
    } catch (error) {
      console.warn(`Image processing failed for ${sourceImage}:`, error);
      return { ...step, image: null };
    }
  }));

  return { ...article, steps };
}

function isLikelyLicensed(url: string): boolean {
  const lowered = url.toLowerCase();
  return lowered.includes('creativecommons') || lowered.includes('license') || lowered.includes('docs') || lowered.includes('learn.microsoft.com');
}
