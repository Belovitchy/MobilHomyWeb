import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminOwner, AdminOwnerInput, AdminStats } from '../models/admin.models';

/**
 * Espace administrateur — contrat de AdminController :
 * GET  /api/admin/stats                    -> AdminStats
 * GET  /api/admin/owners                   -> AdminOwner[]
 * POST /api/admin/owners                   -> AdminOwner (compte créé actif)
 * PUT  /api/admin/owners/{id}/suspend      -> AdminOwner (connexion et jetons refusés)
 * PUT  /api/admin/owners/{id}/reactivate   -> AdminOwner
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  owners(): Observable<AdminOwner[]> {
    return this.http.get<AdminOwner[]>(`${this.base}/owners`);
  }

  createOwner(input: AdminOwnerInput): Observable<AdminOwner> {
    return this.http.post<AdminOwner>(`${this.base}/owners`, input);
  }

  setEnabled(id: number, enabled: boolean): Observable<AdminOwner> {
    const action = enabled ? 'reactivate' : 'suspend';
    return this.http.put<AdminOwner>(`${this.base}/owners/${id}/${action}`, {});
  }
}
