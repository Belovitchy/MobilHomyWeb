import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccountUpdate,
  EmailUpdate,
  PasswordUpdate,
  VacationerAccount,
} from '../models/account.models';

@Injectable({ providedIn: 'root' })
export class VacationerService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/vacationer`;

  getAccount(): Observable<VacationerAccount> {
    return this.http.get<VacationerAccount>(`${this.api}/account`);
  }

  updateAccount(payload: AccountUpdate): Observable<VacationerAccount> {
    return this.http.put<VacationerAccount>(`${this.api}/account`, payload);
  }

  /** Erreurs attendues : 400 (email invalide/déjà pris), 401/403 (mot de passe actuel faux) */
  updateEmail(payload: EmailUpdate): Observable<void> {
    return this.http.put<void>(`${this.api}/account/email`, payload);
  }

  /** Erreurs attendues : 400 (format), 401/403 (mot de passe actuel faux) */
  updatePassword(payload: PasswordUpdate): Observable<void> {
    return this.http.put<void>(`${this.api}/account/password`, payload);
  }
}
