import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { OwnerDashboard } from './dashboard';

describe('OwnerDashboard', () => {
  const base = `${environment.apiUrl}/owner`;
  let component: OwnerDashboard;
  let fixture: ComponentFixture<OwnerDashboard>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OwnerDashboard);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  it('charge mobil-homes et réservations en parallèle', () => {
    http.expectOne(`${base}/mobilhomes`).flush([]);
    http.expectOne(`${base}/reservations`).flush([]);
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('affiche une erreur si l’un des deux appels échoue', () => {
    const homes = http.expectOne(`${base}/mobilhomes`);
    const resas = http.expectOne(`${base}/reservations`);

    homes.flush(null, { status: 500, statusText: 'Server Error' });

    // forkJoin abandonne l'autre requête dès la première erreur.
    expect(resas.cancelled).toBe(true);

    expect(component.error()).toContain('Impossible de charger');
    expect(component.loading()).toBe(false);
  });
});
