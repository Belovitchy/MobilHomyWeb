import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Invoice } from '../../../core/models/manager.models';
import { OwnerReservation } from '../../../core/models/reservation.models';
import { OwnerDashboard } from './dashboard';

const YEAR = new Date().getFullYear();

const invoice = (id: number, month: string, amount: number, status: Invoice['status']): Invoice => ({
  id,
  mobil_home_id: 1,
  mobil_home_title: 'Océane',
  description: `Facture ${id}`,
  amount,
  date: `${YEAR}-${month}-10`,
  category: 'SERVICE',
  status,
  manager_name: 'Marc Martin',
});

const resa = (status: OwnerReservation['status'], start: string, end: string, total: number) =>
  ({ id: 1, mobil_home_id: 1, status, start_date: start, end_date: end, total_price: total }) as OwnerReservation;

describe('OwnerDashboard', () => {
  const base = `${environment.apiUrl}/owner`;
  let component: OwnerDashboard;
  let fixture: ComponentFixture<OwnerDashboard>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OwnerDashboard);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  const load = (resas: OwnerReservation[], invoices: Invoice[]) => {
    http.expectOne(`${base}/mobilhomes`).flush([]);
    http.expectOne(`${base}/reservations`).flush(resas);
    http.expectOne(`${base}/invoices`).flush(invoices);
    fixture.detectChanges();
  };
  const el = () => fixture.nativeElement as HTMLElement;

  it('charge mobil-homes, réservations et factures en parallèle', () => {
    load([], []);

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('affiche une erreur si l’un des appels échoue', () => {
    const homes = http.expectOne(`${base}/mobilhomes`);
    const resas = http.expectOne(`${base}/reservations`);
    const invoices = http.expectOne(`${base}/invoices`);

    homes.flush(null, { status: 500, statusText: 'Server Error' });

    // forkJoin abandonne les autres requêtes dès la première erreur.
    expect(resas.cancelled).toBe(true);
    expect(invoices.cancelled).toBe(true);
    expect(component.error()).toContain('Impossible de charger');
    expect(component.loading()).toBe(false);
  });

  it('totalise les factures en attente (ISSUED uniquement)', () => {
    load([], [invoice(1, '03', 42.5, 'ISSUED'), invoice(2, '03', 28, 'ISSUED'), invoice(3, '04', 100, 'PAID')]);

    expect(component.pendingInvoices().length).toBe(2);
    expect(component.pendingInvoicesAmount()).toBe(70.5);
    expect(el().querySelector('[data-card="factures"]')?.textContent).toContain('2 facture(s)');
  });

  it('répartit les recettes par nuitée et les dépenses au mois de la facture', () => {
    load(
      [
        // 4 nuits à 100 € : 30 et 31 janvier, 1er et 2 février
        resa('VALIDATED', `${YEAR}-01-30`, `${YEAR}-02-03`, 400),
        resa('COMPLETED', `${YEAR}-05-01`, `${YEAR}-05-08`, 700), // pas encore validée
      ],
      [invoice(1, '02', 50, 'PAID'), invoice(2, '02', 30, 'ISSUED'), invoice(3, '02', 999, 'CANCELLED')],
    );

    expect(component.incomeByMonth()[0]).toBe(200);
    expect(component.incomeByMonth()[1]).toBe(200);
    expect(component.incomeByMonth()[4]).toBe(0);
    expect(component.expensesByMonth()[1]).toBe(80);
    expect(component.totalIncome()).toBe(400);
    expect(component.totalExpenses()).toBe(80);
    expect(component.balance()).toBe(320);
    expect(el().querySelectorAll('app-bar-chart rect.bar').length).toBe(24);
  });

  it('marque une facture payée et la retire de la liste à régler', () => {
    const issued = invoice(7, '03', 42.5, 'ISSUED');
    load([], [issued]);

    component.pay(issued);
    const req = http.expectOne(`${base}/invoices/7/pay`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...issued, status: 'PAID' });
    fixture.detectChanges();

    expect(component.pendingInvoices().length).toBe(0);
    expect(component.totalExpenses()).toBe(42.5); // une facture payée reste une dépense
    expect(el().querySelector('[data-section="factures-a-regler"]')).toBeNull();
  });

  it('affiche le message du serveur si le règlement est refusé', () => {
    const issued = invoice(7, '03', 42.5, 'ISSUED');
    load([], [issued]);

    component.pay(issued);
    http
      .expectOne(`${base}/invoices/7/pay`)
      .flush({ message: 'Seule une facture en attente peut être marquée payée' }, { status: 409, statusText: 'Conflict' });

    expect(component.payError()).toContain('Seule une facture en attente');
    expect(component.payingId()).toBeNull();
  });
});
