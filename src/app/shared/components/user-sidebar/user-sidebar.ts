import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export interface SidebarItem {
  label: string;
  link?: string; // route interne
  action?: 'logout'; // ou action spéciale
  exact?: boolean; // pour routerLinkActive
}

export interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

@Component({
  selector: 'app-user-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './user-sidebar.html',
})
export class UserSidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Titre affiché en haut (ex: "Espace Vacancier") */
  readonly title = input.required<string>();
  readonly sections = input.required<SidebarSection[]>();

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
