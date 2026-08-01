import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, forkJoin, interval, merge, of, startWith, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NombreNonLues, NotificationClient } from '../models/notification.model';

const POLL_INTERVAL_MS = 15000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/client/notifications`;

  private refresh$ = new Subject<void>();

  private notificationsSignal = signal<NotificationClient[]>([]);
  notifications = computed(() => this.notificationsSignal());

  private nombreNonLuesSignal = signal<number>(0);
  nombreNonLues = computed(() => this.nombreNonLuesSignal());

  constructor() {
    const trigger$ = merge(this.refresh$, interval(POLL_INTERVAL_MS)).pipe(startWith(undefined));

    trigger$.pipe(switchMap(() => this.getNotifications())).subscribe(list => this.notificationsSignal.set(list));
    trigger$.pipe(switchMap(() => this.getNombreNonLues())).subscribe(res => this.nombreNonLuesSignal.set(res.nombre));
  }

  refresh(): void {
    this.refresh$.next();
  }

  getNotifications(): Observable<NotificationClient[]> {
    return this.http.get<NotificationClient[]>(this.apiUrl);
  }

  getNombreNonLues(): Observable<NombreNonLues> {
    return this.http.get<NombreNonLues>(`${this.apiUrl}/non-lues/nombre`);
  }

  marquerLue(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/lue`, {});
  }

  // Pas d'endpoint bulk connu — on marque chaque notification non lue
  // individuellement puis on rafraîchit une seule fois à la fin.
  marquerToutLu(): void {
    const nonLues = this.notificationsSignal().filter(n => !n.lue);
    if (nonLues.length === 0) return;

    const requests = nonLues.map(n => this.marquerLue(n.id));
    forkJoin(requests).subscribe(() => this.refresh());
  }
}