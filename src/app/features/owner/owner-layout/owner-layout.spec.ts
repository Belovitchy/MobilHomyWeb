import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { OwnerLayout } from './owner-layout';

describe('OwnerLayout', () => {
  let fixture: ComponentFixture<OwnerLayout>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerLayout],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OwnerLayout);
  });

  afterEach(() => http.verify());

  it('ajoute les liens utiles du propriétaire à son menu (nouvel onglet)', () => {
    http.expectOne(`${environment.apiUrl}/owner/links`).flush([
      { id: 1, name: 'Extranet Booking', url: 'https://admin.booking.com/' },
      { id: 2, name: 'Déclaration Siblu', url: 'https://www.siblu.fr/' },
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a[href="https://www.siblu.fr/"]')?.getAttribute('target')).toBe('_blank');
    expect(el.textContent).toContain('Extranet Booking');
    expect(el.textContent).toContain('Gérer mes liens');
  });

  it('garde un menu utilisable si les liens ne se chargent pas', () => {
    http.expectOne(`${environment.apiUrl}/owner/links`).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Demandes');
  });
});
