import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/http-error.util';

type Etat = 'chargement' | 'succes' | 'erreur' | 'token-manquant';

@Component({
  selector: 'app-verifier-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verifier-email.html'
})
export class VerifierEmailComponent {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  etat = signal<Etat>('chargement');
  errorMessage = signal('');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.etat.set('token-manquant');
      return;
    }

    this.authService.verifierEmail(token).subscribe({
  next: () => {
    this.authService.marquerEmailVerifie();
    this.etat.set('succes');
  },
  error: (err) => {
    this.etat.set('erreur');
    this.errorMessage.set(extractErrorMessage(err, 'Ce lien de vérification est invalide.'));
  }
});
  }

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }
}