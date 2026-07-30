import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap, startWith } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { NiveauScore, UtilisateurAdmin } from '../../../core/models/admin.model';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './utilisateurs.html'
})
export class UtilisateursComponent {
  private adminService = inject(AdminService);
  private confirmDialog = inject(ConfirmDialogService);

  private refresh$ = new Subject<void>();

  private utilisateursSource = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.adminService.getUtilisateurs())
    ),
    { initialValue: [] as UtilisateurAdmin[] }
  );

  utilisateurs = computed(() => this.utilisateursSource());

  processingId = signal<number | null>(null);
  errorMessage = signal<string | null>(null); // Changé pour accepter null

  async toggleStatut(utilisateur: UtilisateurAdmin): Promise<void> {
    const suspending = utilisateur.statutCompte === 'ACTIF';
    const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;

    const confirmed = await this.confirmDialog.confirm({
      title: suspending ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?',
      message: suspending
        ? `${nomComplet} ne pourra plus se connecter ni effectuer de transactions tant que le compte est suspendu.`
        : `${nomComplet} retrouvera l'accès à son compte et pourra à nouveau se connecter.`,
      confirmLabel: suspending ? 'Suspendre' : 'Réactiver',
      danger: suspending
    });

    if (!confirmed) return;

    this.processingId.set(utilisateur.id);
    this.errorMessage.set(null); // Correction : null au lieu de ''

    const request = suspending
      ? this.adminService.suspendreUtilisateur(utilisateur.id)
      : this.adminService.reactiverUtilisateur(utilisateur.id);

    request.subscribe({
      next: () => {
        this.processingId.set(null);
        this.refresh$.next();
      },
      error: (error) => {
        this.processingId.set(null);
        this.errorMessage.set(error?.message || `Impossible de ${suspending ? 'suspendre' : 'réactiver'} ${nomComplet}.`);
      }
    });
  }

  // Méthode pour la couleur du texte du score
  scoreColor(score: NiveauScore): string {
    switch (score) {
      case 'EXCELLENT': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/20';
      case 'BON': return 'text-gold-600 dark:text-gold-400 bg-gold-500/10 dark:bg-gold-500/20';
      case 'A_RISQUE': return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-400/20';
      case 'MAUVAIS_PAYEUR': return 'text-coral dark:text-coral bg-coral/10 dark:bg-coral/20';
      default: return 'text-ink/60 dark:text-white/60 bg-ink/5 dark:bg-white/10';
    }
  }

  // Nouvelle méthode pour la couleur de la barre de score
  scoreBarColor(score: NiveauScore): string {
    switch (score) {
      case 'EXCELLENT': return 'bg-emerald-500';
      case 'BON': return 'bg-gold-500';
      case 'A_RISQUE': return 'bg-orange-500';
      case 'MAUVAIS_PAYEUR': return 'bg-coral';
      default: return 'bg-ink/30';
    }
  }

  // Méthode pour le pourcentage du score (pour la barre de progression)
  scorePourcentage(score: NiveauScore): number {
    switch (score) {
      case 'EXCELLENT': return 100;
      case 'BON': return 75;
      case 'A_RISQUE': return 50;
      case 'MAUVAIS_PAYEUR': return 25;
      default: return 0;
    }
  }

  // Méthode pour le libellé du score en français
  scoreLabel(score: NiveauScore): string {
    switch (score) {
      case 'EXCELLENT': return 'Excellent';
      case 'BON': return 'Bon';
      case 'A_RISQUE': return 'À risque';
      case 'MAUVAIS_PAYEUR': return 'Mauvais payeur';
      default: return 'Non évalué';
    }
  }
}