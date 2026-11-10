import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Account } from '../../../core/models/account.models';
import { Authority } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileComponent } from './profile';

const PAUL: Account = { id: 2, firstname: 'Paul', name: 'Dupont', email: 'dupont@mail.fr', phone: '0600000001' };

/** Écran « Mon compte » partagé : la route API dépend du rôle connecté. */
describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let http: HttpTestingController;
  let logout: ReturnType<typeof vi.fn>;

  async function create(authority: Authority): Promise<void> {
    logout = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: () => ({ authority }), logout } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit → GET du profil
  }

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('propriétaire : charge /api/owner/account et pré-remplit le formulaire', async () => {
    await create('OWNER');

    http.expectOne(`${environment.apiUrl}/owner/account`).flush(PAUL);

    expect(component.form.getRawValue()).toEqual({
      firstname: 'Paul',
      name: 'Dupont',
      email: 'dupont@mail.fr',
      phone: '0600000001',
    });
  });

  it('vacancier : charge /api/vacationer/account', async () => {
    await create('VACATIONER');

    http.expectOne(`${environment.apiUrl}/vacationer/account`).flush({ ...PAUL, reservations: [] });

    expect(component.account()?.email).toBe('dupont@mail.fr');
  });

  it('enregistre les infos perso en PUT (l’email n’est pas envoyé, il a son propre formulaire)', async () => {
    await create('OWNER');
    http.expectOne(`${environment.apiUrl}/owner/account`).flush(PAUL);

    component.form.patchValue({ phone: ' 0611223344 ' });
    component.saveProfile();

    const req = http.expectOne(`${environment.apiUrl}/owner/account`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ firstname: 'Paul', name: 'Dupont', phone: '0611223344' });
    req.flush(PAUL);
    expect(component.saved()).toBe('Profil mis à jour.');
  });

  it('après un changement de mot de passe : déconnexion et retour au login', async () => {
    await create('OWNER');
    http.expectOne(`${environment.apiUrl}/owner/account`).flush(PAUL);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.passwordForm.setValue({ currentPassword: 'owner', newPassword: 'nouveau-mdp', confirm: 'nouveau-mdp' });
    component.savePassword();
    http.expectOne(`${environment.apiUrl}/owner/account/password`).flush(PAUL);

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'password-changed' } });
  });

  it('mot de passe actuel faux (403) : message clair, pas de déconnexion', async () => {
    await create('OWNER');
    http.expectOne(`${environment.apiUrl}/owner/account`).flush(PAUL);

    component.passwordForm.setValue({ currentPassword: 'faux', newPassword: 'nouveau-mdp', confirm: 'nouveau-mdp' });
    component.savePassword();
    http
      .expectOne(`${environment.apiUrl}/owner/account/password`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(component.error()).toBe('Mot de passe actuel incorrect.');
    expect(logout).not.toHaveBeenCalled();
  });

  it('n’envoie pas un nouveau mot de passe différent de sa confirmation', async () => {
    await create('OWNER');
    http.expectOne(`${environment.apiUrl}/owner/account`).flush(PAUL);

    component.passwordForm.setValue({ currentPassword: 'owner', newPassword: 'nouveau-mdp', confirm: 'autre-mdp' });
    component.savePassword();

    http.expectNone(`${environment.apiUrl}/owner/account/password`);
  });
});
