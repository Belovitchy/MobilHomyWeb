import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminStats } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

interface Tile {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
}

/** Vue d'ensemble de la plateforme : volumes et points d'attention. */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {
  private readonly admin = inject(AdminService);

  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly tiles = computed<Tile[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        label: 'Propriétaires',
        value: String(s.owners),
        hint: s.owners_suspended ? `dont ${s.owners_suspended} suspendu(s)` : 'tous actifs',
        alert: s.owners_suspended > 0,
      },
      { label: 'Gérants', value: String(s.managers) },
      { label: 'Vacanciers', value: String(s.vacationers) },
      { label: 'Mobil-homes', value: String(s.mobilhomes) },
      {
        label: 'Réservations',
        value: String(s.reservations),
        hint: `${s.reservations_validated} validée(s)`,
      },
    ];
  });

  constructor() {
    this.admin.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les indicateurs.');
        this.loading.set(false);
      },
    });
  }
}
