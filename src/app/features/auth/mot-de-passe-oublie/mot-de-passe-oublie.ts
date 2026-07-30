import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './mot-de-passe-oublie.html'
})
export class MotDePasseOublieComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = signal(false);
  // Un seul message générique, envoyé ou non — le backend renvoie déjà
  // volontairement le même texte que l'email existe ou pas (protection
  // contre l'énumération de comptes). On respecte ce choix côté front.
  submitted = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);

    this.authService.motDePasseOublie(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        // Même en cas d'erreur réseau, on ne révèle rien de spécifique -
        // on affiche le même état "envoyé" pour rester cohérent avec la
        // logique anti-énumération du backend.
        this.loading.set(false);
        this.submitted.set(true);
      }
    });
  }
}