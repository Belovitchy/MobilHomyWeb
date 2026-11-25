import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  SidebarSection,
  UserSidebarComponent,
} from '../../../shared/components/user-sidebar/user-sidebar';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [RouterOutlet, UserSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manager-layout.html',
})
export class ManagerLayout {
  readonly sections: SidebarSection[] = [
    {
      label: 'Gestion',
      items: [
        { label: 'Séjours', link: '/manager/reservations' },
        { label: 'Factures', link: '/manager/invoices' },
      ],
    },
    {
      label: 'Compte',
      items: [
        { label: 'Mon profil', link: '/manager/mon-compte' },
        { label: 'Déconnexion', action: 'logout' },
      ],
    },
  ];
}
