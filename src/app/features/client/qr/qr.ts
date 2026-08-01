import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { WalletService } from '../../../core/services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { QrValidationResponse } from '../../../core/models/qr.model';

type Onglet = 'recevoir' | 'payer';

const SCANNER_ELEMENT_ID = 'qr-scanner-zone';

@Component({
  selector: 'app-qr',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './qr.html'
})
export class QrComponent implements OnDestroy {
  private walletService = inject(WalletService);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  onglet = signal<Onglet>('recevoir');
  utilisateur = this.authService.currentUser;
  solde = this.walletService.solde;

  qrDataUrl = signal<string | null>(null);
  qrLoading = signal(false);

  async ouvrirRecevoir(): Promise<void> {
    this.onglet.set('recevoir');
    if (this.qrDataUrl()) return;

    this.qrLoading.set(true);
    this.walletService.getQrCode().subscribe({
      next: async (res) => {
        this.qrDataUrl.set(await QRCode.toDataURL(res.payload, { width: 260, margin: 1 }));
        this.qrLoading.set(false);
      },
      error: () => {
        this.qrLoading.set(false);
        this.toast.error('Impossible de générer le QR code.');
      }
    });
  }

  // --- Payer : scan caméra (inchangé) ---
  scannerActif = signal(false);
  scanning = signal(false);
  resultat = signal<QrValidationResponse | null>(null);
  montantSaisi = signal<number | null>(null);
  descriptionSaisie = signal('');
  loadingVirement = signal(false);
  scannerErreur = signal('');

  private html5Qrcode: Html5Qrcode | null = null;

  async ouvrirPayer(): Promise<void> {
    this.onglet.set('payer');
    this.resultat.set(null);
    this.scannerErreur.set('');
    await this.demarrerScanner();
  }

  private async demarrerScanner(): Promise<void> {
    this.scannerActif.set(true);
    this.scanning.set(true);
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      this.html5Qrcode = new Html5Qrcode(SCANNER_ELEMENT_ID);
      await this.html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => this.onScanSuccess(decodedText),
        () => {}
      );
    } catch {
      this.scanning.set(false);
      this.scannerErreur.set('Impossible d\'accéder à la caméra. Vérifiez les autorisations de votre navigateur.');
    }
  }

  private async arreterScanner(): Promise<void> {
    if (this.html5Qrcode && this.scanning()) {
      try {
        await this.html5Qrcode.stop();
        this.html5Qrcode.clear();
      } catch {}
    }
    this.scanning.set(false);
    this.html5Qrcode = null;
  }

  private async onScanSuccess(payload: string): Promise<void> {
    await this.arreterScanner();

    this.walletService.validerQrCode(payload).subscribe({
      next: (res) => {
        this.resultat.set(res);
        this.montantSaisi.set(res.montant);
        this.descriptionSaisie.set(res.description ?? '');
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err, 'QR code invalide ou illisible.'));
        this.demarrerScanner();
      }
    });
  }

  rescanner(): void {
    this.resultat.set(null);
    this.demarrerScanner();
  }

  async confirmerPaiement(): Promise<void> {
    const res = this.resultat();
    const montant = this.montantSaisi();
    if (!res || !montant || montant <= 0) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Confirmer le paiement ?',
      message: `Envoyer ${montant} FCFA à ${res.nomComplet} (${res.numeroCompte}) ?`,
      confirmLabel: 'Payer',
      danger: false
    });
    if (!confirmed) return;

    this.loadingVirement.set(true);

    this.walletService.effectuerVirement({
      numeroCompteBeneficiaire: res.numeroCompte,
      montant,
      description: this.descriptionSaisie() || 'Paiement par QR code'
    }).subscribe({
      next: () => {
        this.loadingVirement.set(false);
        this.toast.success(`Paiement de ${montant} FCFA envoyé à ${res.nomComplet}.`);
        this.walletService.refresh();
        this.resultat.set(null);
        this.onglet.set('recevoir');
      },
      error: (err) => {
        this.loadingVirement.set(false);
        this.toast.error(extractErrorMessage(err));
      }
    });
  }

  async changerOnglet(onglet: Onglet): Promise<void> {
    if (this.onglet() === onglet) return;
    if (this.onglet() === 'payer') await this.arreterScanner();

    if (onglet === 'recevoir') {
      await this.ouvrirRecevoir();
    } else {
      await this.ouvrirPayer();
    }
  }

  ngOnDestroy(): void {
    this.arreterScanner();
  }
}