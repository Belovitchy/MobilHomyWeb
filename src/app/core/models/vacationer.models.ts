export interface MobilHome {
  id: number;
  name: string;
  description: string;
  location: string;
  capacity: number;
  address: string;
  postalCode: string;
  price: number;
  images: string[]; // chemins relatifs ex: "/images/ocene-1.jpg"
  reservations?: { startDate: string; endDate: string }[]; // VALIDATED uniquement
}

export type ReservationStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
// ↑ à confirmer avec le retour de GET /reservations/mine (tu indiques VALIDATED côté back)

export interface ReservationPayload {
  mobilhome_id: number;
  start_date: string; // yyyy-MM-dd
  end_date: string;
  immat: string;
  occupants: OccupantPayload[];
}

export interface OccupantPayload {
  name: string;
  firstname: string;
  age: number;
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
