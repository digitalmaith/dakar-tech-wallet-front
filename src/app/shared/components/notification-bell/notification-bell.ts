import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { TypeNotification } from '../../../core/models/notification.model';

const TYPE_STYLES: Record<string, string> = {
  VIREMENT_RECU: 'bg-green-500/10 text-green-600 dark:text-green-400',
  VIREMENT_ENVOYE: 'bg-coral/10 text-coral',
  PRET_VALIDE: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
  PRET_REJETE: 'bg-coral/10 text-coral',
  PRET_EN_RETARD: 'bg-coral/10 text-coral'
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html'
})
export class NotificationBellComponent {
  notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);

  open = signal(false);

  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      this.notificationService.refresh();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  onNotificationClick(id: number, lue: boolean, event: MouseEvent): void {
    event.stopPropagation();
    if (!lue) {
      this.notificationService.marquerLue(id).subscribe(() => this.notificationService.refresh());
    }
  }

  style(type: TypeNotification): string {
    return TYPE_STYLES[type] ?? 'bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-white/60';
  }
}