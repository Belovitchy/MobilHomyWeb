import { ManagerInfo } from './manager.models';
import { Occupant, OccupantPayload } from './occupant.models';

export type ReservationStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

/** Origine d'une réservation : MobilHomy, ou plateforme externe saisie par le propriétaire. */
export type ReservationSource = 'MOBILHOMY' | 'BOOKING' | 'AIRBNB' | 'ABRITEL' | 'OTHER';
export type ExternalSource = Exclude<ReservationSource, 'MOBILHOMY'>;

export const SOURCE_LABELS: Record<ReservationSource, string> = {
  MOBILHOMY: 'MobilHomy',
  BOOKING: 'Booking',
  AIRBNB: 'Airbnb',
  ABRITEL: 'Abritel',
  OTHER: 'Autre',
};

export interface Reservation {
  id: number;
  mobilhomeName: string;
  location: string;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  immat: string;
  /** N° de réservation camping Siblu — renseigné par le propriétaire, visible seulement si VALIDATED. */
  siblu_ref?: string | null;
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

export interface OwnerReservation {
  id: number;
  mobil_home_id: number;
  mobil_home_title?: string;
  start_date: string; // yyyy-MM-dd (arrivée)
  end_date: string; // yyyy-MM-dd (départ, nuit non incluse)
  status: ReservationStatus;
  /** Absent = MOBILHOMY (anciennes réponses). Les réservations externes sont modifiables par le propriétaire. */
  source?: ReservationSource;
  occupant_name?: string;
  /** Téléphone du client d'une réservation externe (null pour un vacancier MobilHomy). */
  guest_phone?: string | null;
  occupants_count?: number;
  total_price?: number;
  /** Plaque d'immatriculation : nécessaire à la déclaration du séjour au camping. */
  immat?: string | null;
  /** N° de réservation délivré par Siblu après la déclaration (saisi par le propriétaire). */
  siblu_ref?: string | null;
  created_at?: string;
  occupants?: Occupant[];
}

/** Réservation prise sur une autre plateforme, saisie par le propriétaire (POST /api/owner/reservations). */
export interface ExternalReservationInput {
  mobil_home_id: number;
  source: ExternalSource;
  guest_name: string;
  guest_phone: string;
  start_date: string; // yyyy-MM-dd
  end_date: string;
  immat: string;
  occupants: OccupantPayload[];
}

/** Client, plaque et occupants d'une réservation externe (PUT /api/owner/reservations/{id}/details). */
export interface ReservationDetailsInput {
  guest_name: string;
  guest_phone: string;
  immat: string;
  occupants: OccupantPayload[];
}
