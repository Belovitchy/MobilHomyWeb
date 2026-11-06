import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guards';
import { Forbidden } from './features/auth/forbidden/forbidden';
import { Login } from './features/auth/login/login';
import { AccountLayoutComponent } from './features/vacationer/account-layout/account-layout';
import { CompleteReservation } from './features/vacationer/complete-reservation/complete-reservation';
import { MobilHomeDetail } from './features/vacationer/mobil-home-detail/mobil-home-detail';
import { MobilHomeList } from './features/vacationer/mobil-home-list/mobil-home-list';
import { MyReservations } from './features/vacationer/my-reservations/my-reservations';
import { ProfileComponent } from './features/vacationer/profile/profile';
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
  {
    path: 'mon-compte-vacationer',
    canActivate: [roleGuard('VACATIONER')],
    component: AccountLayoutComponent,
    children: [
      { path: '', redirectTo: 'reservations', pathMatch: 'full' },
      { path: 'reservations', component: MyReservations },
      { path: 'reservations/:id/completer', component: CompleteReservation },
      { path: 'profil', component: ProfileComponent },
    ],
  },

  { path: 'login', component: Login },
  { path: 'forbidden', component: Forbidden },
  // ... admin/proprietaire/gerant inchangés
  { path: '**', redirectTo: '' },
];
