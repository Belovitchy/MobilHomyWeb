import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Authority } from '../models/auth.models';
import { AccountService } from './account.service';
import { AuthService } from './auth.service';

describe('AccountService', () => {
  let authority: Authority | null;
  let service: AccountService;
  let http: HttpTestingController;

  beforeEach(() => {
    authority = null;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // currentUser() est lu à chaque appel : changer `authority` simule un autre utilisateur.
        {
          provide: AuthService,
          useValue: { currentUser: () => (authority ? { authority } : null) },
        },
      ],
    });
    service = TestBed.inject(AccountService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('un propriétaire lit son profil sur /api/owner/account', () => {
    authority = 'OWNER';
    service.getAccount().subscribe();

    const req = http.expectOne(`${environment.apiUrl}/owner/account`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 2, firstname: 'Paul', name: 'Dupont', email: 'dupont@mail.fr', phone: null });
  });

  it('un vacancier lit son profil sur /api/vacationer/account', () => {
    authority = 'VACATIONER';
    service.getAccount().subscribe();

    http.expectOne(`${environment.apiUrl}/vacationer/account`).flush({});
  });

  it('changements d’email et de mot de passe : PUT sur les sous-routes du bon rôle', () => {
    authority = 'OWNER';
    service.updateEmail({ newEmail: 'paul@mail.fr', currentPassword: 'owner' }).subscribe();
    service.updatePassword({ currentPassword: 'owner', newPassword: 'nouveau-mdp' }).subscribe();

    const email = http.expectOne(`${environment.apiUrl}/owner/account/email`);
    const password = http.expectOne(`${environment.apiUrl}/owner/account/password`);
    expect(email.request.method).toBe('PUT');
    expect(password.request.body).toEqual({ currentPassword: 'owner', newPassword: 'nouveau-mdp' });
    email.flush(null);
    password.flush(null);
  });

  it('refuse d’appeler l’API sans utilisateur connecté', () => {
    expect(() => service.getAccount()).toThrow();
  });

  it('refuse un rôle qui n’a pas (encore) d’espace « mon compte »', () => {
    authority = 'ADMIN';
    expect(() => service.getAccount()).toThrow(/ADMIN/);
  });
});
