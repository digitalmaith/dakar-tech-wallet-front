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
  path: 'auth/mot-de-passe-oublie',
  loadComponent: () => import('./features/auth/mot-de-passe-oublie/mot-de-passe-oublie').then(m => m.MotDePasseOublieComponent)
    },
    {
      path: 'reinitialiser-mot-de-passe',
      loadComponent: () => import('./features/auth/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe').then(m => m.ReinitialiserMotDePasseComponent)
    },
    {
  path: 'verifier-email',
  loadComponent: () => import('./features/auth/verifier-email/verifier-email').then(m => m.VerifierEmailComponent)
},
  {
    path: 'client',
    canActivate: [authGuard],
    canActivateChild: [authGuardChild],
    loadComponent: () => import('./features/client/layout/layout').then(m => m.ClientLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/client/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'virement', loadComponent: () => import('./features/client/virement/virement').then(m => m.VirementComponent) },
      { path: 'pret', loadComponent: () => import('./features/client/pret/pret').then(m => m.PretComponent) },
      { path: 'remboursement', loadComponent: () => import('./features/client/remboursement/remboursement').then(m => m.RemboursementComponent) },
      { path: 'qr', loadComponent: () => import('./features/client/qr/qr').then(m => m.QrComponent) },

    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    canActivateChild: [authGuardChild, adminGuardChild],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', data: { title: 'Tableau de bord' }, loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'utilisateurs', data: { title: 'Utilisateurs' }, loadComponent: () => import('./features/admin/utilisateurs/utilisateurs').then(m => m.UtilisateursComponent) },
      { path: 'prets', data: { title: 'Demandes de prêt' }, loadComponent: () => import('./features/admin/prets/prets').then(m => m.PretsComponent) }
    ]
  },
  { path: 'connexion', redirectTo: 'auth' },
  { path: 'inscription', redirectTo: 'auth' },
  { path: '**', redirectTo: 'auth' }
];