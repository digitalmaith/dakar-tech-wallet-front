import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardAdmin, DemandePretEnAttente, Pret, UtilisateurAdmin } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/admin`;

  getDashboard(): Observable<DashboardAdmin> {
    return this.http.get<DashboardAdmin>(`${this.apiUrl}/dashboard`);
  }

  getUtilisateurs(): Observable<UtilisateurAdmin[]> {
    return this.http.get<UtilisateurAdmin[]>(`${this.apiUrl}/utilisateurs`);
  }

  suspendreUtilisateur(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/utilisateurs/${id}/suspendre`, {});
  }

  getPretsEnAttente(): Observable<DemandePretEnAttente[]> {
    return this.http.get<DemandePretEnAttente[]>(`${this.apiUrl}/prets/en-attente`);
  }

  validerPret(id: number): Observable<Pret> {
    return this.http.patch<Pret>(`${this.apiUrl}/prets/${id}/valider`, {});
  }

  rejeterPret(id: number): Observable<Pret> {
    return this.http.patch<Pret>(`${this.apiUrl}/prets/${id}/rejeter`, {});
  }

  reactiverUtilisateur(id: number): Observable<void> {
  return this.http.patch<void>(`${this.apiUrl}/utilisateurs/${id}/reactiver`, {});
}
}