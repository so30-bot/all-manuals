export const SITE_NAME = 'All Manuals';
export const DEFAULT_DESCRIPTION = 'Проверенные инструкции All Manuals по исправлению ошибок Windows, программ, техники, сети и баз данных: симптомы, причины и пошаговые решения без лишней воды.';

export function getSiteUrl(): string {
  return import.meta.env.PUBLIC_SITE_URL || 'https://all-manuals.ru';
}

export function getContactEmail(): string {
  return import.meta.env.PUBLIC_CONTACT_EMAIL || 'dmca@all-manuals.ru';
}

export function absoluteUrl(path = '/'): string {
  const site = getSiteUrl().replace(/\/$/, '');
  return `${site}${path.startsWith('/') ? path : `/${path}`}`;
}

const TITLE_SUFFIX = ` | ${SITE_NAME}`;
const MAX_TITLE_LENGTH = 75;

export function getPageTitle(title?: string): string {
  if (!title) return `${SITE_NAME} - решения ошибок компьютеров и программ`;

  const cleanTitle = title.replace(/\s+/g, ' ').trim();
  const withSuffix = `${cleanTitle}${TITLE_SUFFIX}`;

  if (withSuffix.length <= MAX_TITLE_LENGTH) return withSuffix;
  if (cleanTitle.length <= MAX_TITLE_LENGTH) return cleanTitle;

  return shortenTitle(cleanTitle, MAX_TITLE_LENGTH);
}

function shortenTitle(title: string, maxLength: number): string {
  const shortened = title
    .slice(0, maxLength - 1)
    .replace(/\s+\S*$/, '')
    .replace(/[\s:;,.!?-]+$/, '')
    .trim();

  return `${shortened || title.slice(0, maxLength - 1).trim()}…`;
}
