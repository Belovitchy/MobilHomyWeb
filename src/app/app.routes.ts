import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guards';
import { Forbidden } from './features/auth/forbidden/forbidden';
import { Login } from './features/auth/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'forbidden', component: Forbidden },

  // Espaces protégés — placeholders, les vraies pages arrivent avec les modules K/L/M/N
  {
    path: 'accueil',
    loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin/admin-home/admin-home').then((m) => m.AdminHome),
  },
  {
    path: 'owner',
    canActivate: [authGuard, roleGuard('OWNER')],
    loadComponent: () => import('./features/owner/owner-home/owner-home').then((m) => m.OwnerHome),
  },
  {
    path: 'manager',
    canActivate: [authGuard, roleGuard('MANAGER')],
    loadComponent: () =>
      import('./features/manager/manager-home/manager-home').then((m) => m.ManagerHome),
  },
  {
    path: 'vacationer',
    canActivate: [authGuard, roleGuard('VACATIONER')],
    loadComponent: () =>
      import('./features/vacationer/vacationer-home/vacationer-home').then((m) => m.VacationerHome),
  },
  { path: '**', redirectTo: 'accueil' },
];
