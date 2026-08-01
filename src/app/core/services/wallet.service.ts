import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, merge, startWith, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Beneficiaire, DemandePretRequest, PretClient, RemboursementRequest, Solde, Transaction, VirementRequest } from '../models/client.model';
import { Pret } from '../models/admin.model';
import { QrCodeResponse, QrValidationRequest, QrValidationResponse } from '../models/qr.model';


const POLL_INTERVAL_MS = 15000; // 15s — assez réactif sans matraquer le backend

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/client`;

  // .next() sur refresh$ force un rechargement immédiat (ex: après une
  // action de l'utilisateur). L'interval() en arrière-plan couvre les
  // changements déclenchés ailleurs (un admin qui valide un prêt, un
  // virement reçu d'un autre client) sans que l'utilisateur ait besoin
  // de recharger la page manuellement.
  private refresh$ = new Subject<void>();
  private tick$ = interval(POLL_INTERVAL_MS);

  private soldeSignal = signal<Solde | null>(null);
  solde = computed(() => this.soldeSignal());

  private transactionsSignal = signal<Transaction[]>([]);
  transactions = computed(() => this.transactionsSignal());

  constructor() {
    const trigger$ = merge(this.refresh$, this.tick$).pipe(startWith(undefined));

    trigger$.pipe(switchMap(() => this.getSolde())).subscribe(solde => this.soldeSignal.set(solde));
    trigger$.pipe(switchMap(() => this.getTransactions())).subscribe(transactions => this.transactionsSignal.set(transactions));
  }

  refresh(): void {
    this.refresh$.next();
  }

  getSolde(): Observable<Solde> {
    return this.http.get<Solde>(`${this.apiUrl}/solde`);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`);
  }

  getPrets(): Observable<PretClient[]> {
    return this.http.get<PretClient[]>(`${this.apiUrl}/prets`);
  }

  getBeneficiaire(numeroCompte: string): Observable<Beneficiaire> {
    return this.http.get<Beneficiaire>(`${this.apiUrl}/beneficiaire/${numeroCompte}`);
  }

  effectuerVirement(payload: VirementRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/virements`, payload);
  }

  demanderPret(payload: DemandePretRequest): Observable<Pret> {
    return this.http.post<Pret>(`${this.apiUrl}/prets`, payload);
  }

  rembourser(pretId: number, payload: RemboursementRequest): Observable<Pret> {
    return this.http.post<Pret>(`${this.apiUrl}/prets/${pretId}/remboursements`, payload);
  }

  getQrCode(): Observable<QrCodeResponse> {
  return this.http.get<QrCodeResponse>(`${this.apiUrl}/qr-code`);
}

validerQrCode(payload: string): Observable<QrValidationResponse> {
  const body: QrValidationRequest = { payload };
  return this.http.post<QrValidationResponse>(`${this.apiUrl}/qr-code/valider`, body);
}
}