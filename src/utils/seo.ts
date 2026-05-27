export const SITE_NAME = 'All Manuals';
export const DEFAULT_DESCRIPTION = 'Проверенные инструкции по исправлению компьютерных и программных ошибок без лишней воды.';

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

export function getPageTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - решения ошибок компьютеров и программ`;
}
