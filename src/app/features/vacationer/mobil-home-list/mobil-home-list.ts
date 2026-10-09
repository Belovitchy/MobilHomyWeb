import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment.development';
import { MobilHome } from '../../../core/models/vacationer.models';
import { MobilHomeService } from '../../../core/services/mobil-home.service';

@Component({
  selector: 'app-mobil-home-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './mobil-home-list.html',
})
export class MobilHomeList implements OnInit {
  private readonly api = inject(MobilHomeService);

  readonly homes = signal<MobilHome[]>([]);
  readonly loading = signal(false);

  // Filtres (liés par ngModel)
  department = '';
  capacity: number | null = null;
  startDate = '';
  endDate = '';

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.api
      .search({
        department: this.department || undefined,
        capacity: this.capacity ?? undefined,
      })
      .subscribe({
        next: (homes) => {
          this.homes.set(homes);
          this.loading.set(false);
        },
        error: () => {
          this.homes.set([]);
          this.loading.set(false);
        },
      });
  }

  /** Les images renvoyées par le back sont relatives à son origine */
  imageUrl(path: string): string {
    return `${environment.apiOrigin}${path}`;
  }

  /** Période incohérente (départ >= fin) → filtre dates ignoré + message */
  get dateRangeInvalid(): boolean {
    return !!this.startDate && !!this.endDate && this.startDate >= this.endDate;
  }

  /** true si [aStart, aEnd[ chevauche [bStart, bEnd[ (ISO yyyy-MM-dd : comparaison lexicale = chronologique) */
  private overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  /**
   * Pré-filtre front : chevauchement avec les réservations VALIDATED renvoyées par le back.
   * Sans période choisie → tout est affiché comme "Dispo".
   * ⚠️ Le back revalide au POST /reservations (résas PENDING + créneaux iCal non visibles ici).
   */
  isAvailable(home: MobilHome): boolean {
    if (this.dateRangeInvalid || !this.startDate || !this.endDate) return true;
    return !(home.reservations ?? []).some((r) =>
      this.overlaps(this.startDate, this.endDate, r.startDate, r.endDate),
    );
  }

  get filteredHomes(): MobilHome[] {
    return this.homes().filter((h) => this.isAvailable(h));
  }

  get availableCount(): number {
    return this.filteredHomes.length;
  }
}
