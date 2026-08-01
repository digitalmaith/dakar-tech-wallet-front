import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { EmailVerificationBannerComponent } from '../../../shared/components/email-verification-banner/email-verification-banner';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EmailVerificationBannerComponent],
  templateUrl: './layout.html'
})
export class ClientLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
}