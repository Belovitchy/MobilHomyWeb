export interface ManagerInfo {
  id: number;
  firstname: string;
  name: string;
  phone: string;
  email: string;
}

export interface ManagerInput {
  firstname: string;
  name: string;
  email: string;
  phone: string;
  /** Uniquement à la création — retire ce champ si ton back génère lui-même le mot de passe. */
  password?: string;
}

// ----- Espace gérant (GET /api/manager/...) -----

/** Séjour confirmé d'un mobil-home géré — seules les réservations VALIDATED sont renvoyées. */
export interface ManagerReservation {
  id: number;
  mobil_home_id: number;
  mobil_home_title: string;
  location: string | null;
  start_date: string; // yyyy-MM-dd (arrivée)
  end_date: string; // yyyy-MM-dd (départ)
  status: 'VALIDATED';
  vacationer_name: string | null;
  vacationer_phone: string | null;
  vacationer_email: string | null;
  immat: string | null;
  occupants_count: number;
  occupants: { id?: number; firstname: string; name: string; age: number }[];
}

/** Mobil-home géré, version courte (liste déroulante des factures). */
export interface ManagerMobilHome {
  id: number;
  title: string;
  location: string | null;
  owner_name: string | null;
}

export type InvoiceCategory = 'SERVICE' | 'CONSUMABLE';
export type InvoiceStatus = 'ISSUED' | 'PAID' | 'CANCELLED';

export interface Invoice {
  id: number;
  mobil_home_id: number;
  mobil_home_title: string;
  description: string;
  amount: number;
  date: string; // yyyy-MM-dd
  category: InvoiceCategory;
  status: InvoiceStatus;
  /** Gérant qui a saisi la facture (vue propriétaire). */
  manager_name?: string | null;
}

export interface InvoiceInput {
  mobil_home_id: number;
  category: InvoiceCategory;
  description: string;
  amount: number;
  date: string; // yyyy-MM-dd, pas dans le futur
}
