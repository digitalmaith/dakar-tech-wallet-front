import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function checkAuth(): boolean | ReturnType<Router['navigate']> {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && !authService.isTokenExpired()) {
    return true;
  }
  router.navigate(['/auth']);
  return false;
}

export const authGuard: CanActivateFn = () => checkAuth() as boolean;
export const authGuardChild: CanActivateChildFn = () => checkAuth() as boolean;