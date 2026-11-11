import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ManagerInfo } from '../../../core/models/manager.models';
import { ManagerList } from './manager-list';

const URL = `${environment.apiUrl}/owner/managers`;
const MARC: ManagerInfo = { id: 5, firstname: 'Marc', name: 'Durand', phone: '0600000002', email: 'marc@mail.fr' };

describe('ManagerList (gérants du propriétaire)', () => {
  let fixture: ComponentFixture<ManagerList>;
  let component: ManagerList;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ManagerList);
    component = fixture.componentInstance;
    http.expectOne(URL).flush([MARC]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function fill(password: string): void {
    component.form.patchValue({
      first_name: 'Léa',
      last_name: 'Petit',
      email: 'Lea@Mail.FR', // majuscules acceptées, normalisées en minuscules à l'envoi
      phone: '06 11 22 33 44',
      password,
    });
  }

  it('refuse un email entouré d’espaces (Validators.email)', () => {
    component.startCreate();
    fill('motdepasse8');
    component.form.patchValue({ email: ' lea@mail.fr ' });

    expect(component.form.controls.email.invalid).toBe(true);
  });

  it('affiche les gérants chargés', () => {
    expect(fixture.nativeElement.textContent).toContain('Durand');
  });

  describe('création', () => {
    beforeEach(() => component.startCreate());

    it('exige un mot de passe provisoire de 8 caractères (règle du back)', () => {
      fill('court');
      component.save();

      expect(component.form.controls.password.invalid).toBe(true);
      http.expectNone(URL);
    });

    it('exige un téléphone (règle du back)', () => {
      fill('motdepasse8');
      component.form.patchValue({ phone: '' });
      component.save();

      http.expectNone(URL);
    });

    it('envoie le gérant avec son mot de passe et un email normalisé', () => {
      fill('motdepasse8');
      component.save();

      const req = http.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        firstname: 'Léa',
        name: 'Petit',
        email: 'lea@mail.fr',
        phone: '06 11 22 33 44',
        password: 'motdepasse8',
      });
      req.flush({ ...MARC, id: 6 });
      http.expectOne(URL).flush([MARC]); // rechargement de la liste

      expect(component.formOpen()).toBe(false);
    });

    it('signale un email déjà utilisé (409)', () => {
      fill('motdepasse8');
      component.save();

      http.expectOne(URL).flush({ message: 'Email déjà utilisé' }, { status: 409, statusText: 'Conflict' });

      expect(component.error()).toContain('email déjà utilisé');
      expect(component.formOpen()).toBe(true);
    });
  });

  describe('modification', () => {
    beforeEach(() => component.startEdit(MARC));

    it('n’exige pas de mot de passe et ne l’envoie pas', () => {
      expect(component.isCreate()).toBe(false);
      expect(component.form.valid).toBe(true);

      component.save();

      const req = http.expectOne(`${URL}/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).not.toHaveProperty('password');
      req.flush(MARC);
      http.expectOne(URL).flush([MARC]);
    });
  });
});
