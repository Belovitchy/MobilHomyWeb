import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  SidebarSection,
  UserSidebarComponent,
} from '../../../shared/components/user-sidebar/user-sidebar';

@Component({
  selector: 'app-account-layout',
  imports: [RouterOutlet, UserSidebarComponent],
  templateUrl: './account-layout.html',
})
export class AccountLayoutComponent {
  readonly sections: SidebarSection[] = [
    {
      label: 'Gestion',
      items: [
        { label: 'Mes réservations', link: '/mon-compte-vacationer/reservations', exact: true },
        { label: 'Mon profil', link: '/mon-compte-vacationer/profil', exact: true },
      ],
    },
    {
      label: 'Compte',
      items: [{ label: 'Déconnexion', action: 'logout' }],
    },
  ];
}
