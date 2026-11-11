import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  SidebarSection,
  UserSidebarComponent,
} from '../../../shared/components/user-sidebar/user-sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, UserSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  readonly sections: SidebarSection[] = [
    {
      label: 'Supervision',
      items: [{ label: 'Tableau de bord', link: '/admin/dashboard' }],
    },
    {
      label: 'Comptes',
      items: [{ label: 'Propriétaires', link: '/admin/owners' }],
    },
    {
      label: 'Session',
      items: [{ label: 'Déconnexion', action: 'logout' }],
    },
  ];
}
