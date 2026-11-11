import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminOwner } from '../../../core/models/admin.models';
import { AdminOwners } from './admin-owners';

const URL = `${environment.apiUrl}/admin/owners`;
const DUPONT: AdminOwner = {
  id: 2, firstname: 'Paul', name: 'Dupont', email: 'dupont@mail.fr', phone: '0600000001',
  enabled: true, mobilhomes_count: 4, reservations_count: 22,
};
const PETIT: AdminOwner = {
  id: 4, firstname: 'Marc', name: 'Petit', email: 'petit@mail.fr', phone: null,
  enabled: false, mobilhomes_count: 0, reservations_count: 0,
};

describe('AdminOwners', () => {
  let fixture: ComponentFixture<AdminOwners>;
  let component: AdminOwners;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOwners],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminOwners);
    component = fixture.componentInstance;
    http.expectOne(URL).flush([DUPONT, PETIT]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  const row = (id: number) =>
    (fixture.nativeElement as HTMLElement).querySelector(`tr[data-id="${id}"]`) as HTMLElement;

  it('affiche le statut et l’action adaptée à chaque compte', () => {
    expect(row(2).textContent).toContain('Actif');
    expect(row(2).textContent).toContain('Suspendre');
    expect(row(4).textContent).toContain('Suspendu');
    expect(row(4).textContent).toContain('Réactiver');
  });

  it('suspend après confirmation et met la ligne à jour', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.toggle(DUPONT);
    http.expectOne(`${URL}/2/suspend`).flush({ ...DUPONT, enabled: false });
    fixture.detectChanges();

    expect(row(2).textContent).toContain('Suspendu');
  });

  it('ne fait rien si l’administrateur renonce', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.toggle(DUPONT);

    http.expectNone(`${URL}/2/suspend`);
  });

  it('exige un mot de passe provisoire de 8 caractères', () => {
    component.openForm();
    component.form.setValue({ firstname: 'Anne', name: 'Roy', email: 'roy@mail.fr', phone: '', password: 'court' });

    component.save();

    http.expectNone((r) => r.method === 'POST');
    expect(component.form.controls.password.invalid).toBe(true);
  });

  it('crée le compte (email normalisé) puis recharge la liste', () => {
    component.openForm();
    component.form.setValue({ firstname: ' Anne ', name: 'Roy', email: 'Anne.Roy@Mail.fr', phone: '', password: 'provisoire8' });

    component.save();

    const req = http.expectOne((r) => r.method === 'POST' && r.url === URL);
    expect(req.request.body).toEqual({
      firstname: 'Anne', name: 'Roy', email: 'anne.roy@mail.fr', phone: '', password: 'provisoire8',
    });
    req.flush({ ...DUPONT, id: 9, firstname: 'Anne', name: 'Roy' });
    http.expectOne((r) => r.method === 'GET' && r.url === URL).flush([DUPONT, PETIT]);

    expect(component.success()).toContain('Anne Roy');
    expect(component.formOpen()).toBe(false);
  });

  it('affiche le message du back si l’email est déjà pris (409)', () => {
    component.openForm();
    component.form.setValue({ firstname: 'Paul', name: 'Dupont', email: 'dupont@mail.fr', phone: '', password: 'provisoire8' });
    component.save();

    http.expectOne((r) => r.method === 'POST').flush({ message: 'Email déjà utilisé' }, { status: 409, statusText: 'Conflict' });

    expect(component.error()).toBe('Email déjà utilisé');
  });
});
