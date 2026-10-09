import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MyReservation, ReservationPayload } from '../models/vacationer.models';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/reservations`;

  create(payload: ReservationPayload): Observable<MyReservation> {
    return this.http.post<MyReservation>(this.api, payload);
  }

  mine(): Observable<MyReservation[]> {
    return this.http.get<MyReservation[]>(`${this.api}/mine`);
  }

  signContract(contractId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/contracts/${contractId}/sign`, {});
  }
}
