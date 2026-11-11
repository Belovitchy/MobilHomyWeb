import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CalendarEvent } from '../models/calendar.models';
import { Invoice, ManagerInfo, ManagerInput } from '../models/manager.models';
import { OwnerMobilHome, OwnerMobilHomeInput } from '../models/mobilhome.models';
import { OwnerLink, OwnerLinkInput } from '../models/link.models';
import {
  ExternalReservationInput,
  OwnerReservation,
  ReservationDetailsInput,
  ReservationStatus,
} from '../models/reservation.models';

/**
 * Contrat API attendu côté back (voir cahier des charges / contrôleur OwnerController) :
 * GET    /api/owner/mobilhomes                     -> OwnerMobilHome[]
 * POST   /api/owner/mobilhomes                     -> OwnerMobilHome
 * PUT    /api/owner/mobilhomes/{id}                -> OwnerMobilHome
 * DELETE /api/owner/mobilhomes/{id}                -> 204
 * GET    /api/owner/managers                       -> Manager[]
 * POST   /api/owner/managers                       -> Manager (crée le compte MANAGER)
 * PUT    /api/owner/managers/{id}                  -> Manager
 * DELETE /api/owner/managers/{id}                  -> 204
 * GET    /api/owner/reservations[?status=]         -> OwnerReservation[]
 * PUT    /api/owner/reservations/{id}/validate     -> OwnerReservation (VALIDATED)
 * PUT    /api/owner/reservations/{id}/reject       -> OwnerReservation (REJECTED)
 * PUT    /api/owner/reservations/{id}/siblu-ref    -> OwnerReservation (n° Siblu, VALIDATED uniquement)
 * POST   /api/owner/reservations                   -> OwnerReservation (réservation externe, VALIDATED d'office)
 * PUT    /api/owner/reservations/{id}/details      -> OwnerReservation (client, plaque, occupants — externes uniquement)
 * PUT    /api/owner/reservations/{id}/cancel       -> OwnerReservation (annulation d'une réservation externe)
 * GET    /api/owner/invoices                       -> Invoice[] (saisies par ses gérants)
 * PUT    /api/owner/invoices/{id}/pay              -> Invoice (ISSUED -> PAID)
 * GET/POST/PUT/DELETE /api/owner/links[/{id}]      -> liens utiles du propriétaire
 * GET    /api/owner/calendar[?mobilHomeId=]        -> CalendarEvent[] (INTERNAL + ICAL)
 */
@Injectable({ providedIn: 'root' })
export class OwnerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/owner`;

  // ----- Mobil-homes -----
  mobilHomes(): Observable<OwnerMobilHome[]> {
    return this.http.get<OwnerMobilHome[]>(`${this.base}/mobilhomes`);
  }

  createMobilHome(input: OwnerMobilHomeInput): Observable<OwnerMobilHome> {
    return this.http.post<OwnerMobilHome>(`${this.base}/mobilhomes`, input);
  }

  updateMobilHome(id: number, input: OwnerMobilHomeInput): Observable<OwnerMobilHome> {
    return this.http.put<OwnerMobilHome>(`${this.base}/mobilhomes/${id}`, input);
  }

  deleteMobilHome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/mobilhomes/${id}`);
  }

  /**
   * Téléverse une photo (POST /api/owner/images, multipart, champ "file").
   * Le serveur l'enregistre dans uploads/images et renvoie son chemin public, ex : { path: "/images/…webp" }.
   * Ne pas fixer le Content-Type : le navigateur ajoute lui-même la "boundary" du multipart.
   */
  uploadImage(file: File): Observable<{ path: string }> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ path: string }>(`${this.base}/images`, body);
  }

  // ----- Gérants -----
  managers(): Observable<ManagerInfo[]> {
    return this.http.get<ManagerInfo[]>(`${this.base}/managers`);
  }

  createManager(input: ManagerInput): Observable<ManagerInfo> {
    return this.http.post<ManagerInfo>(`${this.base}/managers`, input);
  }

  updateManager(id: number, input: ManagerInput): Observable<ManagerInfo> {
    return this.http.put<ManagerInfo>(`${this.base}/managers/${id}`, input);
  }

  deleteManager(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/managers/${id}`);
  }

  // ----- Demandes de réservation -----
  reservations(status?: ReservationStatus): Observable<OwnerReservation[]> {
    return this.http.get<OwnerReservation[]>(`${this.base}/reservations`, {
      params: status ? { status } : undefined,
    });
  }

  validate(id: number): Observable<OwnerReservation> {
    return this.http.put<OwnerReservation>(`${this.base}/reservations/${id}/validate`, {});
  }

  reject(id: number): Observable<OwnerReservation> {
    return this.http.put<OwnerReservation>(`${this.base}/reservations/${id}/reject`, {});
  }

  /** Numéro de réservation Siblu obtenu après la déclaration du séjour au camping. */
  updateSibluRef(id: number, sibluRef: string): Observable<OwnerReservation> {
    return this.http.put<OwnerReservation>(`${this.base}/reservations/${id}/siblu-ref`, {
      siblu_ref: sibluRef,
    });
  }

  // ----- Réservations externes (Booking, Airbnb…) -----

  createExternalReservation(input: ExternalReservationInput): Observable<OwnerReservation> {
    return this.http.post<OwnerReservation>(`${this.base}/reservations`, input);
  }

  updateReservationDetails(id: number, input: ReservationDetailsInput): Observable<OwnerReservation> {
    return this.http.put<OwnerReservation>(`${this.base}/reservations/${id}/details`, input);
  }

  cancelExternalReservation(id: number): Observable<OwnerReservation> {
    return this.http.put<OwnerReservation>(`${this.base}/reservations/${id}/cancel`, {});
  }

  // ----- Liens utiles -----

  invoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.base}/invoices`);
  }

  payInvoice(id: number): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.base}/invoices/${id}/pay`, {});
  }

  links(): Observable<OwnerLink[]> {
    return this.http.get<OwnerLink[]>(`${this.base}/links`);
  }

  createLink(input: OwnerLinkInput): Observable<OwnerLink> {
    return this.http.post<OwnerLink>(`${this.base}/links`, input);
  }

  updateLink(id: number, input: OwnerLinkInput): Observable<OwnerLink> {
    return this.http.put<OwnerLink>(`${this.base}/links/${id}`, input);
  }

  deleteLink(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/links/${id}`);
  }

  // ----- Calendrier -----
  calendarEvents(mobilHomeId?: number): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.base}/calendar`, {
      params: mobilHomeId ? { mobilHomeId: String(mobilHomeId) } : undefined,
    });
  }
}
