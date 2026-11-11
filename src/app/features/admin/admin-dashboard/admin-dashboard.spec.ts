import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdminStats } from '../../../core/models/admin.models';
import { AdminDashboard } from './admin-dashboard';

const STATS: AdminStats = {
  owners: 3,
  owners_suspended: 1,
  managers: 2,
  vacationers: 5,
  mobilhomes: 6,
  reservations: 30,
  reservations_to_process: 4,
  reservations_validated: 20,
  invoices_pending_amount: 186.5,
};

describe('AdminDashboard', () => {
  let fixture: ComponentFixture<AdminDashboard>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminDashboard);
  });

  afterEach(() => http.verify());

  const tile = (label: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-tile="${label}"]`) as HTMLElement;

  it('affiche les volumes et signale les points d’attention', () => {
    http.expectOne(`${environment.apiUrl}/admin/stats`).flush(STATS);
    fixture.detectChanges();

    expect(tile('Propriétaires').textContent).toContain('dont 1 suspendu');
    expect(tile('Propriétaires').classList).toContain('border-amber-300');
    expect(tile('Demandes à traiter').textContent).toContain('4');
    expect(tile('Factures en attente').textContent).toContain('186.50 €');
    expect(tile('Gérants').classList).not.toContain('border-amber-300');
  });

  it('affiche une erreur si les indicateurs ne se chargent pas', () => {
    http.expectOne(`${environment.apiUrl}/admin/stats`).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Impossible de charger');
  });
});
