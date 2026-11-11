import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { InvoiceInput } from '../models/manager.models';
import { ManagerService } from './manager.service';

/** Contrat HTTP avec ManagerController. */
describe('ManagerService', () => {
  const base = `${environment.apiUrl}/manager`;
  let service: ManagerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ManagerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lit les séjours, les mobil-homes gérés et les factures en GET', () => {
    service.reservations().subscribe();
    service.mobilHomes().subscribe();
    service.invoices().subscribe();

    for (const path of ['reservations', 'mobilhomes', 'invoices']) {
      const req = http.expectOne(`${base}/${path}`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    }
  });

  it('crée une facture en POST avec le corps attendu par le back', () => {
    const input: InvoiceInput = {
      mobil_home_id: 10,
      category: 'SERVICE',
      description: 'Ménage',
      amount: 65,
      date: '2026-11-10',
    };

    service.createInvoice(input).subscribe();

    const req = http.expectOne(`${base}/invoices`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ ...input, id: 1, mobil_home_title: 'Océane', status: 'ISSUED' });
  });

  it('annule une facture en PUT sur /invoices/{id}/cancel', () => {
    service.cancelInvoice(7).subscribe();

    const req = http.expectOne(`${base}/invoices/7/cancel`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
