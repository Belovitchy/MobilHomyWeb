import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('ajoute « Authorization: Bearer <jeton> » quand l’utilisateur est connecté', () => {
    localStorage.setItem('mobilhomy_token', 'abc.def.ghi');

    http.get('/api/owner/mobilhomes').subscribe();

    const req = httpMock.expectOne('/api/owner/mobilhomes');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc.def.ghi');
    req.flush([]);
  });

  it('n’ajoute aucun en-tête pour un visiteur anonyme (routes publiques)', () => {
    http.get('/api/mobilhomes').subscribe();

    const req = httpMock.expectOne('/api/mobilhomes');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
