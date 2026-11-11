import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { OwnerLinksStore } from '../../../core/services/owner-links.store';
import { OwnerLinks } from './owner-links';

const URL = `${environment.apiUrl}/owner/links`;
const SIBLU = { id: 2, name: 'Déclaration Siblu', url: 'https://www.siblu.fr/' };
const BOOKING = { id: 1, name: 'Extranet Booking', url: 'https://admin.booking.com/' };

describe('OwnerLinks (CRUD des liens utiles)', () => {
  let fixture: ComponentFixture<OwnerLinks>;
  let component: OwnerLinks;
  let http: HttpTestingController;
  let store: OwnerLinksStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerLinks],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(OwnerLinksStore);
    store.load(); // fait par OwnerLayout dans l'application
    http.expectOne(URL).flush([BOOKING, SIBLU]);

    fixture = TestBed.createComponent(OwnerLinks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('liste les liens, chacun ouvrable dans un nouvel onglet', () => {
    const a = (fixture.nativeElement as HTMLElement).querySelector('li[data-id="2"] a');
    expect(a?.getAttribute('href')).toBe('https://www.siblu.fr/');
    expect(a?.getAttribute('target')).toBe('_blank');
  });

  it('refuse une URL qui n’est pas en http(s) (ex. javascript:)', () => {
    component.startCreate();
    component.form.setValue({ name: 'Piège', url: 'javascript:alert(1)' });

    component.save();

    expect(component.form.controls.url.invalid).toBe(true);
    http.expectNone(URL);
  });

  it('ajoute un lien : il apparaît aussitôt (le menu partage le même store), trié par nom', () => {
    component.startCreate();
    component.form.setValue({ name: ' Abritel ', url: 'https://www.abritel.fr/ ' });
    component.save();

    const req = http.expectOne((r) => r.method === 'POST' && r.url === URL);
    expect(req.request.body).toEqual({ name: 'Abritel', url: 'https://www.abritel.fr/' });
    req.flush({ id: 3, name: 'Abritel', url: 'https://www.abritel.fr/' });

    expect(store.links().map((l) => l.name)).toEqual(['Abritel', 'Déclaration Siblu', 'Extranet Booking']);
    expect(component.formOpen()).toBe(false);
  });

  it('modifie un lien existant en PUT', () => {
    component.startEdit(SIBLU);
    component.form.patchValue({ url: 'https://pro.siblu.fr/' });
    component.save();

    http.expectOne(`${URL}/2`).flush({ ...SIBLU, url: 'https://pro.siblu.fr/' });

    expect(store.links().find((l) => l.id === 2)?.url).toBe('https://pro.siblu.fr/');
  });

  it('supprime après confirmation, et pas sinon', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.remove(SIBLU);
    http.expectNone(`${URL}/2`);

    confirmSpy.mockReturnValue(true);
    component.remove(SIBLU);
    http.expectOne(`${URL}/2`).flush(null, { status: 204, statusText: 'No Content' });

    expect(store.links().map((l) => l.id)).toEqual([1]);
  });
});
