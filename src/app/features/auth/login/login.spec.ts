import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('n’appelle pas l’API si l’email est invalide', () => {
    component.form.setValue({ login: 'pas-un-email', password: 'x' });

    component.submit();

    http.expectNone(`${environment.apiUrl}/auth/login`);
  });

  it('redirige un propriétaire vers son espace après connexion', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.form.setValue({ login: 'dupont@mail.fr', password: 'owner' });

    component.submit();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ token: 'h.p.s', userId: 2, firstname: 'Paul', name: 'Dupont', authority: 'OWNER' });

    expect(navigate).toHaveBeenCalledWith('/owner');
  });

  it('affiche « Identifiants incorrects » et réactive le bouton en cas d’échec', () => {
    component.form.setValue({ login: 'dupont@mail.fr', password: 'faux' });

    component.submit();
    expect(component.loading()).toBe(true);
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(component.error()).toBe('Identifiants incorrects.');
    expect(component.loading()).toBe(false);
  });

  it('redirige un vacancier vers son espace « mon compte »', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.form.setValue({ login: 'julie@mail.fr', password: 'vacationer' });

    component.submit();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ token: 'h.p.s', userId: 7, firstname: 'Julie', name: 'Martin', authority: 'VACATIONER' });

    expect(navigate).toHaveBeenCalledWith('/mon-compte-vacationer');
  });

  it('explique un compte suspendu (message du back)', () => {
    component.form.setValue({ login: 'petit@mail.fr', password: 'owner' });

    component.submit();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ message: "Compte suspendu — contactez l'administrateur" }, { status: 403, statusText: 'Forbidden' });

    expect(component.error()).toContain('Compte suspendu');
  });
});
