import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'dtw_sidebar_collapsed';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  collapsed = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');

  toggle(): void {
    this.set(!this.collapsed());
  }

  expand(): void {
    if (this.collapsed()) this.set(false);
  }

  private set(value: boolean): void {
    this.collapsed.set(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }
}