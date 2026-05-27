import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

const site = process.env.PUBLIC_SITE_URL || 'https://all-manuals.ru';

export default defineConfig({
  site,
  output: 'static',
  integrations: [
    mdx()
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
