import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  authService = inject(AuthService);
}