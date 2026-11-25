import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OwnerLinksStore } from '../../../core/services/owner-links.store';
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
  private readonly links = inject(OwnerLinksStore);

  private readonly baseSections: SidebarSection[] = [
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
  ];

  /** Menu = sections fixes + liens utiles du propriétaire (mis à jour dès qu'il en ajoute un). */
  readonly sections = computed<SidebarSection[]>(() => [
    ...this.baseSections,
    {
      label: 'Liens utiles',
      items: [
        ...this.links.links().map((l) => ({ label: l.name, href: l.url })),
        { label: 'Gérer mes liens', link: '/owner/links' },
      ],
    },
    {
      label: 'Compte',
      items: [{ label: 'Mon profil', link: '/owner/mon-compte' }],
    },
  ]);

  constructor() {
    this.links.load();
  }
}
