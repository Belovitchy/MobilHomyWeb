import { Component, computed, input, signal } from '@angular/core';

interface CalendarReservation {
  startDate: string;
  endDate: string;
}

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

  // Le matin est réservé si une réservation a commencé avant ce jour
  // et se termine ce jour ou après.
  isMorningBooked(day: number): boolean {
    const date = this.dateForDay(day);

    return this.reservations().some(
      (reservation) => reservation.startDate < date && date <= reservation.endDate,
    );
  }

  // L'après-midi est réservé si une réservation commence ce jour
  // ou avant et se termine après ce jour.
  isAfternoonBooked(day: number): boolean {
    const date = this.dateForDay(day);

    return this.reservations().some(
      (reservation) => reservation.startDate <= date && date < reservation.endDate,
    );
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
