import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function checkAdmin(): boolean {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) return true;
  router.navigate(['/client/dashboard']);
  return false;
}

export const adminGuard: CanActivateFn = () => checkAdmin();
export const adminGuardChild: CanActivateChildFn = () => checkAdmin();