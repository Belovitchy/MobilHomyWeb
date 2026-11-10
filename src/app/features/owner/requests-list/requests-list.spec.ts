import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { OwnerReservation } from '../../../core/models/reservation.models';
import { RequestsList } from './requests-list';

const URL = `${environment.apiUrl}/owner/reservations`;

const RESERVATIONS: OwnerReservation[] = [
  { id: 1, mobil_home_id: 10, start_date: '2027-07-12', end_date: '2027-07-19', status: 'COMPLETED', occupant_name: 'Julie Martin' },
  { id: 2, mobil_home_id: 10, start_date: '2027-08-01', end_date: '2027-08-08', status: 'VALIDATED' },
  { id: 3, mobil_home_id: 11, start_date: '2027-06-01', end_date: '2027-06-03', status: 'PENDING' },
  { id: 4, mobil_home_id: 11, start_date: '2027-05-01', end_date: '2027-05-05', status: 'REJECTED' },
  { id: 5, mobil_home_id: 11, start_date: '2027-04-01', end_date: '2027-04-05', status: 'CANCELLED' },
];

describe('RequestsList (demandes du propriétaire)', () => {
  let fixture: ComponentFixture<RequestsList>;
  let component: RequestsList;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestsList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RequestsList);
    component = fixture.componentInstance;
    http.expectOne(URL).flush(RESERVATIONS); // chargement initial (constructeur)
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('compte les demandes par onglet (refusées + annulées = historique)', () => {
    expect(component.counts()).toEqual({ COMPLETED: 1, VALIDATED: 1, PENDING: 1, ARCHIVED: 2 });
  });

  it('affiche par défaut l’onglet « À traiter »', () => {
    expect(component.filtered().map((r) => r.id)).toEqual([1]);
    expect(fixture.nativeElement.textContent).toContain('Julie Martin');
  });

  it('change d’onglet et trie par date d’arrivée', () => {
    component.setFilter('ARCHIVED');
    expect(component.filtered().map((r) => r.id)).toEqual([5, 4]);
  });

  it('valider une demande appelle l’API puis recharge la liste', () => {
    component.validate(RESERVATIONS[0]);
    expect(component.busyId()).toBe(1);

    http.expectOne(`${URL}/1/validate`).flush({ ...RESERVATIONS[0], status: 'VALIDATED' });
    http.expectOne(URL).flush(RESERVATIONS.map((r) => (r.id === 1 ? { ...r, status: 'VALIDATED' } : r)));

    expect(component.busyId()).toBeNull();
    expect(component.counts().COMPLETED).toBe(0);
  });

  it('affiche une erreur si la validation est refusée (ex. 409 chevauchement)', () => {
    component.validate(RESERVATIONS[0]);
    http
      .expectOne(`${URL}/1/validate`)
      .flush({ message: 'Déjà réservé' }, { status: 409, statusText: 'Conflict' });

    expect(component.error()).toContain('Validation impossible');
    expect(component.busyId()).toBeNull();
  });

  it('ne rejette rien si le propriétaire annule la confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.reject(RESERVATIONS[0]);

    http.expectNone(`${URL}/1/reject`);
  });

  it('rejette après confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.reject(RESERVATIONS[0]);

    http.expectOne(`${URL}/1/reject`).flush({ ...RESERVATIONS[0], status: 'REJECTED' });
    http.expectOne(URL).flush([]);
  });

  it('calcule le nombre de nuits (départ exclu)', () => {
    expect(component.nights(RESERVATIONS[0])).toBe(7);
  });

  afterEach(() => vi.restoreAllMocks());
});
