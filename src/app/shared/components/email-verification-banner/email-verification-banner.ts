import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-email-verification-banner',
  standalone: true,
  templateUrl: './email-verification-banner.html'
})
export class EmailVerificationBannerComponent {
  private authService = inject(AuthService);

  visible = signal(true);
  sending = signal(false);
  sent = signal(false);

  // La bannière lit directement l'utilisateur connecté — plus besoin
  // qu'un parent lui passe l'email en @Input, elle est autonome.
  shouldShow = computed(() =>
    this.visible() && this.authService.currentUser()?.emailVerifie === false
  );

  email = computed(() => this.authService.currentUser()?.email ?? '');

  renvoyer(): void {
    this.sending.set(true);
    this.authService.renvoyerVerification(this.email()).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
      },
      error: () => this.sending.set(false)
    });
  }

  close(): void {
    this.visible.set(false);
  }

  rafraichir(): void {
  window.location.reload();
}
}