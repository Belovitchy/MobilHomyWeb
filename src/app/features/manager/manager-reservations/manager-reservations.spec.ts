import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ManagerReservation } from '../../../core/models/manager.models';
import { ManagerReservations, todayIso } from './manager-reservations';

const URL = `${environment.apiUrl}/manager/reservations`;

function stay(id: number, start: string, end: string, extra: Partial<ManagerReservation> = {}): ManagerReservation {
  return {
    id,
    mobil_home_id: 10,
    mobil_home_title: 'Océane',
    location: 'La Réserve',
    start_date: start,
    end_date: end,
    status: 'VALIDATED',
    vacationer_name: 'Julie Martin',
    vacationer_phone: '06 12 34 56 78',
    vacationer_email: 'julie@mail.fr',
    immat: 'AA-123-BB',
    occupants_count: 2,
    occupants: [
      { firstname: 'Léo', name: 'Martin', age: 10 },
      { firstname: 'Emma', name: 'Martin', age: 7 },
    ],
    ...extra,
  };
}

// « Aujourd'hui » figé au 15 juillet 2027 pour des tests reproductibles.
const TODAY = '2027-07-15';
const DATA = [
  stay(1, '2027-07-12', '2027-07-19'), // en cours
  stay(2, '2027-08-01', '2027-08-08'), // à venir
  stay(3, '2027-07-15', '2027-07-22'), // arrive aujourd'hui
  stay(4, '2027-06-01', '2027-06-08'), // passé
  stay(5, '2027-07-08', '2027-07-15'), // part aujourd'hui → encore « en cours / à venir »
];

describe('ManagerReservations', () => {
  let fixture: ComponentFixture<ManagerReservations>;
  let component: ManagerReservations;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerReservations],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ManagerReservations);
    component = fixture.componentInstance;
    component.today = TODAY;
    http.expectOne(URL).flush(DATA);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('sépare les séjours en cours/à venir des séjours passés (le jour de départ compte encore)', () => {
    expect(component.counts()).toEqual({ UPCOMING: 4, PAST: 1 });
  });

  it('trie les séjours à venir du plus proche au plus lointain', () => {
    expect(component.filtered().map((r) => r.id)).toEqual([5, 1, 3, 2]);
  });

  it('trie les séjours passés du plus récent au plus ancien', () => {
    component.setFilter('PAST');
    expect(component.filtered().map((r) => r.id)).toEqual([4]);
  });

  it('signale les arrivées du jour et les séjours en cours', () => {
    expect(component.isArrivingToday(DATA[2])).toBe(true);
    expect(component.isOngoing(DATA[0])).toBe(true);
    expect(component.isOngoing(DATA[4])).toBe(false); // départ aujourd'hui : plus d'occupation la nuit
    expect(component.isOngoing(DATA[1])).toBe(false);
  });

  it('affiche les contacts cliquables du vacancier et la plaque pour l’accès camping', () => {
    const card: HTMLElement = fixture.nativeElement.querySelector('article[data-id="1"]');

    expect(card.querySelector('a[href="tel:0612345678"]')).not.toBeNull();
    expect(card.querySelector('a[href="mailto:julie@mail.fr"]')).not.toBeNull();
    expect(card.textContent).toContain('AA-123-BB');
  });

  it('déplie la liste des occupants (âges utiles pour les FunPass)', () => {
    component.toggle(1);
    fixture.detectChanges();

    const card: HTMLElement = fixture.nativeElement.querySelector('article[data-id="1"]');
    expect(card.textContent).toContain('Léo Martin');
    expect(card.textContent).toContain('10 ans');
  });

  it('nettoie le numéro pour le lien tel:', () => {
    expect(component.telLink('+33 6.12.34.56.78')).toBe('tel:+33612345678');
  });
});

describe('todayIso', () => {
  it('formate la date locale en yyyy-MM-dd', () => {
    expect(todayIso(new Date(2027, 0, 5))).toBe('2027-01-05');
  });
});
