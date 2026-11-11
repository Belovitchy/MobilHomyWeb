import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CalendarEvent } from '../../../core/models/calendar.models';
import { OwnerCalendar } from './owner-calendar';

const BASE = `${environment.apiUrl}/owner`;
const HOMES = [
  { id: 10, title: 'Océane' },
  { id: 11, title: 'Azur' },
];
const EVENTS: CalendarEvent[] = [
  { id: 1, mobil_home_id: 10, start: '2027-07-12', end: '2027-07-19', label: 'Océane — Martin', status: 'VALIDATED', source: 'INTERNAL' },
  { id: 2, mobil_home_id: 11, start: '2027-07-12', end: '2027-07-19', label: 'Azur — Garcia', status: 'COMPLETED', source: 'INTERNAL' },
  { id: 3, mobil_home_id: 11, start: '2027-08-01', end: '2027-08-08', label: 'Azur — Bernard', status: 'VALIDATED', source: 'INTERNAL' },
];

describe('OwnerCalendar', () => {
  let fixture: ComponentFixture<OwnerCalendar>;
  let component: OwnerCalendar;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCalendar],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OwnerCalendar);
    component = fixture.componentInstance;
    http.expectOne(`${BASE}/mobilhomes`).flush(HOMES);
    http.expectOne((r) => r.url === `${BASE}/calendar`).flush(EVENTS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('n’affiche qu’un mobil-home à la fois : le premier par défaut', () => {
    expect(component.filterHomeId()).toBe(10);
    expect(component.calendarEvents().length).toBe(1);
  });

  it('ne propose plus de vue « Tous »', () => {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button');
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).not.toContain('Tous');
    expect(labels).toEqual(expect.arrayContaining(['Océane', 'Azur']));
  });

  it('change de mobil-home et transmet le statut au calendrier (orange pour « à traiter »)', () => {
    component.setFilter(11);

    expect(component.calendarEvents()).toEqual([
      { startDate: '2027-07-12', endDate: '2027-07-19', source: 'INTERNAL', status: 'COMPLETED' },
      { startDate: '2027-08-01', endDate: '2027-08-08', source: 'INTERNAL', status: 'VALIDATED' },
    ]);
  });
});
