import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent, CalendarReservation } from './calendar';

/**
 * Sémantique demi-journée : une réservation du 12 au 19 occupe
 * l'après-midi du 12 (arrivée), les journées du 13 au 18, et le matin du 19 (départ).
 */
describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let cal: CalendarComponent;

  const JULY_STAY: CalendarReservation = { startDate: '2027-07-12', endDate: '2027-07-19' };

  function show(reservations: CalendarReservation[]): void {
    fixture.componentRef.setInput('reservations', reservations);
    fixture.detectChanges();
  }

  /** Cellule <td> du jour donné dans le mois affiché. */
  function cell(date: string): HTMLElement {
    return fixture.nativeElement.querySelector(`td[data-date="${date}"]`) as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CalendarComponent] }).compileComponents();
    fixture = TestBed.createComponent(CalendarComponent);
    cal = fixture.componentInstance;
    // On fige l'affichage sur juillet 2027 pour des tests indépendants de la date du jour.
    cal.displayedYear.set(2027);
    cal.displayedMonth.set(6);
  });

  describe('demi-journées', () => {
    beforeEach(() => show([JULY_STAY]));

    it('jour d’arrivée : matin libre, après-midi réservé', () => {
      expect(cal.isMorningBooked(12)).toBe(false);
      expect(cal.isAfternoonBooked(12)).toBe(true);
      expect(cal.isBooked(12)).toBe(false);
    });

    it('jour plein au milieu du séjour', () => {
      expect(cal.isBooked(15)).toBe(true);
    });

    it('jour de départ : matin réservé, après-midi libre (un autre séjour peut arriver)', () => {
      expect(cal.isMorningBooked(19)).toBe(true);
      expect(cal.isAfternoonBooked(19)).toBe(false);
    });

    it('les jours hors séjour sont libres', () => {
      expect(cal.isMorningBooked(11)).toBe(false);
      expect(cal.isAfternoonBooked(20)).toBe(false);
    });
  });

  describe('couleurs par statut', () => {
    it('une demande à traiter (COMPLETED) est en orange, pas en vert', () => {
      show([{ ...JULY_STAY, status: 'COMPLETED' }]);

      expect(cal.isAfternoonPending(15)).toBe(true);
      const indicators = cell('2027-07-15').querySelectorAll('.indicator.pending');
      expect(indicators.length).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('À traiter');
    });

    it('une réservation validée reste verte, sans légende « À traiter »', () => {
      show([{ ...JULY_STAY, status: 'VALIDATED' }]);

      expect(cal.isAfternoonPending(15)).toBe(false);
      expect(cell('2027-07-15').querySelectorAll('.indicator.pending').length).toBe(0);
      expect(fixture.nativeElement.textContent).not.toContain('À traiter');
    });

    it('un créneau iCal est hachuré', () => {
      show([{ ...JULY_STAY, source: 'ICAL' }]);

      expect(cal.isMorningExternal(15)).toBe(true);
      expect(cell('2027-07-15').querySelectorAll('.indicator.external').length).toBe(2);
    });

    it('si deux créneaux tombent le même jour, la réservation validée l’emporte sur la demande', () => {
      show([
        { ...JULY_STAY, status: 'COMPLETED' },
        { startDate: '2027-07-14', endDate: '2027-07-16', status: 'VALIDATED' },
      ]);

      expect(cal.isAfternoonPending(14)).toBe(false); // validée affichée
      expect(cal.isAfternoonPending(17)).toBe(true); // seule la demande ce jour-là
    });
  });

  describe('navigation', () => {
    it('décembre → janvier de l’année suivante', () => {
      cal.displayedMonth.set(11);
      cal.nextMonth();

      expect(cal.displayedMonth()).toBe(0);
      expect(cal.displayedYear()).toBe(2028);
    });

    it('janvier → décembre de l’année précédente', () => {
      cal.displayedMonth.set(0);
      cal.previousMonth();

      expect(cal.displayedMonth()).toBe(11);
      expect(cal.displayedYear()).toBe(2026);
    });

    it('les semaines commencent le lundi (1er juillet 2027 = jeudi)', () => {
      const firstWeek = cal.weeks()[0];
      expect(firstWeek.indexOf(1)).toBe(3); // lun=0, mar=1, mer=2, jeu=3
    });
  });
});
