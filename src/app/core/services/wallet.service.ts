import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, startWith, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Beneficiaire, DemandePretRequest, RemboursementRequest, Solde, Transaction, VirementRequest } from '../models/client.model';
import { Pret } from '../models/admin.model';
import { PretClient } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/client`;

  private refresh$ = new Subject<void>();

  private soldeSignal = signal<Solde | null>(null);
  solde = computed(() => this.soldeSignal());

  private transactionsSignal = signal<Transaction[]>([]);
  transactions = computed(() => this.transactionsSignal());

  constructor() {
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.getSolde())
    ).subscribe(solde => this.soldeSignal.set(solde));

    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.getTransactions())
    ).subscribe(transactions => this.transactionsSignal.set(transactions));
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

  getBeneficiaire(numeroCompte: string): Observable<Beneficiaire> {
    return this.http.get<Beneficiaire>(`${this.apiUrl}/beneficiaire/${numeroCompte}`);
  }

  effectuerVirement(payload: VirementRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/virements`, payload);
  }

  demanderPret(payload: DemandePretRequest): Observable<Pret> {
    return this.http.post<Pret>(`${this.apiUrl}/prets`, payload);
  }

  getPrets(): Observable<PretClient[]> {
  return this.http.get<PretClient[]>(`${this.apiUrl}/prets`);
}

  rembourser(pretId: number, payload: RemboursementRequest): Observable<Pret> {
    return this.http.post<Pret>(`${this.apiUrl}/prets/${pretId}/remboursements`, payload);
  }
}