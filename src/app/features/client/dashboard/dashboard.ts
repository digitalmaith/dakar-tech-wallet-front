import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { AuthService } from '../../../core/services/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { Transaction, TypeTransaction } from '../../../core/models/client.model';

const TYPE_LABELS: Record<string, string> = {
  VIREMENT_ENVOYE: 'Virement envoyé',
  VIREMENT_RECU: 'Virement reçu',
  PRET_CREDITE: 'Prêt crédité',
  REMBOURSEMENT: 'Remboursement'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  authService = inject(AuthService);
  walletService = inject(WalletService);

  selectedTransaction = signal<Transaction | null>(null);

  // QR affiché directement sur la carte solde — généré une seule fois
  // au chargement du dashboard, indépendamment de la page /client/qr.
  qrDataUrl = signal<string | null>(null);

  constructor() {
    this.walletService.getQrCode().subscribe(async (res) => {
      this.qrDataUrl.set(await QRCode.toDataURL(res.payload, { width: 200, margin: 1 }));
    });
  }

  transactionsTrieees = computed(() =>
    [...this.walletService.transactions()].sort(
      (a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime()
    )
  );

  label(type: TypeTransaction): string {
    return TYPE_LABELS[type] ?? type;
  }

  isEntree(type: TypeTransaction): boolean {
    return type === 'VIREMENT_RECU' || type === 'PRET_CREDITE';
  }

  openDetail(transaction: Transaction): void {
    this.selectedTransaction.set(transaction);
  }

  closeDetail(): void {
    this.selectedTransaction.set(null);
  }
}