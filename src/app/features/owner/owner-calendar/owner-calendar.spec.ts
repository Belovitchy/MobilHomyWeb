import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OwnerCalendar } from './owner-calendar';

describe('OwnerCalendar', () => {
  let component: OwnerCalendar;
  let fixture: ComponentFixture<OwnerCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
