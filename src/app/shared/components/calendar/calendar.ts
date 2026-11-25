import { Component, computed, input, signal } from '@angular/core';

export interface CalendarReservation {
  startDate: string;
  endDate: string;
  /** Optionnel : 'ICAL' = créneau importé d'une plateforme externe (affiché hachuré). */
  source?: 'INTERNAL' | 'ICAL';
  /** Optionnel : 'COMPLETED' = demande soumise, à traiter (affichée en orange). Absent = réservé. */
  status?: string;
}

/** Statut « demande envoyée par le vacancier, à traiter par le propriétaire ». */
const PENDING_STATUS = 'COMPLETED';

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class CalendarComponent {
  // Réservations reçues depuis le composant parent
  readonly reservations = input<CalendarReservation[]>([]);

  private readonly now = new Date();

  readonly currentMonth = this.now.getMonth();
  readonly currentYear = this.now.getFullYear();
  readonly today = this.toIsoDate(this.now);

  readonly displayedMonth = signal(this.currentMonth);
  readonly displayedYear = signal(this.currentYear);

  readonly months = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  readonly weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  readonly monthName = computed(
    () => `${this.months[this.displayedMonth()]} ${this.displayedYear()}`,
  );

  readonly weeks = computed(() => this.buildMonth(this.displayedMonth(), this.displayedYear()));

  // Navigation entre les mois
  previousMonth(): void {
    if (this.displayedMonth() === 0) {
      this.displayedMonth.set(11);
      this.displayedYear.update((year) => year - 1);
    } else {
      this.displayedMonth.update((month) => month - 1);
    }
  }

  nextMonth(): void {
    if (this.displayedMonth() === 11) {
      this.displayedMonth.set(0);
      this.displayedYear.update((year) => year + 1);
    } else {
      this.displayedMonth.update((month) => month + 1);
    }
  }

  // Construction du mois avec des semaines commençant le lundi
  private buildMonth(month: number, year: number): (number | null)[][] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // JavaScript : dimanche = 0 ; lundi = 1
    // Conversion pour commencer la semaine le lundi
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

    const cells: (number | null)[] = [
      ...Array<null>(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    // Complète la dernière semaine
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: (number | null)[][] = [];

    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }

    return weeks;
  }

  // Conversion d'une date en yyyy-MM-dd, sans problème de fuseau UTC
  toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Date correspondant au numéro du jour dans le mois affiché
  dateForDay(day: number): string {
    return this.toIsoDate(new Date(this.displayedYear(), this.displayedMonth(), day));
  }

  // Affiche la légende iCal seulement si au moins un créneau externe est présent
  readonly hasExternal = computed(() => this.reservations().some((r) => r.source === 'ICAL'));

  // Affiche la légende « à traiter » seulement si au moins une demande en attente est présente
  readonly hasPending = computed(() => this.reservations().some((r) => this.isPending(r)));

  private isPending(r: CalendarReservation): boolean {
    return r.status === PENDING_STATUS;
  }

  /**
   * Plusieurs créneaux peuvent tomber le même jour (vue « Tous » sur plusieurs mobil-homes) :
   * on affiche le plus engageant — réservé > iCal > à traiter.
   */
  private priority(r: CalendarReservation): number {
    if (r.source === 'ICAL') return 1;
    return this.isPending(r) ? 2 : 0;
  }

  private pick(matches: CalendarReservation[]): CalendarReservation | undefined {
    return matches.reduce<CalendarReservation | undefined>(
      (best, r) => (!best || this.priority(r) < this.priority(best) ? r : best),
      undefined,
    );
  }

  // Réservation qui occupe le matin : commencée avant ce jour, se termine ce jour ou après.
  private morningReservation(day: number): CalendarReservation | undefined {
    const date = this.dateForDay(day);
    return this.pick(this.reservations().filter((r) => r.startDate < date && date <= r.endDate));
  }

  // Réservation qui occupe l'après-midi : commence ce jour ou avant, se termine après ce jour.
  private afternoonReservation(day: number): CalendarReservation | undefined {
    const date = this.dateForDay(day);
    return this.pick(this.reservations().filter((r) => r.startDate <= date && date < r.endDate));
  }

  isMorningBooked(day: number): boolean {
    return !!this.morningReservation(day);
  }

  isAfternoonBooked(day: number): boolean {
    return !!this.afternoonReservation(day);
  }

  // Demi-journée occupée par un créneau importé (iCal)
  isMorningExternal(day: number): boolean {
    return this.morningReservation(day)?.source === 'ICAL';
  }

  isAfternoonExternal(day: number): boolean {
    return this.afternoonReservation(day)?.source === 'ICAL';
  }

  // Demi-journée occupée par une demande à traiter (orange)
  isMorningPending(day: number): boolean {
    const r = this.morningReservation(day);
    return !!r && this.isPending(r);
  }

  isAfternoonPending(day: number): boolean {
    const r = this.afternoonReservation(day);
    return !!r && this.isPending(r);
  }

  // Le jour est entièrement réservé si les deux demi-journées le sont
  isBooked(day: number): boolean {
    return this.isMorningBooked(day) && this.isAfternoonBooked(day);
  }

  // Indique si le jour correspond à aujourd'hui
  isToday(day: number): boolean {
    return this.dateForDay(day) === this.today;
  }
}
