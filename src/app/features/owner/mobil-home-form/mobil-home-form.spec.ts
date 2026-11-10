import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../environments/environment';
import { ManagerInfo } from '../../../core/models/manager.models';
import { OwnerMobilHome } from '../../../core/models/mobilhome.models';
import { MobilHomeForm } from './mobil-home-form';

const BASE = `${environment.apiUrl}/owner`;
const MANAGERS: ManagerInfo[] = [
  { id: 5, firstname: 'Marc', name: 'Durand', phone: '0600000002', email: 'marc@mail.fr' },
];
const OCEANE: OwnerMobilHome = {
  id: 10,
  title: 'Océane',
  description: '3 chambres',
  location: 'La Réserve',
  address: 'Rue du Lac',
  postal_code: '17390',
  department: '17',
  capacity: 6,
  price: 80,
  ical_link: null,
  manager_id: 5,
  manager_name: 'Marc Durand',
  images: ['/images/oceane-1.webp'],
};

/** Simule la sélection de fichiers dans l'<input type="file">. */
function fileEvent(...files: File[]): Event {
  return { target: { files, value: 'C:\\fakepath\\x' } } as unknown as Event;
}

describe('MobilHomeForm', () => {
  let harness: RouterTestingHarness;
  let component: MobilHomeForm;
  let http: HttpTestingController;

  /** Ouvre le formulaire via le vrai routeur, comme dans l'application (mêmes routes que app.routes.ts). */
  async function create(url: string): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'owner/mobil-homes/nouveau', component: MobilHomeForm },
          { path: 'owner/mobil-homes/:id', component: MobilHomeForm },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl(url, MobilHomeForm);
    http.expectOne(`${BASE}/managers`).flush(MANAGERS); // liste déroulante des gérants
  }

  function fillValidForm(): void {
    component.form.patchValue({
      title: '  Azur  ',
      description: '2 chambres',
      location: 'Le Bois Soleil',
      manager_id: 5,
      address: 'Rue des Pins',
      postal_code: '17110',
      department: '17',
      capacity: 4,
      price: 100,
    });
  }

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('création', () => {
    beforeEach(async () => {
      await create('/owner/mobil-homes/nouveau');
      harness.detectChanges();
    });

    it('propose les gérants du propriétaire dans la liste déroulante', () => {
      const options = Array.from(
        harness.routeNativeElement!.querySelectorAll<HTMLOptionElement>('#manager_id option'),
      ).map((o) => o.textContent?.trim());
      expect(options).toEqual(['Aucun gérant', 'Marc Durand']);
    });

    it('n’envoie rien tant que le formulaire est invalide (camping obligatoire)', () => {
      fillValidForm();
      component.form.patchValue({ location: '' });

      component.save();

      http.expectNone(`${BASE}/mobilhomes`);
      expect(component.form.controls.location.touched).toBe(true);
    });

    it('envoie le camping et le gérant au back, puis revient à la liste', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      fillValidForm();

      component.save();

      const req = http.expectOne(`${BASE}/mobilhomes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({
        title: 'Azur', // espaces retirés
        location: 'Le Bois Soleil',
        manager_id: 5,
        postal_code: '17110',
        capacity: 4,
        price: 100,
        images: [],
      });
      req.flush({ ...OCEANE, id: 11 });

      expect(navigate).toHaveBeenCalledWith(['/owner/mobil-homes']);
    });

    it('affiche une erreur si le back refuse l’enregistrement', () => {
      fillValidForm();
      component.save();

      http.expectOne(`${BASE}/mobilhomes`).flush(null, { status: 400, statusText: 'Bad Request' });

      expect(component.error()).toContain('Enregistrement impossible');
      expect(component.saving()).toBe(false);
    });
  });

  describe('upload de photos', () => {
    beforeEach(async () => {
      await create('/owner/mobil-homes/nouveau');
      harness.detectChanges();
    });

    it('refuse côté client un fichier qui n’est pas une image, sans appeler le back', () => {
      component.onFilesSelected(fileEvent(new File(['%PDF'], 'contrat.pdf', { type: 'application/pdf' })));

      http.expectNone(`${BASE}/images`);
      expect(component.error()).toContain('contrat.pdf');
    });

    it('refuse une image de plus de 5 Mo', () => {
      const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grosse.jpg', { type: 'image/jpeg' });

      component.onFilesSelected(fileEvent(big));

      http.expectNone(`${BASE}/images`);
      expect(component.error()).toContain('5 Mo');
    });

    it('téléverse les photos une par une et ajoute leurs chemins au formulaire', () => {
      const a = new File(['a'], 'a.png', { type: 'image/png' });
      const b = new File(['b'], 'b.webp', { type: 'image/webp' });

      component.onFilesSelected(fileEvent(a, b));
      expect(component.uploading()).toBe(true);

      // Séquentiel : la 2e requête ne part qu'après la réponse à la 1re.
      http.expectOne(`${BASE}/images`).flush({ path: '/images/a.png' });
      http.expectOne(`${BASE}/images`).flush({ path: '/images/b.webp' });

      expect(component.imageRows.getRawValue()).toEqual(['/images/a.png', '/images/b.webp']);
      expect(component.uploading()).toBe(false);
    });

    it('affiche le message du back si l’upload est refusé', () => {
      component.onFilesSelected(fileEvent(new File(['x'], 'x.png', { type: 'image/png' })));

      http
        .expectOne(`${BASE}/images`)
        .flush({ message: 'Format non accepté' }, { status: 400, statusText: 'Bad Request' });

      expect(component.error()).toBe('Format non accepté');
      expect(component.uploading()).toBe(false);
    });

    it('construit l’URL d’affichage : chemin du back préfixé, URL https conservée', () => {
      expect(component.imageSrc('/images/a.png')).toBe(`${environment.apiOrigin}/images/a.png`);
      expect(component.imageSrc('https://cdn.test/a.png')).toBe('https://cdn.test/a.png');
    });
  });

  describe('modification', () => {
    beforeEach(async () => {
      await create('/owner/mobil-homes/10');
      http.expectOne(`${BASE}/mobilhomes`).flush([OCEANE]);
      harness.detectChanges();
    });

    it('pré-remplit le formulaire, y compris le camping, le gérant et les photos', () => {
      expect(component.id()).toBe(10);
      expect(component.form.getRawValue()).toMatchObject({
        title: 'Océane',
        location: 'La Réserve',
        manager_id: 5,
        images: ['/images/oceane-1.webp'],
      });
    });

    it('enregistre en PUT sur l’id du mobil-home', () => {
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      component.save();

      const req = http.expectOne(`${BASE}/mobilhomes/10`);
      expect(req.request.method).toBe('PUT');
      req.flush(OCEANE);
    });
  });
});
