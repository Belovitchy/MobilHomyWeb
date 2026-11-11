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
  { id: 2, mobil_home_id: 10, start_date: '2027-08-01', end_date: '2027-08-08', status: 'VALIDATED', immat: 'TB-404-RN', siblu_ref: null },
  { id: 6, mobil_home_id: 11, start_date: '2027-09-01', end_date: '2027-09-08', status: 'VALIDATED', immat: 'CA-512-PT', siblu_ref: 'SBLU-RES-1' },
  { id: 7, mobil_home_id: 10, start_date: '2027-10-01', end_date: '2027-10-08', status: 'VALIDATED', source: 'BOOKING', occupant_name: 'Kevin Laurent', guest_phone: '0612121212', immat: null, siblu_ref: null, occupants: [] },
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
    expect(component.counts()).toEqual({ COMPLETED: 1, VALIDATED: 3, PENDING: 1, ARCHIVED: 2 });
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

  describe('déclaration camping (plaque + n° Siblu)', () => {
    beforeEach(() => {
      component.setFilter('VALIDATED');
      fixture.detectChanges();
    });

    const block = (id: number) =>
      fixture.nativeElement.querySelector(`[data-siblu="${id}"]`) as HTMLElement | null;

    it('affiche la plaque et signale les séjours validés sans n° Siblu', () => {
      expect(fixture.nativeElement.textContent).toContain('TB-404-RN');
      expect(component.needsSiblu(RESERVATIONS[1])).toBe(true);
      expect(block(2)!.textContent).toContain('Déclaration camping à faire');
      expect(block(6)!.textContent).toContain('SBLU-RES-1');
    });

    it('pas de saisie Siblu sur une demande non validée', () => {
      component.setFilter('COMPLETED');
      fixture.detectChanges();
      expect(block(1)).toBeNull();
    });

    it('enregistre le n° saisi et met la ligne à jour sans recharger la liste', () => {
      component.startSiblu(RESERVATIONS[1]);
      component.sibluDraft.set('  SBLU-RES-777 ');
      component.saveSiblu(RESERVATIONS[1]);

      const req = http.expectOne(`${URL}/2/siblu-ref`);
      expect(req.request.body).toEqual({ siblu_ref: 'SBLU-RES-777' });
      req.flush({ ...RESERVATIONS[1], siblu_ref: 'SBLU-RES-777' });

      expect(component.sibluEditId()).toBeNull();
      expect(component.reservations().find((r) => r.id === 2)?.siblu_ref).toBe('SBLU-RES-777');
    });

    it('refuse un n° invalide sans appeler le back', () => {
      component.startSiblu(RESERVATIONS[1]);
      component.sibluDraft.set('<script>');
      component.saveSiblu(RESERVATIONS[1]);

      http.expectNone(`${URL}/2/siblu-ref`);
      expect(component.sibluError()).toContain('invalide');
    });
  });

  describe('réservations externes (Booking…)', () => {
    beforeEach(() => {
      component.setFilter('VALIDATED');
      fixture.detectChanges();
    });

    const card = (id: number) =>
      (fixture.nativeElement as HTMLElement).querySelector(`[data-siblu="${id}"]`)!.closest('article') as HTMLElement;

    it('affiche la plateforme, le téléphone du client et ce qui manque pour la déclaration', () => {
      expect(card(7).querySelector('[data-source="BOOKING"]')?.textContent).toContain('Booking');
      expect(card(7).textContent).toContain('0612121212');
      expect(component.missingForDeclaration(RESERVATIONS[3])).toEqual(['plaque', 'occupants']);
      expect(card(7).textContent).toContain('à compléter d');
    });

    it('propose « Client et occupants » seulement pour les réservations externes', () => {
      expect(card(7).querySelector('a[href="/owner/requests/7/details"]')).not.toBeNull();
      expect(card(2).textContent).not.toContain('Client et occupants');
    });

    it('annule une réservation externe après confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.cancelExternal(RESERVATIONS[3]);

      http.expectOne(`${URL}/7/cancel`).flush({ ...RESERVATIONS[3], status: 'CANCELLED' });
      http.expectOne(URL).flush(RESERVATIONS);
    });
  });

  it('affiche l’âge des occupants en années (et non comme une date)', () => {
    const withOccupants = { ...RESERVATIONS[0], occupants: [{ firstname: 'Léo', name: 'Martin', age: 10 }] };
    component.reservations.set([withOccupants]);
    component.toggle(1);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('10 ans');
    expect(fixture.nativeElement.textContent).not.toContain('1970');
  });

  it('calcule le nombre de nuits (départ exclu)', () => {
    expect(component.nights(RESERVATIONS[0])).toBe(7);
  });

  afterEach(() => vi.restoreAllMocks());
});
