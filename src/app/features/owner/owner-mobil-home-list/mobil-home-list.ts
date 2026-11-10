import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { OwnerMobilHome } from '../../../core/models/mobilhome.models';
import { OwnerService } from '../../../core/services/owner.service';

@Component({
  selector: 'app-owner-mobil-home-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-mobil-home-list.html',
})
export class MobilHomeList {
  private readonly owner = inject(OwnerService);

  readonly homes = signal<OwnerMobilHome[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<number | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.owner.mobilHomes().subscribe({
      next: (homes) => {
        this.homes.set(homes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger tes mobil-homes.');
        this.loading.set(false);
      },
    });
  }

  remove(home: OwnerMobilHome): void {
    if (!confirm(`Supprimer « ${home.title} » ? Cette action est irréversible.`)) return;
    this.busyId.set(home.id);
    this.owner.deleteMobilHome(home.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.busyId.set(null);
        this.error.set("Suppression impossible — vérifie qu'aucune réservation n'y est rattachée.");
      },
    });
  }

  imageUrl(image: string): string {
    return image.startsWith('http') ? image : `${environment.apiOrigin}${image}`;
  }
}
