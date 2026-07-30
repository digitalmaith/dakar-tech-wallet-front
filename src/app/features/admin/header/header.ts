import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html'
})
export class HeaderComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  themeService = inject(ThemeService);

  private titleSignal = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.leafTitle()),
      startWith(this.leafTitle())
    ),
    { initialValue: '' }
  );

  title = computed(() => this.titleSignal());

  private leafTitle(): string {
  let r = this.route.firstChild;
  while (r?.firstChild) r = r.firstChild;
  return r?.snapshot?.data?.['title'] ?? '';
}
}