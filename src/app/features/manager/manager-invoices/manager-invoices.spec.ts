import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Invoice, ManagerMobilHome } from '../../../core/models/manager.models';
import { todayIso } from '../manager-reservations/manager-reservations';
import { ManagerInvoices } from './manager-invoices';

const BASE = `${environment.apiUrl}/manager`;
const HOMES: ManagerMobilHome[] = [
  { id: 10, title: 'Océane', location: 'La Réserve', owner_name: 'Paul Dupont' },
  { id: 11, title: 'Azur', location: 'Le Bois Soleil', owner_name: 'Paul Dupont' },
];
const INVOICES: Invoice[] = [
  { id: 1, mobil_home_id: 10, mobil_home_title: 'Océane', description: 'Ménage', amount: 65, date: '2026-07-19', category: 'SERVICE', status: 'PAID' },
  { id: 2, mobil_home_id: 11, mobil_home_title: 'Azur', description: 'Gaz', amount: 28.5, date: '2026-08-22', category: 'CONSUMABLE', status: 'ISSUED' },
  { id: 3, mobil_home_id: 11, mobil_home_title: 'Azur', description: 'Vaisselle', amount: 12, date: '2026-08-23', category: 'CONSUMABLE', status: 'ISSUED' },
  { id: 4, mobil_home_id: 10, mobil_home_title: 'Océane', description: 'Erreur', amount: 99, date: '2026-08-24', category: 'SERVICE', status: 'CANCELLED' },
];

describe('ManagerInvoices', () => {
  let fixture: ComponentFixture<ManagerInvoices>;
  let component: ManagerInvoices;
  let http: HttpTestingController;

  async function create(homes = HOMES, invoices = INVOICES): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ManagerInvoices],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ManagerInvoices);
    component = fixture.componentInstance;
    http.expectOne(`${BASE}/invoices`).flush(invoices);
    http.expectOne(`${BASE}/mobilhomes`).flush(homes);
    fixture.detectChanges();
  }

  function fillValid(): void {
    component.openForm();
    component.form.patchValue({
      mobil_home_id: 10,
      category: 'SERVICE',
      description: '  Ménage fin de séjour ',
      amount: 65.004,
      date: todayIso(),
    });
  }

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  describe('liste', () => {
    beforeEach(() => create());

    it('totalise uniquement les factures en attente de règlement', () => {
      expect(component.pendingTotal()).toBeCloseTo(40.5); // 28.5 + 12 (ni la payée ni l'annulée)
    });

    it('ne propose « Annuler » que pour les factures en attente', () => {
      const rows = (id: number) => fixture.nativeElement.querySelector(`tr[data-id="${id}"]`) as HTMLElement;
      expect(rows(2).textContent).toContain('Annuler');
      expect(rows(1).textContent).not.toContain('Annuler');
      expect(rows(4).textContent).not.toContain('Annuler');
    });
  });

  describe('saisie', () => {
    beforeEach(() => create());

    it('n’envoie rien sans mobil-home, libellé et montant', () => {
      component.openForm();
      component.save();

      http.expectNone(`${BASE}/invoices`);
      expect(component.form.controls.mobil_home_id.touched).toBe(true);
    });

    it('refuse un montant nul ou une date future (mêmes règles que le back)', () => {
      fillValid();
      component.form.patchValue({ amount: 0 });
      expect(component.form.controls.amount.invalid).toBe(true);

      component.form.patchValue({ amount: 10, date: '2999-01-01' });
      expect(component.form.controls.date.hasError('future')).toBe(true);
    });

    it('envoie la facture nettoyée puis recharge la liste', () => {
      fillValid();
      component.save();

      const req = http.expectOne((r) => r.method === 'POST' && r.url === `${BASE}/invoices`);
      expect(req.request.body).toEqual({
        mobil_home_id: 10,
        category: 'SERVICE',
        description: 'Ménage fin de séjour', // espaces retirés
        amount: 65, // arrondi à 2 décimales
        date: todayIso(),
      });
      req.flush({ ...INVOICES[1], id: 5, status: 'ISSUED' });
      http.expectOne((r) => r.method === 'GET' && r.url === `${BASE}/invoices`).flush(INVOICES);

      expect(component.success()).toBe('Facture enregistrée.');
      expect(component.formOpen()).toBe(false);
      // mobil-home et catégorie conservés pour une saisie en série
      expect(component.form.controls.mobil_home_id.value).toBe(10);
      expect(component.form.controls.description.value).toBe('');
    });

    it('affiche le message du back en cas de refus (ex. mobil-home non géré → 404)', () => {
      fillValid();
      component.save();

      http.expectOne(`${BASE}/invoices`).flush({ message: 'Mobil-home introuvable' }, { status: 404, statusText: 'Not Found' });

      expect(component.error()).toBe('Mobil-home introuvable');
      expect(component.saving()).toBe(false);
    });
  });

  describe('annulation', () => {
    beforeEach(() => create());

    it('ne fait rien si le gérant renonce', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.cancel(INVOICES[1]);

      http.expectNone(`${BASE}/invoices/2/cancel`);
    });

    it('annule après confirmation puis recharge', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.cancel(INVOICES[1]);
      http.expectOne(`${BASE}/invoices/2/cancel`).flush({ ...INVOICES[1], status: 'CANCELLED' });
      http.expectOne(`${BASE}/invoices`).flush([]);

      expect(component.busyId()).toBeNull();
    });
  });

  describe('cas particuliers', () => {
    it('présélectionne le mobil-home quand le gérant n’en a qu’un', async () => {
      await create([HOMES[0]], []);
      expect(component.form.controls.mobil_home_id.value).toBe(10);
    });

    it('explique quoi faire si aucun mobil-home n’est confié', async () => {
      await create([], []);
      expect(fixture.nativeElement.textContent).toContain('Aucun mobil-home ne t');
      expect(fixture.nativeElement.textContent).not.toContain('Nouvelle facture');
    });
  });
});
