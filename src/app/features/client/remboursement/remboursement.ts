import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, startWith, switchMap, merge,interval } from 'rxjs';
import { WalletService } from '../../../core/services/wallet.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { PretClient, StatutPret } from '../../../core/models/client.model';

const STATUT_LABELS: Record<StatutPret, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  EN_COURS: 'En cours',
  EN_RETARD: 'En retard',
  REJETE: 'Rejeté',
  SOLDE: 'Soldé'
};

@Component({
  selector: 'app-remboursement',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './remboursement.html'
})
export class RemboursementComponent {
  private walletService = inject(WalletService);
  private confirmDialog = inject(ConfirmDialogService);

  private refresh$ = new Subject<void>();
  private pretsSignal = signal<PretClient[]>([]);

  processingId = signal<number | null>(null);
  successMessage = signal('');
  errorMessage = signal('');

  constructor() {
  const trigger$ = merge(this.refresh$, interval(15000)).pipe(startWith(undefined));
  trigger$.pipe(switchMap(() => this.walletService.getPrets())).subscribe(prets => this.pretsSignal.set(prets));
}

  // Seuls les prêts avec du capital restant à rembourser sont montrés ici
  // — les autres statuts (en attente, rejeté, soldé) n'ont pas leur place
  // sur une page dédiée au remboursement.
  pretsRemboursables = computed(() =>
    this.pretsSignal().filter(p => p.statut === 'EN_COURS' || p.statut === 'EN_RETARD')
  );

  label(statut: StatutPret): string {
    return STATUT_LABELS[statut] ?? statut;
  }

  prochaineEcheance(pret: PretClient) {
    return pret.echeances.find(e => e.statut === 'EN_ATTENTE' || e.statut === 'EN_RETARD') ?? null;
  }

  async rembourserMensualite(pret: PretClient): Promise<void> {
    const echeance = this.prochaineEcheance(pret);
    if (!echeance) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Payer cette mensualité ?',
      message: `${echeance.montant} FCFA seront débités de votre solde pour l'échéance n°${echeance.numero}.`,
      confirmLabel: 'Payer',
      danger: false
    });
    if (!confirmed) return;

    this.executerRemboursement(pret.id, 'MENSUALITE');
  }

  async rembourserTotal(pret: PretClient): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Solder ce prêt ?',
      message: `${pret.capitalRestant} FCFA (capital restant intégral) seront débités de votre solde. Le prêt sera entièrement soldé.`,
      confirmLabel: 'Solder maintenant',
      danger: false
    });
    if (!confirmed) return;

    this.executerRemboursement(pret.id, 'TOTAL');
  }

  private executerRemboursement(pretId: number, type: 'MENSUALITE' | 'TOTAL'): void {
    this.processingId.set(pretId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.walletService.rembourser(pretId, { type }).subscribe({
      next: () => {
        this.processingId.set(null);
        this.successMessage.set(
          type === 'TOTAL' ? 'Prêt soldé avec succès.' : 'Mensualité payée avec succès.'
        );
        this.refresh$.next();
        this.walletService.refresh(); // solde + historique impactés aussi
      },
      error: (err) => {
        this.processingId.set(null);
        this.errorMessage.set(extractErrorMessage(err));
      }
    });
  }
}