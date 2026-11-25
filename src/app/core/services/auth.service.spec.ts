import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/auth.models';
import { AuthService } from './auth.service';

/** Fabrique un JWT factice (le front ne vérifie pas la signature) qui expire dans `seconds` secondes. */
function fakeJwt(seconds: number): string {
  const b64url = (o: object) =>
    btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + seconds;
  return `${b64url({ alg: 'HS256' })}.${b64url({ sub: 'dupont@mail.fr', exp })}.signature`;
}

const OWNER_LOGIN: LoginResponse = {
  token: fakeJwt(3600),
  userId: 2,
  firstname: 'Paul',
  name: 'Dupont',
  authority: 'OWNER',
};

describe('AuthService', () => {
  let http: HttpTestingController;

  /** Le service lit le localStorage à sa construction : on l'injecte APRÈS avoir préparé le stockage. */
  function createService(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('login : envoie les identifiants puis mémorise le jeton et l’utilisateur', () => {
    const auth = createService();

    auth.login('dupont@mail.fr', 'owner').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ login: 'dupont@mail.fr', password: 'owner' });
    req.flush(OWNER_LOGIN);

    expect(auth.token()).toBe(OWNER_LOGIN.token);
    expect(auth.currentUser()?.firstname).toBe('Paul');
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.hasRole('OWNER')).toBe(true);
    expect(auth.hasRole('ADMIN', 'MANAGER')).toBe(false);
  });

  it('login refusé : rien n’est stocké', () => {
    const auth = createService();

    auth.login('dupont@mail.fr', 'faux').subscribe({ error: () => undefined });
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(auth.token()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('restaure la session au rechargement si le jeton est encore valide', () => {
    localStorage.setItem('mobilhomy_token', fakeJwt(3600));
    localStorage.setItem(
      'mobilhomy_user',
      JSON.stringify({ userId: 2, firstname: 'Paul', name: 'Dupont', authority: 'OWNER' }),
    );

    const auth = createService();

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.hasRole('OWNER')).toBe(true);
  });

  it('ignore une session dont le jeton est expiré', () => {
    localStorage.setItem('mobilhomy_token', fakeJwt(-60));
    localStorage.setItem(
      'mobilhomy_user',
      JSON.stringify({ userId: 2, firstname: 'Paul', name: 'Dupont', authority: 'OWNER' }),
    );

    const auth = createService();

    expect(auth.currentUser()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.hasRole('OWNER')).toBe(false);
  });

  it('ignore un jeton malformé', () => {
    localStorage.setItem('mobilhomy_token', 'pas-un-jwt');
    localStorage.setItem('mobilhomy_user', JSON.stringify({ userId: 2, authority: 'OWNER' }));

    expect(createService().isAuthenticated()).toBe(false);
  });

  it('logout : vide le stockage et l’utilisateur courant', () => {
    const auth = createService();
    auth.login('dupont@mail.fr', 'owner').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(OWNER_LOGIN);

    auth.logout();

    expect(localStorage.getItem('mobilhomy_token')).toBeNull();
    expect(localStorage.getItem('mobilhomy_user')).toBeNull();
    expect(auth.currentUser()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });
});
