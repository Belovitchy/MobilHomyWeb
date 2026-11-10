import { ReservationStatus } from './reservation.models';

export type EventSource = 'INTERNAL' | 'ICAL';

export interface CalendarEvent {
  id?: number;
  mobil_home_id: number;
  start: string; // yyyy-MM-dd
  end: string; // yyyy-MM-dd
  label: string;
  status?: ReservationStatus;
  source: EventSource;
}
