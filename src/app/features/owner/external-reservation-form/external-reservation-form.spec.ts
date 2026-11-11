import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../environments/environment';
import { OwnerReservation } from '../../../core/models/reservation.models';
import { ExternalReservationForm } from './external-reservation-form';

const BASE = `${environment.apiUrl}/owner`;
const HOMES = [
  { id: 10, title: 'Océane', capacity: 6 },
  { id: 11, title: 'Azur', capacity: 2 },
];
const KEVIN: OwnerReservation = {
  id: 7,
  mobil_home_id: 10,
  start_date: '2027-10-01',
  end_date: '2027-10-08',
  status: 'VALIDATED',
  source: 'BOOKING',
  occupant_name: 'Kevin Laurent',
  guest_phone: null,
  immat: null,
  occupants: [{ id: 1, firstname: 'Kevin', name: 'Laurent', age: 33 }],
};

describe('ExternalReservationForm', () => {
  let harness: RouterTestingHarness;
  let component: ExternalReservationForm;
  let http: HttpTestingController;

  async function open(url: string): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'owner/requests/externe', component: ExternalReservationForm },
          { path: 'owner/requests/:id/details', component: ExternalReservationForm },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl(url, ExternalReservationForm);
  }

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('création', () => {
    beforeEach(async () => {
      await open('/owner/requests/externe');
      http.expectOne(`${BASE}/mobilhomes`).flush(HOMES);
      harness.detectChanges();
    });

    function fill(): void {
      component.form.patchValue({
        mobil_home_id: 10,
        source: 'BOOKING',
        guest_name: ' Nathalie Roux ',
        guest_phone: '0655555555',
        start_date: '2027-07-01',
        end_date: '2027-07-08',
        immat: 'nr-318-bk',
      });
    }

    it('refuse un départ avant l’arrivée', () => {
      fill();
      component.form.patchValue({ end_date: '2027-06-30' });

      expect(component.form.hasError('dates')).toBe(true);
      component.save();
      http.expectNone(`${BASE}/reservations`);
    });

    it('prévient s’il y a plus d’occupants que de couchages, sans appeler le back', () => {
      fill();
      component.form.patchValue({ mobil_home_id: 11 }); // capacité 2
      component.addOccupant();
      component.addOccupant();
      component.addOccupant();
      component.occupants.controls.forEach((o, i) => o.setValue({ firstname: 'P' + i, name: 'Roux', age: 30 }));

      expect(component.tooMany()).toBe(true);
      component.save();
      http.expectNone(`${BASE}/reservations`);
    });

    it('envoie la réservation (plaque en majuscules, occupants) puis revient aux demandes', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      fill();
      component.addOccupant();
      component.occupants.at(0).setValue({ firstname: ' Nathalie ', name: 'Roux', age: 41 });

      component.save();

      const req = http.expectOne((r) => r.method === 'POST' && r.url === `${BASE}/reservations`);
      expect(req.request.body).toEqual({
        mobil_home_id: 10,
        source: 'BOOKING',
        guest_name: 'Nathalie Roux',
        guest_phone: '0655555555',
        start_date: '2027-07-01',
        end_date: '2027-07-08',
        immat: 'NR-318-BK',
        occupants: [{ firstname: 'Nathalie', name: 'Roux', age: 41 }],
      });
      req.flush({ ...KEVIN, id: 9 });
      expect(navigate).toHaveBeenCalledWith(['/owner/requests']);
    });

    it('affiche le message du back (ex. période déjà réservée → 409)', () => {
      fill();
      component.save();

      http
        .expectOne(`${BASE}/reservations`)
        .flush({ message: 'Le mobil-home est déjà réservé' }, { status: 409, statusText: 'Conflict' });

      expect(component.error()).toBe('Le mobil-home est déjà réservé');
    });
  });

  describe('modification', () => {
    it('pré-remplit client et occupants, et fige mobil-home, plateforme et dates', async () => {
      await open('/owner/requests/7/details');
      http.expectOne(`${BASE}/mobilhomes`).flush(HOMES);
      http.expectOne(`${BASE}/reservations`).flush([KEVIN]);

      expect(component.form.controls.guest_name.value).toBe('Kevin Laurent');
      expect(component.occupants.length).toBe(1);
      expect(component.form.controls.start_date.disabled).toBe(true);
      expect(component.form.controls.mobil_home_id.disabled).toBe(true);
    });

    it('envoie seulement client, plaque et occupants en PUT /details', async () => {
      await open('/owner/requests/7/details');
      http.expectOne(`${BASE}/mobilhomes`).flush(HOMES);
      http.expectOne(`${BASE}/reservations`).flush([KEVIN]);
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      component.form.patchValue({ immat: 'kl-555-bk' });
      component.addOccupant();
      component.occupants.at(1).setValue({ firstname: 'Léa', name: 'Laurent', age: 31 });
      component.save();

      const req = http.expectOne(`${BASE}/reservations/7/details`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        guest_name: 'Kevin Laurent',
        guest_phone: '',
        immat: 'KL-555-BK',
        occupants: [
          { firstname: 'Kevin', name: 'Laurent', age: 33 },
          { firstname: 'Léa', name: 'Laurent', age: 31 },
        ],
      });
      req.flush(KEVIN);
    });

    it('refuse de modifier une réservation MobilHomy (données du vacancier)', async () => {
      await open('/owner/requests/7/details');
      http.expectOne(`${BASE}/mobilhomes`).flush(HOMES);
      http.expectOne(`${BASE}/reservations`).flush([{ ...KEVIN, source: 'MOBILHOMY' }]);

      expect(component.error()).toContain('MobilHomy');
      expect(component.reservation()).toBeNull();
    });
  });
});
