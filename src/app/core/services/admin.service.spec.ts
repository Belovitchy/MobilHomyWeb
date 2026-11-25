import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const base = `${environment.apiUrl}/admin`;
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lit les indicateurs et les propriétaires en GET', () => {
    service.stats().subscribe();
    service.owners().subscribe();

    expect(http.expectOne(`${base}/stats`).request.method).toBe('GET');
    expect(http.expectOne(`${base}/owners`).request.method).toBe('GET');
  });

  it('crée un propriétaire en POST', () => {
    const input = { firstname: 'Anne', name: 'Roy', email: 'roy@mail.fr', phone: '', password: 'provisoire8' };
    service.createOwner(input).subscribe();

    const req = http.expectOne(`${base}/owners`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
  });

  it('suspend et réactive via des routes distinctes (PUT)', () => {
    service.setEnabled(4, false).subscribe();
    service.setEnabled(4, true).subscribe();

    expect(http.expectOne(`${base}/owners/4/suspend`).request.method).toBe('PUT');
    expect(http.expectOne(`${base}/owners/4/reactivate`).request.method).toBe('PUT');
  });
});
