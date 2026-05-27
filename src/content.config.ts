import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const sourceSchema = z.object({
  title: z.string(),
  url: z.url(),
  accessedAt: z.string()
});

const articleImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional()
});

const stepSchema = z.object({
  title: z.string(),
  body: z.string(),
  command: z.string().nullable().optional(),
  image: articleImageSchema.nullable().optional()
});

const dedupeSchema = z.object({
  titleHash: z.string(),
  solutionHash: z.string(),
  sourceHash: z.string()
});

const errors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/errors' }),
  schema: z.object({
    title: z.string(),
    errorId: z.string().optional(),
    category: z.string(),
    tags: z.array(z.coerce.string()).default([]),
    description: z.string(),
    symptoms: z.array(z.string()).default([]),
    causes: z.array(z.string()).default([]),
    steps: z.array(stepSchema).default([]),
    updatedAt: z.string(),
    publishedAt: z.string(),
    readingTime: z.number().optional(),
    popularityScore: z.number().default(0),
    sources: z.array(sourceSchema).default([]),
    dedupe: dedupeSchema,
    draft: z.boolean().default(false)
  })
});

export const collections = { errors };
