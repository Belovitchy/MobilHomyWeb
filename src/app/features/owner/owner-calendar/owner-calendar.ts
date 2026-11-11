import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent } from '../../../core/models/calendar.models';
import { OwnerMobilHome } from '../../../core/models/mobilhome.models';
import { OwnerService } from '../../../core/services/owner.service';
// ⚠️ Adapte l'import au nom réel du fichier/classe de ton composant
// (src/app/shared/components/resa-calendar/).
import {
  CalendarComponent,
  CalendarReservation,
} from '../../../shared/components/calendar/calendar';

@Component({
  selector: 'app-owner-calendar',
  standalone: true,
  imports: [CalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-calendar.html',
})
export class OwnerCalendar {
  private readonly owner = inject(OwnerService);

  readonly homes = signal<OwnerMobilHome[]>([]);
  readonly events = signal<CalendarEvent[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  /**
   * Un seul mobil-home affiché à la fois : superposer plusieurs mobil-homes sur une même grille
   * rendait le calendrier illisible (un jour « réservé » sans savoir lequel). Le premier est sélectionné par défaut.
   */
  readonly filterHomeId = signal<number | null>(null);

  /** Export iCal — le back doit répondre en text/calendar (accessible sans header Authorization, ou avec ?token=). */
  readonly exportUrl = `${environment.apiOrigin}/api/owner/calendar.ics`;

  readonly filtered = computed(() => {
    const id = this.filterHomeId();
    return id === null ? [] : this.events().filter((e) => e.mobil_home_id === id);
  });

  /** Adaptation vers l'input [reservations] de <app-calendar>. */
  readonly calendarEvents = computed<CalendarReservation[]>(() =>
    this.filtered().map((e) => ({
      startDate: e.start,
      endDate: e.end,
      source: e.source,
      status: e.status,
    })),
  );

  constructor() {
    forkJoin({ homes: this.owner.mobilHomes(), events: this.owner.calendarEvents() }).subscribe({
      next: ({ homes, events }) => {
        this.homes.set(homes);
        this.events.set(events);
        if (homes.length > 0) this.filterHomeId.set(homes[0].id);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le calendrier.');
        this.loading.set(false);
      },
    });
  }

  setFilter(v: number): void {
    this.filterHomeId.set(v);
  }

  chipClasses(active: boolean): string {
    const base = 'rounded-full border px-3 py-1 text-xs font-medium transition ';
    return active
      ? `${base}border-accent bg-accent text-white`
      : `${base}border-line text-soft hover:bg-surface`;
  }
}
