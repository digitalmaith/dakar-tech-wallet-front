import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/http-error.util';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('nouveauMotDePasse')?.value;
  const confirm = group.get('confirmation')?.value;
  return pass === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './reinitialiser-mot-de-passe.html'
})
export class ReinitialiserMotDePasseComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  success = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirmation = signal(false);

  // Lu une seule fois au chargement du composant — le token vit dans
  // l'URL, pas dans le formulaire (l'utilisateur ne le saisit jamais).
  private token = this.route.snapshot.queryParamMap.get('token');
  tokenManquant = !this.token;

  form = this.fb.nonNullable.group({
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
    confirmation: ['', Validators.required]
  }, { validators: passwordsMatchValidator });

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmation(): void {
    this.showConfirmation.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.reinitialiserMotDePasse({
      token: this.token,
      nouveauMotDePasse: this.form.getRawValue().nouveauMotDePasse
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }
}