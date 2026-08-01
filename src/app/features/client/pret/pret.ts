import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, startWith, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { WalletService } from '../../../core/services/wallet.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { PretClient, StatutPret } from '../../../core/models/client.model';
import { RouterLink } from '@angular/router';
import { extractErrorMessage } from '../../../core/utils/http-error.util';

type Vue = 'liste' | 'formulaire';
type Filtre = StatutPret | 'TOUS';

const STATUT_LABELS: Record<StatutPret, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  EN_COURS: 'En cours',
  EN_RETARD: 'En retard',
  REJETE: 'Rejeté',
  SOLDE: 'Soldé'
};

const STATUT_STYLES: Record<StatutPret, string> = {
  EN_ATTENTE: 'bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-white/60',
  VALIDE: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
  EN_COURS: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',
  EN_RETARD: 'bg-coral/10 text-coral',
  REJETE: 'bg-coral/10 text-coral',
  SOLDE: 'bg-green-500/10 text-green-600 dark:text-green-400'
};

@Component({
  selector: 'app-pret',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './pret.html'
})
export class PretComponent {
  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);
  private confirmDialog = inject(ConfirmDialogService);

  // --- Navigation liste / formulaire ---
  vue = signal<Vue>('liste');

  goToFormulaire(): void {
    this.vue.set('formulaire');
  }

  goToListe(): void {
    this.vue.set('liste');
    this.form.reset({ montant: null, motif: '', dureeMois: null });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  // --- Liste des prêts ---
  private refresh$ = new Subject<void>();
  private pretsSignal = signal<PretClient[]>([]);

  filtre = signal<Filtre>('EN_COURS');

  constructor() {
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.walletService.getPrets())
    ).subscribe(prets => this.pretsSignal.set(prets));
  }

  pretsFiltres = computed(() => {
    const f = this.filtre();
    const prets = this.pretsSignal();
    return f === 'TOUS' ? prets : prets.filter(p => p.statut === f);
  });

  // Onglets affichés uniquement pour les statuts réellement présents,
  // pour éviter des filtres vides qui n'apportent rien à l'utilisateur.
  filtresDisponibles = computed(() => {
    const statuts = new Set(this.pretsSignal().map(p => p.statut));
    return Array.from(statuts) as StatutPret[];
  });

  label(statut: StatutPret): string {
    return STATUT_LABELS[statut] ?? statut;
  }

  style(statut: StatutPret): string {
    return STATUT_STYLES[statut] ?? 'bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-white/60';
  }

  prochaineEcheance(pret: PretClient) {
    return pret.echeances.find(e => e.statut === 'EN_ATTENTE' || e.statut === 'EN_RETARD') ?? null;
  }

  // --- Formulaire de demande ---
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
        this.refresh$.next();
        this.filtre.set('EN_ATTENTE');
        setTimeout(() => this.goToListe(), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(extractErrorMessage(err));
      }
    });
  }
}