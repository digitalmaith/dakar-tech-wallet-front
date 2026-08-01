import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  ConnexionRequest,
  InscriptionRequest,
  MessageResponse,
  MotDePasseOublieRequest,
  ReinitialiserMotDePasseRequest,
  Utilisateur
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'dtw_token';
const USER_KEY = 'dtw_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  private readonly _currentUser = signal<Utilisateur | null>(this.restoreUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {
    window.addEventListener('storage', (event) => {
      if (event.key === USER_KEY && event.newValue) {
        try {
          this._currentUser.set(JSON.parse(event.newValue));
        } catch {
          // ignore un JSON malformé
        }
      }
      if (event.key === USER_KEY && event.newValue === null) {
        this._currentUser.set(null);
      }
    });
  }

  inscription(payload: InscriptionRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/inscription`, payload).pipe(
      tap(res => this.persistSession(res))
    );
  }

  connexion(payload: ConnexionRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/connexion`, payload).pipe(
      tap(res => this.persistSession(res))
    );
  }

  motDePasseOublie(payload: MotDePasseOublieRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/mot-de-passe-oublie`, payload);
  }

  reinitialiserMotDePasse(payload: ReinitialiserMotDePasseRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/reinitialiser-mot-de-passe`, payload);
  }

  renvoyerVerification(email: string): Observable<MessageResponse> {
    const params = new HttpParams().set('email', email);
    return this.http.post<MessageResponse>(`${this.apiUrl}/renvoyer-verification`, null, { params });
  }

  verifierEmail(token: string): Observable<MessageResponse> {
    const params = new HttpParams().set('token', token);
    return this.http.get<MessageResponse>(`${this.apiUrl}/verifier-email`, { params });
  }

  marquerEmailVerifie(): void {
    const utilisateur = this._currentUser();
    if (!utilisateur) return;
    const updated: Utilisateur = { ...utilisateur, emailVerifie: true };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this._currentUser.set(updated);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    const utilisateur: Utilisateur = {
      utilisateurId: res.utilisateurId,
      nom: res.nom,
      prenom: res.prenom,
      email: res.email,
      role: res.role,
      emailVerifie: res.emailVerifie
    };
    localStorage.setItem(USER_KEY, JSON.stringify(utilisateur));
    this._currentUser.set(utilisateur);
  }

  private restoreUser(): Utilisateur | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}