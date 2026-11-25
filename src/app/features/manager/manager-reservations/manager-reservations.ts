import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ManagerReservation } from '../../../core/models/manager.models';
import { ManagerService } from '../../../core/services/manager.service';

type Tab = 'UPCOMING' | 'PAST';

/** Date du jour au format yyyy-MM-dd, en heure locale (pas d'effet de bord UTC). */
export function todayIso(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/**
 * Séjours confirmés des mobil-homes gérés : le gérant y trouve tout ce qu'il faut pour
 * l'accueil (contact du vacancier, occupants, plaque pour l'accès camping).
 */
@Component({
  selector: 'app-manager-reservations',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manager-reservations.html',
})
export class ManagerReservations {
  private readonly manager = inject(ManagerService);

  readonly reservations = signal<ManagerReservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly expanded = signal<Set<number>>(new Set());

  /** Injectable pour les tests (sinon : aujourd'hui). */
  today = todayIso();

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'UPCOMING', label: 'En cours et à venir' },
    { key: 'PAST', label: 'Passés' },
  ];
  readonly filter = signal<Tab>('UPCOMING');

  /** Un séjour est « en cours ou à venir » tant que son jour de départ n'est pas passé. */
  private isUpcoming(r: ManagerReservation): boolean {
    return r.end_date >= this.today;
  }

  readonly counts = computed<Record<Tab, number>>(() => {
    const all = this.reservations();
    const upcoming = all.filter((r) => this.isUpcoming(r)).length;
    return { UPCOMING: upcoming, PAST: all.length - upcoming };
  });

  /** À venir : le plus proche d'abord. Passés : le plus récent d'abord. */
  readonly filtered = computed(() => {
    const upcoming = this.filter() === 'UPCOMING';
    return this.reservations()
      .filter((r) => this.isUpcoming(r) === upcoming)
      .sort((a, b) =>
        upcoming ? a.start_date.localeCompare(b.start_date) : b.start_date.localeCompare(a.start_date),
      );
  });

  constructor() {
    this.manager.reservations().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les séjours.');
        this.loading.set(false);
      },
    });
  }

  setFilter(tab: Tab): void {
    this.filter.set(tab);
  }

  toggle(id: number): void {
    const set = new Set(this.expanded());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.expanded.set(set);
  }

  /** Séjour en cours aujourd'hui (arrivé, pas encore parti). */
  isOngoing(r: ManagerReservation): boolean {
    return r.start_date <= this.today && this.today < r.end_date;
  }

  /** Arrivée aujourd'hui : à mettre en avant pour l'accueil. */
  isArrivingToday(r: ManagerReservation): boolean {
    return r.start_date === this.today;
  }

  nights(r: ManagerReservation): number {
    const s = new Date(r.start_date + 'T12:00:00').getTime();
    const e = new Date(r.end_date + 'T12:00:00').getTime();
    return Math.max(0, Math.round((e - s) / 86_400_000));
  }

  /** Lien tel: sans espaces ni points (06 12 34 56 78 → 0612345678). */
  telLink(phone: string): string {
    return 'tel:' + phone.replace(/[^\d+]/g, '');
  }

  chipClasses(active: boolean): string {
    const base = 'rounded-full border px-3 py-1.5 text-sm font-medium transition ';
    return active
      ? `${base}border-accent bg-accent text-white`
      : `${base}border-line text-soft hover:bg-surface`;
  }
}
