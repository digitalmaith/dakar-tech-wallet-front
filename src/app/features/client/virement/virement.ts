import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { WalletService } from '../../../core/services/wallet.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { beneficiaireExisteValidator } from '../../../core/validators/beneficiaire.validator';
import { Beneficiaire } from '../../../core/models/client.model';
import { extractErrorMessage, isEmailNonVerifieError  } from '../../../core/utils/http-error.util';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

// Validation synchrone : interdit le virement si le montant dépasse le
// solde disponible (le backend revalide de toute façon côté serveur).
function soldeSuffisantValidator(walletService: WalletService): ValidatorFn {
  return (control): ValidationErrors | null => {
    const solde = walletService.solde()?.solde ?? 0;
    const montant = control.value;
    if (montant == null || montant === '') return null;
    return montant > solde ? { soldeInsuffisant: true } : null;
  };
}

@Component({
  selector: 'app-virement',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './virement.html'
})
export class VirementComponent {
  private fb = inject(FormBuilder);
  walletService = inject(WalletService);
  private confirmDialog = inject(ConfirmDialogService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  emailNonVerifie = signal(false);

  get userEmail(): string {
  return this.authService.currentUser()?.email ?? '';
}

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  form = this.fb.nonNullable.group({
    numeroCompteBeneficiaire: ['', {
      validators: [Validators.required],
      asyncValidators: [beneficiaireExisteValidator(this.walletService)],
      updateOn: 'change'
    }],
    montant: [null as number | null, [Validators.required, Validators.min(0.01), soldeSuffisantValidator(this.walletService)]],
    description: ['']
  });

  // Affichage du nom du bénéficiaire trouvé — pipeline parallèle au
  // validator asynchrone (celui-ci ne fait que valider, pas afficher).
  private beneficiaireSource = toSignal(
    this.form.controls.numeroCompteBeneficiaire.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(numero => {
        if (!numero?.trim()) return of(null);
        return this.walletService.getBeneficiaire(numero).pipe(
          catchError(() => of(null))
        );
      })
    ),
    { initialValue: null as Beneficiaire | null }
  );
  beneficiaire = computed(() => this.beneficiaireSource());

  async onSubmit(): Promise<void> {

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.emailNonVerifie.set(false);
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    const { numeroCompteBeneficiaire, montant, description } = this.form.getRawValue();
    const nomBeneficiaire = this.beneficiaire()?.nomComplet ?? numeroCompteBeneficiaire;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Confirmer le virement ?',
      message: `Vous êtes sur le point d'envoyer ${montant} FCFA à ${nomBeneficiaire} (${numeroCompteBeneficiaire}).`,
      confirmLabel: 'Envoyer',
      danger: false
    });
    if (!confirmed) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.walletService.effectuerVirement({
      numeroCompteBeneficiaire,
      montant: montant!,
      description: description || ''
    }).subscribe({
     next: () => {
        this.loading.set(false);
        this.toast.success(`Virement de ${montant} FCFA envoyé avec succès.`);
        this.form.reset({ numeroCompteBeneficiaire: '', montant: null, description: '' });
        this.walletService.refresh();
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(extractErrorMessage(err));
      }
    });
  }
}