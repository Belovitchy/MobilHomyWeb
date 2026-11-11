import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Invoice,
  InvoiceInput,
  ManagerMobilHome,
  ManagerReservation,
} from '../models/manager.models';

/**
 * Espace gérant — contrat de ManagerController :
 * GET  /api/manager/reservations         -> ManagerReservation[] (VALIDATED uniquement)
 * GET  /api/manager/mobilhomes           -> ManagerMobilHome[]
 * GET  /api/manager/invoices             -> Invoice[] (plus récentes d'abord)
 * POST /api/manager/invoices             -> Invoice (statut ISSUED)
 * PUT  /api/manager/invoices/{id}/cancel -> Invoice (CANCELLED, seulement si ISSUED)
 */
@Injectable({ providedIn: 'root' })
export class ManagerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/manager`;

  reservations(): Observable<ManagerReservation[]> {
    return this.http.get<ManagerReservation[]>(`${this.base}/reservations`);
  }

  mobilHomes(): Observable<ManagerMobilHome[]> {
    return this.http.get<ManagerMobilHome[]>(`${this.base}/mobilhomes`);
  }

  invoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.base}/invoices`);
  }

  createInvoice(input: InvoiceInput): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/invoices`, input);
  }

  cancelInvoice(id: number): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.base}/invoices/${id}/cancel`, {});
  }
}
