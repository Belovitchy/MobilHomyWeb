import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  SidebarSection,
  UserSidebarComponent,
} from '../../../shared/components/user-sidebar/user-sidebar';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [RouterOutlet, UserSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-layout.html',
})
export class OwnerLayout {
  // ⚠️ Mêmes champs que ceux passés à <app-user-sidebar> dans account-layout.html :
  // si ton composant attend d'autres inputs (titre, logo…), recopie-les ici.
  readonly sections: SidebarSection[] = [
    {
      label: 'Pilotage',
      items: [
        { label: 'Tableau de bord', link: '/owner/dashboard' },
        { label: 'Calendrier', link: '/owner/calendar' },
      ],
    },
    {
      label: 'Gestion',
      items: [
        { label: 'Mobil-homes', link: '/owner/mobil-homes' },
        { label: 'Demandes', link: '/owner/requests' },
        { label: 'Gérants', link: '/owner/managers' },
      ],
    },
    {
      label: 'Compte',
      items: [{ label: 'Mon profil', link: '/owner/mon-compte' }],
    },
  ];
}
