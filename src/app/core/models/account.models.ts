import { Reservation } from './reservation.models';

export interface AccountUpdate {
  firstname: string;
  name: string;
  phone: string;
}

export interface EmailUpdate {
  newEmail: string;
  currentPassword: string;
}

export interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
}

/** Profil commun à tous les rôles (GET /api/{role}/account). */
export interface Account {
  id: number;
  name: string;
  firstname: string;
  email: string;
  phone: string | null;
}

export interface VacationerAccount extends Account {
  reservations: Reservation[];
}
