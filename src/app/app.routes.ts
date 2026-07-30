import { Routes } from '@angular/router';
import { authGuard, authGuardChild } from './core/guards/auth.guard';
import { adminGuard, adminGuardChild } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth/auth').then(m => m.AuthComponent)
  },
  {
    path: 'client/dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/client/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    canActivateChild: [authGuardChild, adminGuardChild],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { title: 'Tableau de bord' },
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'utilisateurs',
        data: { title: 'Utilisateurs' },
        loadComponent: () => import('./features/admin/utilisateurs/utilisateurs').then(m => m.UtilisateursComponent)
      },
      {
        path: 'prets',
        data: { title: 'Demandes de prêt' },
        loadComponent: () => import('./features/admin/prets/prets').then(m => m.PretsComponent)
      }
    ]
  },
  { path: 'connexion', redirectTo: 'auth' },
  { path: 'inscription', redirectTo: 'auth' },
  { path: '**', redirectTo: 'auth' }
];