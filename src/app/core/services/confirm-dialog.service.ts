import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // true = style coral (action destructive), false = style gold
}

interface ConfirmDialogState extends Required<ConfirmDialogConfig> {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  request = signal<ConfirmDialogState | null>(null);

  // Retourne une Promise<boolean> — le composant appelant fait juste
  // `if (await confirmDialog.confirm({...})) { ... }`, sans gérer
  // lui-même l'affichage/fermeture du modal.
  confirm(config: ConfirmDialogConfig): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.request.set({
        confirmLabel: 'Confirmer',
        cancelLabel: 'Annuler',
        danger: false,
        ...config,
        resolve
      });
    });
  }

  respond(value: boolean): void {
    const current = this.request();
    if (!current) return;
    this.request.set(null);
    current.resolve(value);
  }
}