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
    macOS: 'macos',
    Игры: 'games',
    'Мобильные устройства': 'mobile',
    'Мобильные': 'mobile',
    'Веб-разработка': 'web-development',
    Разработка: 'programming',
    Программирование: 'programming',
    'Базы данных': 'databases',
    'DevOps и облака': 'devops',
    DevOps: 'devops',
    'Docker и контейнеры': 'docker',
    Docker: 'docker',
    Оборудование: 'hardware',
    Сеть: 'network',
    Безопасность: 'security',
    'Хранилища и файлы': 'storage',
    'BIOS и UEFI': 'bios-uefi',
    'Принтеры и сканеры': 'printers',
    'Аудио и видео': 'audio-video',
    'Аудио/Видео': 'audio-video',
    'Офисные программы': 'office',
    Офис: 'office',
    Браузеры: 'browsers',
    'Электронная почта': 'email',
    Почта: 'email',
    'Дизайн и графика': 'design',
    Виртуализация: 'virtualization',
    'Стиральные машины': 'washing-machines',
    Холодильники: 'refrigerators',
    'Посудомоечные машины': 'dishwashers',
    'Микроволновки и духовки': 'microwaves-ovens',
    'Кондиционеры и обогрев': 'ac-heating',
    'Телевизоры и аудио': 'tvs-audio',
    'Пылесосы и роботы-пылесосы': 'vacuums',
    Электроинструмент: 'power-tools',
    'Бытовая техника': 'ac-heating'
  };

  return known[category] || slugify(category);
}
