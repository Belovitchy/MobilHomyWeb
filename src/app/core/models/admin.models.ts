/** Compte propriétaire vu par l'administrateur (GET /api/admin/owners). */
export interface AdminOwner {
  id: number;
  firstname: string;
  name: string;
  email: string;
  phone: string | null;
  enabled: boolean;
  mobilhomes_count: number;
  reservations_count: number;
}

export interface AdminOwnerInput {
  firstname: string;
  name: string;
  email: string;
  phone: string;
  /** Mot de passe provisoire (8 caractères min.), à communiquer au propriétaire. */
  password: string;
}

/** Indicateurs de bon fonctionnement de la plateforme (GET /api/admin/stats). */
export interface AdminStats {
  owners: number;
  owners_suspended: number;
  managers: number;
  vacationers: number;
  mobilhomes: number;
  reservations: number;
  reservations_to_process: number;
  reservations_validated: number;
  invoices_pending_amount: number;
}
