import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation, ReservationPayload, ReservationUpdate } from '../models/reservation.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly api = `${environment.apiUrl}/vacationer/reservations`;

  create(payload: ReservationPayload): Observable<Reservation> {
    return this.http.post<Reservation>(this.api, payload);
  }

  mine(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.api}/mine`);
  }

  getById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.api}/${id}`);
  }

  /** 💾 Enregistrer (finir plus tard) — statut inchangé, reste PENDING */
  update(id: number, payload: ReservationUpdate): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.api}/${id}`, payload);
  }

  /** 📤 Envoyer au propriétaire — le back passe en COMPLETED si complet, sinon 400 */
  submit(id: number, payload: ReservationUpdate): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.api}/${id}/submit`, payload);
  }
}
