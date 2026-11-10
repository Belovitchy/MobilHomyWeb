import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { OwnerMobilHome } from '../../../core/models/mobilhome.models';
import { OwnerReservation } from '../../../core/models/reservation.models';
import { OwnerService } from '../../../core/services/owner.service';
import { ChartSeries, LineChart } from '../../../shared/components/line-chart/line-chart';

const YEAR = new Date().getFullYear();
const PALETTE = [
  '#2E6E5A',
  '#D97706',
  '#2563EB',
  '#7C3AED',
  '#DC2626',
  '#0891B2',
  '#65A30D',
  '#DB2777',
];

function parse(d: string): Date {
  return new Date(d + 'T12:00:00'); // midi => insensible aux changements d'heure
}

/** Nuits d'un séjour : de l'arrivée incluse au départ exclu (sémantique demi-journée). */
function eachNight(start: string, end: string): Date[] {
  const out: Date[] = [];
  for (let t = parse(start).getTime(); t < parse(end).getTime(); t += 86_400_000) {
    out.push(new Date(t));
  }
  return out;
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** Semaines couvertes par la fenêtre "90 prochains jours". */
const WINDOW_WEEKS: Set<number> = (() => {
  const weeks = new Set<number>();
  const today = new Date();
  for (let i = 0; i < 90; i++) weeks.add(isoWeek(new Date(today.getTime() + i * 86_400_000)));
  return weeks;
})();

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [LineChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class OwnerDashboard {
  private readonly owner = inject(OwnerService);

  readonly year = YEAR;
  readonly homes = signal<OwnerMobilHome[]>([]);
  readonly reservations = signal<OwnerReservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selectedHomeIds = signal<Set<number>>(new Set());

  readonly weekLabels = Array.from({ length: 53 }, (_, i) => `S${i + 1}`);

  constructor() {
    forkJoin({ homes: this.owner.mobilHomes(), resas: this.owner.reservations() }).subscribe({
      next: ({ homes, resas }) => {
        this.homes.set(homes);
        this.reservations.set(resas);
        this.selectedHomeIds.set(new Set(homes.map((h) => h.id)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les données du tableau de bord.');
        this.loading.set(false);
      },
    });
  }

  // ----- Cartes stats -----
  readonly pendingCount = computed(
    () => this.reservations().filter((r) => r.status === 'COMPLETED').length,
  );

  readonly nightsThisYear = computed(() =>
    this.reservations()
      .filter((r) => r.status === 'VALIDATED')
      .reduce(
        (sum, r) =>
          sum + eachNight(r.start_date, r.end_date).filter((d) => d.getFullYear() === YEAR).length,
        0,
      ),
  );

  // ----- Occupation par semaine (0-100 %), à partir des réservations VALIDATED -----
  readonly ratesByHome = computed(() => {
    const map = new Map<number, number[]>();
    for (const h of this.homes()) map.set(h.id, new Array(53).fill(0));
    for (const r of this.reservations()) {
      if (r.status !== 'VALIDATED') continue;
      const arr = map.get(r.mobil_home_id);
      if (!arr) continue;
      for (const night of eachNight(r.start_date, r.end_date)) {
        if (night.getFullYear() !== YEAR) continue;
        arr[isoWeek(night) - 1] = Math.min(100, arr[isoWeek(night) - 1] + 100 / 7);
      }
    }
    return map;
  });

  readonly globalRates = computed(() => {
    const homes = this.homes();
    const byHome = this.ratesByHome();
    const n = Math.max(homes.length, 1);
    const out = new Array(53).fill(0);
    for (const h of homes) {
      const arr = byHome.get(h.id) ?? [];
      for (let w = 0; w < 53; w++) out[w] += (arr[w] ?? 0) / n;
    }
    return out;
  });

  readonly chartSeries = computed<ChartSeries[]>(() => {
    const sel = this.selectedHomeIds();
    const byHome = this.ratesByHome();
    const out: ChartSeries[] = [];
    let i = 0;
    for (const h of this.homes()) {
      if (!sel.has(h.id)) continue;
      out.push({
        label: h.title,
        color: PALETTE[i++ % PALETTE.length],
        points: byHome.get(h.id) ?? [],
      });
    }
    out.push({
      label: 'Moyenne (tous les mobil-homes)',
      color: '#1F2937',
      points: this.globalRates(),
    });
    return out;
  });

  readonly occ90 = computed(() => {
    const g = this.globalRates();
    let sum = 0,
      count = 0;
    WINDOW_WEEKS.forEach((w) => {
      sum += g[w - 1] ?? 0;
      count++;
    });
    return count ? Math.round(sum / count) : 0;
  });

  readonly homeStats = computed(() => {
    const byHome = this.ratesByHome();
    return this.homes().map((h) => {
      const arr = byHome.get(h.id) ?? [];
      let sum = 0,
        count = 0;
      WINDOW_WEEKS.forEach((w) => {
        sum += arr[w - 1] ?? 0;
        count++;
      });
      const nights = this.reservations()
        .filter((r) => r.status === 'VALIDATED' && r.mobil_home_id === h.id)
        .reduce(
          (s, r) =>
            s + eachNight(r.start_date, r.end_date).filter((d) => d.getFullYear() === YEAR).length,
          0,
        );
      return { home: h, nights, occ90: count ? Math.round(sum / count) : 0 };
    });
  });

  toggleHome(id: number): void {
    const set = new Set(this.selectedHomeIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedHomeIds.set(set);
  }

  selectAll(): void {
    this.selectedHomeIds.set(new Set(this.homes().map((h) => h.id)));
  }

  chipClasses(active: boolean): string {
    const base = 'rounded-full border px-3 py-1 text-xs font-medium transition ';
    return active
      ? `${base}border-accent bg-accent text-white`
      : `${base}border-line text-soft hover:bg-surface`;
  }
}
