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

export interface VacationerAccount {
  id: number;
  name: string;
  firstname: string;
  email: string;
  phone: string;
  reservations: Reservation[];
}
