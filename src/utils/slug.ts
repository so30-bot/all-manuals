export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export function categoryToSlug(category: string): string {
  const known: Record<string, string> = {
    Windows: 'windows',
    Linux: 'linux',
    Игры: 'games',
    'Веб-разработка': 'web-development'
  };

  return known[category] || slugify(category);
}
