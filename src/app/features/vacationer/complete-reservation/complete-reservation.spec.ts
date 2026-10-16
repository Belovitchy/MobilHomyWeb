import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompleteReservation } from './complete-reservation';

describe('CompleteReservation', () => {
  let component: CompleteReservation;
  let fixture: ComponentFixture<CompleteReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteReservation],
    }).compileComponents();

    fixture = TestBed.createComponent(CompleteReservation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
