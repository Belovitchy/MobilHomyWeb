import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Reservation } from '../../../core/models/reservation.models';
import { MyReservations } from './my-reservations';

describe('MyReservations', () => {
  let component: MyReservations;
  let fixture: ComponentFixture<MyReservations>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyReservations],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyReservations);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpTestingController.expectOne((request) => request.method === 'GET').flush([]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('n° de réservation camping (Siblu)', () => {
    const base = {
      mobilhomeName: 'Océane',
      location: 'La Réserve',
      start_date: '2027-07-12',
      end_date: '2027-07-19',
      immat: 'AA-123-BB',
      occupants: [],
      manager: null,
    };

    function show(list: Reservation[]): HTMLElement {
      component.reservations.set(list);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('affiche le n° Siblu d’une réservation confirmée, avec la plaque à présenter', () => {
      const el = show([{ ...base, id: 1, status: 'VALIDATED', siblu_ref: 'SBLU-RES-10421' }]);

      expect(el.querySelector('[data-siblu]')?.textContent).toContain('SBLU-RES-10421');
      expect(el.querySelector('[data-siblu]')?.textContent).toContain('AA-123-BB');
    });

    it('indique que la déclaration est en cours tant que le propriétaire n’a pas saisi le n°', () => {
      const el = show([{ ...base, id: 1, status: 'VALIDATED', siblu_ref: null }]);

      expect(el.querySelector('[data-siblu]')?.textContent).toContain('en cours de déclaration');
    });

    it('n’affiche rien de tel pour une demande encore en attente', () => {
      const el = show([{ ...base, id: 1, status: 'COMPLETED' }]);

      expect(el.querySelector('[data-siblu]')).toBeNull();
    });
  });
});
