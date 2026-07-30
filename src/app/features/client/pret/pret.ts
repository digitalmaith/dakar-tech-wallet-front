import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-pret',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './pret.html'
})
export class PretComponent {
  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);
  private confirmDialog = inject(ConfirmDialogService);

  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  form = this.fb.nonNullable.group({
    montant: [null as number | null, [Validators.required, Validators.min(1)]],
    motif: ['', Validators.required],
    dureeMois: [null as number | null, [Validators.required, Validators.min(1), Validators.max(60)]]
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { montant, motif, dureeMois } = this.form.getRawValue();

    const confirmed = await this.confirmDialog.confirm({
      title: 'Confirmer la demande de prêt ?',
      message: `Vous demandez ${montant} FCFA sur ${dureeMois} mois pour : "${motif}". Un administrateur devra valider votre demande.`,
      confirmLabel: 'Envoyer la demande',
      danger: false
    });
    if (!confirmed) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.walletService.demanderPret({ montant: montant!, motif, dureeMois: dureeMois! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Votre demande de prêt a été soumise et est en attente de validation.');
        this.form.reset({ montant: null, motif: '', dureeMois: null });
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Une erreur est survenue lors de la soumission de la demande.');
      }
    });
  }
}