import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/services/admin.service';
import { StatutPret } from '../../../core/models/admin.model';

const STATUT_LABELS: Record<StatutPret, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  EN_COURS: 'En cours',
  EN_RETARD: 'En retard',
  REJETE: 'Rejeté',
  SOLDE: 'Soldé'
};

const STATUT_COLORS: Record<StatutPret, string> = {
  EN_ATTENTE: 'bg-ink/20 dark:bg-white/20',
  VALIDE: 'bg-gold-500',
  EN_COURS: 'bg-gold-400',
  EN_RETARD: 'bg-coral',
  REJETE: 'bg-ink/10 dark:bg-white/10',
  SOLDE: 'bg-green-500 dark:bg-green-400'
};

const SCORE_COLORS: Record<string, string> = {
  EXCELLENT: 'bg-green-500 dark:bg-green-400',
  BON: 'bg-gold-500',
  A_RISQUE: 'bg-orange-500 dark:bg-orange-400',
  MAUVAIS_PAYEUR: 'bg-coral'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  private adminService = inject(AdminService);

  private data = toSignal(this.adminService.getDashboard(), { initialValue: null });
  dashboard = computed(() => this.data());

  // --- Répartition des prêts par statut ---
  maxRepartition = computed(() => {
    const d = this.dashboard();
    if (!d) return 1;
    return Math.max(1, ...Object.values(d.repartitionPretsParStatut));
  });

  repartitionEntries = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    return Object.entries(d.repartitionPretsParStatut) as [StatutPret, number][];
  });

  label(statut: StatutPret): string {
    return STATUT_LABELS[statut] ?? statut;
  }

  color(statut: StatutPret): string {
    return STATUT_COLORS[statut] ?? 'bg-ink/20 dark:bg-white/20';
  }

  // --- Répartition des scores de solvabilité ---
  maxScore = computed(() => {
    const d = this.dashboard();
    if (!d) return 1;
    const values = Object.values(d.repartitionScores);
    return Math.max(1, ...values);
  });

  scoreEntries = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    return Object.entries(d.repartitionScores);
  });

  totalUtilisateursNotes = computed(() => {
    return this.scoreEntries().reduce((sum, [, count]) => sum + count, 0);
  });

  scoreColor(score: string): string {
    return SCORE_COLORS[score] ?? 'bg-ink/20 dark:bg-white/20';
  }

  scorePercent(count: number): number {
    const total = this.totalUtilisateursNotes();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  // --- Taux de remboursement ---
  tauxRemboursement = computed(() => {
    const d = this.dashboard();
    if (!d || d.montantTotalPrete === 0) return 0;
    return Math.round((d.montantTotalRembourse / d.montantTotalPrete) * 100);
  });

  // --- Évolution mensuelle : mini graphique en barres ---
  maxVolumeEvolution = computed(() => {
    const d = this.dashboard();
    if (!d || d.evolutionMensuelle.length === 0) return 1;
    return Math.max(1, ...d.evolutionMensuelle.map(m => m.montantPrete));
  });

  evolutionBarHeight(montant: number): number {
    const max = this.maxVolumeEvolution();
    return max > 0 ? Math.max(4, Math.round((montant / max) * 100)) : 4;
  }



today = new Date();

  // Ajoutez ces méthodes pour le graphique
  getEvolutionPoints(): string {
    const evolution = this.dashboard()?.evolutionMensuelle;
    if (!evolution || evolution.length === 0) return '';
    const max = Math.max(...evolution.map(m => m.montantPrete), 1);
    return evolution.map((m, i) => {
      const x = (i / (evolution.length - 1)) * 780 + 20;
      const y = 200 - (m.montantPrete / max) * 180 - 10;
      return `${x},${y}`;
    }).join(' ');
  }

    getMaxEvolution(): number {
    const evolution = this.dashboard()?.evolutionMensuelle;
    return Math.max(...(evolution?.map(m => m.montantPrete) || [1]));
  }
}
