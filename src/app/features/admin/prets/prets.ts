import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap, startWith } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { DemandePretEnAttente, NiveauScore } from '../../../core/models/admin.model';

@Component({
  selector: 'app-prets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prets.html'
})
export class PretsComponent {
  private adminService = inject(AdminService);
  private confirmDialog = inject(ConfirmDialogService);

  private refresh$ = new Subject<void>();

  private demandesSource = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.adminService.getPretsEnAttente())
    ),
    { initialValue: [] as DemandePretEnAttente[] }
  );

  demandes = computed(() => this.demandesSource());

  processingId = signal<number | null>(null);
  errorMessage = signal('');

  async valider(demande: DemandePretEnAttente): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Valider cette demande ?',
      message: `Le compte du client #${demande.pret.clientId} sera immédiatement crédité de ${demande.pret.montant.toLocaleString('fr-FR')} FCFA.`,
      confirmLabel: 'Valider',
      danger: false
    });
    if (!confirmed) return;

    this.process(demande.pret.id, this.adminService.validerPret(demande.pret.id), 'valider');
  }

  async rejeter(demande: DemandePretEnAttente): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Rejeter cette demande ?',
      message: `La demande de prêt de ${demande.pret.montant.toLocaleString('fr-FR')} FCFA sera définitivement rejetée. Cette action est irréversible.`,
      confirmLabel: 'Rejeter',
      danger: true
    });
    if (!confirmed) return;

    this.process(demande.pret.id, this.adminService.rejeterPret(demande.pret.id), 'rejeter');
  }

  private process(id: number, request: ReturnType<AdminService['validerPret']>, action: 'valider' | 'rejeter'): void {
    this.processingId.set(id);
    this.errorMessage.set('');

    request.subscribe({
      next: () => {
        this.processingId.set(null);
        this.refresh$.next();
      },
      error: () => {
        this.processingId.set(null);
        this.errorMessage.set(`Impossible de ${action} cette demande.`);
      }
    });
  }

  scoreColor(score: NiveauScore): string {
    switch (score) {
      case 'EXCELLENT': return 'bg-green-500/10 text-green-600 dark:bg-green-400/20 dark:text-green-400';
      case 'BON': return 'bg-gold-500/10 text-gold-600 dark:bg-gold-500/20 dark:text-gold-400';
      case 'A_RISQUE': return 'bg-orange-500/10 text-orange-600 dark:bg-orange-400/20 dark:text-orange-400';
      case 'MAUVAIS_PAYEUR': return 'bg-coral/10 text-coral dark:bg-coral/20';
      default: return 'bg-ink/5 text-ink/60 dark:bg-white/10 dark:text-white/60';
    }
  }
}