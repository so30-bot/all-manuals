/// <reference path="../.astro/types.d.ts" />

interface Window {
  __allManualsTheme?: {
    applyTheme: (theme: string) => void;
    readTheme: () => string;
    storageKey: string;
  };
}
