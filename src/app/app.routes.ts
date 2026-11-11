import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guards';
import { Forbidden } from './features/auth/forbidden/forbidden';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { OwnerDashboard } from './features/owner/dashboard/dashboard';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { AdminLayout } from './features/admin/admin-layout/admin-layout';
import { AdminOwners } from './features/admin/admin-owners/admin-owners';
import { ManagerInvoices } from './features/manager/manager-invoices/manager-invoices';
import { ManagerLayout } from './features/manager/manager-layout/manager-layout';
import { ManagerReservations } from './features/manager/manager-reservations/manager-reservations';
import { ExternalReservationForm } from './features/owner/external-reservation-form/external-reservation-form';
import { ManagerList } from './features/owner/manager-list/manager-list';
import { OwnerLinks } from './features/owner/owner-links/owner-links';
import { MobilHomeForm } from './features/owner/mobil-home-form/mobil-home-form';
import { OwnerCalendar } from './features/owner/owner-calendar/owner-calendar';
import { OwnerLayout } from './features/owner/owner-layout/owner-layout';
import { OwnerMobilHomeList } from './features/owner/owner-mobil-home-list/owner-mobil-home-list';
import { RequestsList } from './features/owner/requests-list/requests-list';
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
  { path: 'register', component: Register },
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

  {
    path: 'owner',
    component: OwnerLayout,
    canActivate: [roleGuard('OWNER')], // adapte si ton roleGuard a une autre signature
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: OwnerDashboard, title: 'MobilHomy — Tableau de bord' },
      { path: 'mobil-homes', component: OwnerMobilHomeList, title: 'MobilHomy — Mobil-homes' },
      {
        path: 'mobil-homes/nouveau',
        component: MobilHomeForm,
        title: 'MobilHomy — Nouveau mobil-home',
      },
      {
        path: 'mobil-homes/:id',
        component: MobilHomeForm,
        title: 'MobilHomy — Modifier un mobil-home',
      },
      { path: 'requests', component: RequestsList, title: 'MobilHomy — Demandes' },
      {
        path: 'requests/externe',
        component: ExternalReservationForm,
        title: 'MobilHomy — Réservation externe',
      },
      {
        path: 'requests/:id/details',
        component: ExternalReservationForm,
        title: 'MobilHomy — Client et occupants',
      },
      { path: 'links', component: OwnerLinks, title: 'MobilHomy — Mes liens' },
      { path: 'managers', component: ManagerList, title: 'MobilHomy — Gérants' },
      { path: 'calendar', component: OwnerCalendar, title: 'MobilHomy — Calendrier' },
      { path: 'mon-compte', component: ProfileComponent, title: 'MobilHomy — Mon compte' },
    ],
  },

  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboard, title: 'MobilHomy — Administration' },
      { path: 'owners', component: AdminOwners, title: 'MobilHomy — Propriétaires' },
    ],
  },

  {
    path: 'manager',
    component: ManagerLayout,
    canActivate: [roleGuard('MANAGER')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'reservations' },
      { path: 'reservations', component: ManagerReservations, title: 'MobilHomy — Séjours' },
      { path: 'invoices', component: ManagerInvoices, title: 'MobilHomy — Factures' },
      { path: 'mon-compte', component: ProfileComponent, title: 'MobilHomy — Mon compte' },
    ],
  },

  { path: 'login', component: Login },
  { path: 'forbidden', component: Forbidden },
  // ... admin/proprietaire/gerant inchangés
  { path: '**', redirectTo: '' },
];
