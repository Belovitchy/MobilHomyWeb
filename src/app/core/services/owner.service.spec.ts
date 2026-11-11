import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { OwnerService } from './owner.service';

/** Vérifie le contrat HTTP avec OwnerController (méthodes, URL, paramètres, corps). */
describe('OwnerService', () => {
  const base = `${environment.apiUrl}/owner`;
  let service: OwnerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OwnerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste toutes les réservations sans filtre', () => {
    service.reservations().subscribe();

    const req = http.expectOne((r) => r.url === `${base}/reservations`);
    expect(req.request.params.has('status')).toBe(false);
    req.flush([]);
  });

  it('filtre les réservations par statut', () => {
    service.reservations('COMPLETED').subscribe();

    const req = http.expectOne((r) => r.url === `${base}/reservations`);
    expect(req.request.params.get('status')).toBe('COMPLETED');
    req.flush([]);
  });

  it('valide et refuse une demande en PUT sur son id', () => {
    service.validate(7).subscribe();
    service.reject(8).subscribe();

    const validate = http.expectOne(`${base}/reservations/7/validate`);
    const reject = http.expectOne(`${base}/reservations/8/reject`);
    expect(validate.request.method).toBe('PUT');
    expect(reject.request.method).toBe('PUT');
    validate.flush({});
    reject.flush({});
  });

  it('enregistre le n° Siblu en PUT /reservations/{id}/siblu-ref', () => {
    service.updateSibluRef(4, 'SBLU-RES-10421').subscribe();

    const req = http.expectOne(`${base}/reservations/4/siblu-ref`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ siblu_ref: 'SBLU-RES-10421' });
    req.flush({});
  });

  it('réservations externes : POST création, PUT details, PUT cancel', () => {
    const occupants = [{ firstname: 'Marie', name: 'Blanc', age: 40 }];
    service
      .createExternalReservation({
        mobil_home_id: 10,
        source: 'BOOKING',
        guest_name: 'Marie Blanc',
        guest_phone: '',
        start_date: '2027-07-01',
        end_date: '2027-07-08',
        immat: 'MB-123-BK',
        occupants,
      })
      .subscribe();
    service.updateReservationDetails(5, { guest_name: 'Marie Blanc', guest_phone: '', immat: '', occupants }).subscribe();
    service.cancelExternalReservation(5).subscribe();

    const create = http.expectOne((r) => r.method === 'POST' && r.url === `${base}/reservations`);
    expect(create.request.body.source).toBe('BOOKING');
    const details = http.expectOne(`${base}/reservations/5/details`);
    expect(details.request.method).toBe('PUT');
    expect(details.request.body.occupants).toEqual(occupants);
    const cancel = http.expectOne(`${base}/reservations/5/cancel`);
    expect(cancel.request.method).toBe('PUT');
    [create, details, cancel].forEach((r) => r.flush({}));
  });

  it('liens utiles : CRUD sur /links', () => {
    const input = { name: 'Déclaration Siblu', url: 'https://www.siblu.fr/' };
    service.links().subscribe();
    service.createLink(input).subscribe();
    service.updateLink(3, input).subscribe();
    service.deleteLink(3).subscribe();

    expect(http.expectOne((r) => r.method === 'GET' && r.url === `${base}/links`)).toBeTruthy();
    const post = http.expectOne((r) => r.method === 'POST' && r.url === `${base}/links`);
    expect(post.request.body).toEqual(input);
    expect(http.expectOne((r) => r.method === 'PUT' && r.url === `${base}/links/3`)).toBeTruthy();
    expect(http.expectOne((r) => r.method === 'DELETE' && r.url === `${base}/links/3`)).toBeTruthy();
    http.match(() => true).forEach((r) => r.flush(null));
  });

  it('envoie le fichier en multipart (champ "file") pour l’upload de photo', () => {
    const file = new File(['png'], 'oceane.png', { type: 'image/png' });
    let path = '';

    service.uploadImage(file).subscribe((res) => (path = res.path));

    const req = http.expectOne(`${base}/images`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('file')).toBe(file);
    // Pas de Content-Type forcé : le navigateur doit ajouter la "boundary" du multipart.
    expect(req.request.headers.has('Content-Type')).toBe(false);
    req.flush({ path: '/images/abc.png' });

    expect(path).toBe('/images/abc.png');
  });

  it('filtre le calendrier sur un mobil-home', () => {
    service.calendarEvents(3).subscribe();

    const req = http.expectOne((r) => r.url === `${base}/calendar`);
    expect(req.request.params.get('mobilHomeId')).toBe('3');
    req.flush([]);
  });

  it('supprime un mobil-home en DELETE', () => {
    service.deleteMobilHome(10).subscribe();

    const req = http.expectOne(`${base}/mobilhomes/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
