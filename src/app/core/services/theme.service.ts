import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'dtw_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.restore());

  constructor() {
    // Synchronise la classe `dark` sur <html> à chaque changement du signal.
    effect(() => {
      const value = this.theme();
      document.documentElement.classList.toggle('dark', value === 'dark');
      localStorage.setItem(STORAGE_KEY, value);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  private restore(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored === 'dark' ? 'dark' : 'light';
  }
}