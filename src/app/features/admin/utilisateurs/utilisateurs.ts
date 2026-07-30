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
  errorMessage = signal('');

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
    this.errorMessage.set('');

    const request = suspending
      ? this.adminService.suspendreUtilisateur(utilisateur.id)
      : this.adminService.reactiverUtilisateur(utilisateur.id);

    request.subscribe({
      next: () => {
        this.processingId.set(null);
        this.refresh$.next();
      },
      error: () => {
        this.processingId.set(null);
        this.errorMessage.set(`Impossible de ${suspending ? 'suspendre' : 'réactiver'} ${nomComplet}.`);
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