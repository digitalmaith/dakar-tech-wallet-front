import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  authService = inject(AuthService);
  sidebarService = inject(SidebarService);

  // Clic n'importe où dans la sidebar repliée -> réouverture.
  // Ne fait rien si déjà ouverte (évite de gêner la navigation normale).
  onSidebarClick(): void {
    this.sidebarService.expand();
  }

  // Empêche le clic sur le bouton toggle de déclencher aussi onSidebarClick
  // (sinon: replié + clic bouton -> expand() par le conteneur, puis toggle()
  // referme aussitôt -> la sidebar ne bougerait jamais visuellement).
  onToggleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.sidebarService.toggle();
  }
}