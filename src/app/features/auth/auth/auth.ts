import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/auth.model';

type Mode = 'connexion' | 'inscription';
type Step = 1 | 2 | 3;

const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  CLIENT: '/client/dashboard'
};

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('motDePasse')?.value;
  const confirm = group.get('confirmation')?.value;
  return pass === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  mode = signal<Mode>('connexion');
  loading = signal(false);
  errorMessage = signal('');
  step = signal<Step>(1);

  // Visibilité des mots de passe
  showPasswordConnexion = signal(false);
  showPasswordInscription = signal(false);
  showConfirmation = signal(false);

  togglePasswordConnexion(): void {
    this.showPasswordConnexion.update(v => !v);
  }

  togglePasswordInscription(): void {
    this.showPasswordInscription.update(v => !v);
  }

  toggleConfirmation(): void {
    this.showConfirmation.update(v => !v);
  }

  // Descriptions des étapes
  stepDescriptions(): { [key: number]: string } {
    return {
      1: 'Informations personnelles',
      2: 'Email de connexion',
      3: 'Sécurité'
    };
  }

  trackTransform = computed(() =>
    this.mode() === 'connexion' ? 'translateX(0%)' : 'translateX(-50%)'
  );
  pillTransform = computed(() =>
    this.mode() === 'connexion' ? 'translateX(0%)' : 'translateX(100%)'
  );

  // Formulaires
  connexionForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]]
  });

  inscriptionForm = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]],
    confirmation: ['', Validators.required]
  }, { validators: passwordsMatchValidator });

  // --- Pont RxJS -> Signals -------------------------------------------
  // Les FormGroup/FormControl "classiques" ne sont pas des signaux.
  // Sans ce pont, les computed() ci-dessous ne se recalculent jamais
  // quand l'utilisateur tape, et canProceed() reste figé sur sa valeur
  // initiale (donc le bouton "Suivant" reste désactivé).
  private inscriptionFormStatus = toSignal(this.inscriptionForm.statusChanges, {
    initialValue: this.inscriptionForm.status
  });
  private inscriptionFormValue = toSignal(this.inscriptionForm.valueChanges, {
    initialValue: this.inscriptionForm.getRawValue()
  });
  // ----------------------------------------------------------------------

  // Vérification de la force du mot de passe
  passwordStrength = computed(() => {
    const password = this.inscriptionFormValue().motDePasse || '';
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 3);
  });

  // Vérification si on peut passer à l'étape suivante
  canProceed = computed(() => {
    // Lire ces signaux ici force le recalcul à chaque frappe / changement de statut
    this.inscriptionFormStatus();
    this.inscriptionFormValue();

    const form = this.inscriptionForm;

    switch (this.step()) {
      case 1: {
        const nomValid = form.get('nom')?.valid ?? false;
        const prenomValid = form.get('prenom')?.valid ?? false;
        return nomValid && prenomValid;
      }
      case 2: {
        const emailValid = form.get('email')?.valid ?? false;
        return emailValid;
      }
      case 3: {
        const motDePasseValid = form.get('motDePasse')?.valid ?? false;
        const confirmationValid = form.get('confirmation')?.valid ?? false;
        const passwordsMatch = !form.errors?.['passwordsMismatch'];
        return motDePasseValid && confirmationValid && passwordsMatch;
      }
      default:
        return false;
    }
  });

  // Méthode pour obtenir la description de l'étape
  getStepDescription(step: Step): string {
    const descriptions = this.stepDescriptions();
    return descriptions[step] || '';
  }

  setMode(next: Mode): void {
    if (this.mode() === next) return;
    this.errorMessage.set('');
    this.mode.set(next);
    if (next === 'inscription') {
      this.step.set(1);
    }
  }

  // Navigation entre les étapes
  nextStep(): void {
    if (this.step() < 3 && this.canProceed()) {
      this.step.set((this.step() + 1) as Step);
    } else {
      // Si on ne peut pas avancer, on force l'affichage des erreurs
      // des champs de l'étape courante (utile si l'utilisateur clique
      // sans avoir "touché" les champs, ex: tab + retour arrière).
      this.markStepAsTouched(this.step());
    }
  }

  prevStep(): void {
    if (this.step() > 1) {
      this.step.set((this.step() - 1) as Step);
    }
  }

  private markStepAsTouched(step: Step): void {
    const form = this.inscriptionForm;
    const fieldsByStep: Record<Step, string[]> = {
      1: ['nom', 'prenom'],
      2: ['email'],
      3: ['motDePasse', 'confirmation']
    };
    fieldsByStep[step].forEach(field => form.get(field)?.markAsTouched());
  }

  // Redirection centralisée par rôle — un seul endroit à modifier
  // si un jour un 3e rôle apparaît (ex: GESTIONNAIRE).
  private redirectByRole(role: Role): void {
    const target = ROLE_HOME[role] ?? '/client/dashboard';
    this.router.navigateByUrl(target);
  }

  submitConnexion(): void {
    if (this.connexionForm.invalid) {
      this.connexionForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.connexion(this.connexionForm.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectByRole(res.role);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 401 ? 'Email ou mot de passe incorrect.' : 'Une erreur est survenue. Réessayez.'
        );
      }
    });
  }

  submitInscription(): void {
    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');

    const { confirmation, ...payload } = this.inscriptionForm.getRawValue();

    this.authService.inscription(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectByRole(res.role);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 409 ? 'Cet email est déjà utilisé.' : 'Une erreur est survenue. Réessayez.'
        );
      }
    });
  }
}