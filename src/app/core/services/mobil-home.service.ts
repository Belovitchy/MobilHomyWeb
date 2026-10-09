import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MobilHome } from '../models/vacationer.models';

@Injectable({ providedIn: 'root' })
export class MobilHomeService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/mobilhomes`;

  search(filters: { department?: string; capacity?: number }): Observable<MobilHome[]> {
    const params: Record<string, string> = {};
    if (filters.department) params['department'] = filters.department;
    if (filters.capacity) params['capacity'] = String(filters.capacity);
    return this.http.get<MobilHome[]>(this.api, { params });
  }

  getById(id: number): Observable<MobilHome> {
    return this.http.get<MobilHome>(`${this.api}/${id}`);
  }
}
