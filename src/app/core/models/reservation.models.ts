import { ManagerInfo } from './manager.models';
import { Occupant, OccupantPayload } from './occupant.models';

export type ReservationStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: number;
  mobilhomeName: string;
  location: string;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  immat: string;
  occupants: Occupant[];
  manager: ManagerInfo | null;
}

export interface MyReservation {
  id: number;
  mobilhomeName: string;
  location: string;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  contractId?: number;
  contractSigned?: boolean;
  // Renseignés par le back UNIQUEMENT si confirmée (RG-07)
  managerFirstname?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
}

/** Payload de mise à jour/complétion d'une résa PENDING */
export interface ReservationUpdate {
  immat: string;
  occupants: { firstname: string; name: string; age: number }[];
}

export interface ReservationPayload {
  mobilhome_id: number;
  start_date: string; // yyyy-MM-dd
  end_date: string;
  immat: string;
  occupants: OccupantPayload[];
}
