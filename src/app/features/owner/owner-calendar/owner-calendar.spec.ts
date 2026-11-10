import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OwnerCalendar } from './owner-calendar';

describe('OwnerCalendar', () => {
  let component: OwnerCalendar;
  let fixture: ComponentFixture<OwnerCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCalendar],
      // Le composant (ou un enfant) injecte HttpClient / Router : sans eux, la création échoue.
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
