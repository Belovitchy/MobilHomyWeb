import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment.development';
import { MobilHome } from '../../../core/models/vacationer.models';
import { MobilHomeService } from '../../../core/services/mobil-home.service';

interface CalendarDay {
  date: string; // yyyy-MM-dd
  dayNumber: number;
  booked: boolean;
}

@Component({
  selector: 'app-mobil-home-detail',
  imports: [RouterLink],
  templateUrl: './mobil-home-detail.html',
})
export class MobilHomeDetail implements OnChanges {
  private readonly api = inject(MobilHomeService);
  private readonly router = inject(Router);

  @Input() id!: string;

  readonly home = signal<MobilHome | null>(null);
  readonly error = signal(false);
  readonly mainImageIndex = signal(0);

  // Sélection de dates dans la carte de réservation
  startDate = '';
  endDate = '';

  ngOnChanges(): void {
    this.api.getById(Number(this.id)).subscribe({
      next: (home) => {
        this.home.set(home);
        this.mainImageIndex.set(0);
      },
      error: () => this.error.set(true),
    });
  }

  // --- Images ---
  imageUrl(path: string): string {
    return `${environment.apiOrigin}${path}`;
  }

  selectMainImage(index: number): void {
    this.mainImageIndex.set(index);
  }

  // --- Disponibilité (pré-filtre front, le back revalide au POST) ---
  private overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  get dateRangeInvalid(): boolean {
    return !!this.startDate && !!this.endDate && this.startDate >= this.endDate;
  }

  isAvailableForDates(): boolean {
    const h = this.home();
    if (!h || this.dateRangeInvalid || !this.startDate || !this.endDate) return true;
    return !(h.reservations ?? []).some((r) =>
      this.overlaps(this.startDate, this.endDate, r.startDate, r.endDate),
    );
  }

  // --- Total estimé ---
  get nights(): number | null {
    if (!this.startDate || !this.endDate || this.dateRangeInvalid) return null;
    const ms = new Date(this.endDate).getTime() - new Date(this.startDate).getTime();
    return Math.round(ms / 86_400_000);
  }

  get totalPrice(): number | null {
    const h = this.home();
    return h && this.nights ? this.nights * h.price : null;
  }

  // --- Mini-calendrier : 14 prochains jours ---
  calendarDays(): CalendarDay[] {
    const h = this.home();
    if (!h) return [];
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      return {
        date: iso,
        dayNumber: d.getDate(),
        booked: (h.reservations ?? []).some((r) => r.startDate <= iso && iso < r.endDate),
      };
    });
  }

  // --- Navigation ---
  goReserve(): void {
    
    this.router.navigate(['/mobil-homes', this.id, 'reserver'], {
      queryParams: { start: this.startDate || null, end: this.endDate || null },
    });
  }
}
