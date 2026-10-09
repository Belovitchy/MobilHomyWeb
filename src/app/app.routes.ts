import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guards';
import { Forbidden } from './features/auth/forbidden/forbidden';
import { Login } from './features/auth/login/login';
import { MobilHomeDetail } from './features/vacationer/mobil-home-detail/mobil-home-detail';
import { MobilHomeList } from './features/vacationer/mobil-home-list/mobil-home-list';
import { ReservationForm } from './features/vacationer/reservation-form/reservation-form';

export const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'forbidden', component: Forbidden },

  { path: '', component: MobilHomeList }, // public
  { path: 'mobil-homes/:id', component: MobilHomeDetail }, // public

  {
    path: 'mobil-homes/:id/reserver',
    component: ReservationForm,
    canActivate: [roleGuard('VACATIONER')], // VACATIONER
  },

  { path: 'login', component: Login },
  { path: 'forbidden', component: Forbidden },
  // ... admin/proprietaire/gerant inchangés
  { path: '**', redirectTo: '' },
];
