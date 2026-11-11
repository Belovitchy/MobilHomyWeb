import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OwnerReservation, SOURCE_LABELS } from '../../../core/models/reservation.models';
import { OwnerService } from '../../../core/services/owner.service';

type Tab = 'COMPLETED' | 'VALIDATED' | 'PENDING' | 'ARCHIVED';

@Component({
  selector: 'app-owner-requests',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './requests-list.html',
})
export class RequestsList {
  private readonly owner = inject(OwnerService);

  readonly reservations = signal<OwnerReservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<number | null>(null);
  readonly expanded = signal<Set<number>>(new Set());

  /** Saisie du n° Siblu : id de la réservation en cours d'édition et valeur tapée. */
  readonly sibluEditId = signal<number | null>(null);
  readonly sibluDraft = signal('');
  readonly sibluError = signal('');
  /** Même règle que le back (SibluRefRequestDto). */
  static readonly SIBLU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 /-]{0,29}$/;

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'COMPLETED', label: 'À traiter' },
    { key: 'VALIDATED', label: 'Validées' },
    { key: 'PENDING', label: 'Brouillons' },
    { key: 'ARCHIVED', label: 'Historique' },
  ];
  readonly filter = signal<Tab>('COMPLETED');

  readonly counts = computed<Record<Tab, number>>(() => {
    const all = this.reservations();
    return {
      COMPLETED: all.filter((r) => r.status === 'COMPLETED').length,
      VALIDATED: all.filter((r) => r.status === 'VALIDATED').length,
      PENDING: all.filter((r) => r.status === 'PENDING').length,
      ARCHIVED: all.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length,
    };
  });

  readonly filtered = computed(() => {
    const all = [...this.reservations()].sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (this.filter() === 'ARCHIVED')
      return all.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED');
    return all.filter((r) => r.status === this.filter());
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.owner.reservations().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les demandes.');
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

  validate(r: OwnerReservation): void {
    this.busyId.set(r.id);
    this.owner.validate(r.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Validation impossible — réessaie.');
      },
    });
  }

  reject(r: OwnerReservation): void {
    if (!confirm(`Rejeter la demande de ${r.occupant_name ?? 'ce vacancier'} du ${r.start_date} ?`))
      return;
    this.busyId.set(r.id);
    this.owner.reject(r.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Rejet impossible — réessaie.');
      },
    });
  }

  // ----- Réservations externes (Booking, Airbnb…) -----

  /** Réservation prise hors MobilHomy : le propriétaire en saisit et modifie lui-même les informations. */
  isExternal(r: OwnerReservation): boolean {
    return !!r.source && r.source !== 'MOBILHOMY';
  }

  sourceLabel(r: OwnerReservation): string {
    return SOURCE_LABELS[r.source ?? 'MOBILHOMY'];
  }

  /** Ce qui manque pour déclarer le séjour au camping. */
  missingForDeclaration(r: OwnerReservation): string[] {
    const gaps: string[] = [];
    if (!r.immat) gaps.push('plaque');
    if (!r.occupants?.length) gaps.push('occupants');
    return gaps;
  }

  cancelExternal(r: OwnerReservation): void {
    if (!confirm(`Annuler la réservation ${this.sourceLabel(r)} de ${r.occupant_name ?? 'ce client'} ?`)) return;
    this.busyId.set(r.id);
    this.owner.cancelExternalReservation(r.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Annulation impossible — réessaie.');
      },
    });
  }

  // ----- N° Siblu (déclaration au camping) -----

  /** Séjour validé dont la déclaration au camping reste à faire. */
  needsSiblu(r: OwnerReservation): boolean {
    return r.status === 'VALIDATED' && !r.siblu_ref;
  }

  startSiblu(r: OwnerReservation): void {
    this.sibluEditId.set(r.id);
    this.sibluDraft.set(r.siblu_ref ?? '');
    this.sibluError.set('');
  }

  cancelSiblu(): void {
    this.sibluEditId.set(null);
    this.sibluError.set('');
  }

  saveSiblu(r: OwnerReservation): void {
    const value = this.sibluDraft().trim();
    if (!RequestsList.SIBLU_PATTERN.test(value)) {
      this.sibluError.set('Numéro invalide : lettres, chiffres et tirets (30 caractères max).');
      return;
    }
    this.busyId.set(r.id);
    this.owner.updateSibluRef(r.id, value).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.sibluEditId.set(null);
        this.reservations.update((list) =>
          list.map((x) => (x.id === r.id ? { ...x, siblu_ref: updated.siblu_ref } : x)),
        );
      },
      error: () => {
        this.busyId.set(null);
        this.sibluError.set('Enregistrement impossible — réessaie.');
      },
    });
  }

  nights(r: OwnerReservation): number {
    const s = new Date(r.start_date + 'T12:00:00').getTime();
    const e = new Date(r.end_date + 'T12:00:00').getTime();
    return Math.max(0, Math.round((e - s) / 86_400_000));
  }

  badge(r: OwnerReservation): { label: string; classes: string } {
    switch (r.status) {
      case 'COMPLETED':
        return { label: 'À traiter', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'VALIDATED':
        return { label: 'Validée', classes: 'bg-accent-soft text-accent border-accent/20' };
      case 'PENDING':
        return { label: 'Brouillon', classes: 'bg-surface text-soft border-line' };
      case 'REJECTED':
        return { label: 'Rejetée', classes: 'bg-red-50 text-red-600 border-red-200' };
      default:
        return { label: 'Annulée', classes: 'bg-surface text-soft border-line' };
    }
  }

  chipClasses(active: boolean): string {
    const base = 'rounded-full border px-3 py-1.5 text-sm font-medium transition ';
    return active
      ? `${base}border-accent bg-accent text-white`
      : `${base}border-line text-soft hover:bg-surface`;
  }
}
