import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Authority } from '../models/auth.models';
import { Account, AccountUpdate, EmailUpdate, PasswordUpdate } from '../models/account.models';
import { AuthService } from './auth.service';

/**
 * « Mon compte » pour tous les rôles : même écran, même contrat d'API,
 * seule la racine change selon le rôle connecté (/api/vacationer/account, /api/owner/account…).
 */
const ACCOUNT_PATHS: Partial<Record<Authority, string>> = {
  VACATIONER: 'vacationer',
  OWNER: 'owner',
  MANAGER: 'manager',
};

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** URL calculée à chaque appel : suit l'utilisateur réellement connecté. */
  private get base(): string {
    const authority = this.auth.currentUser()?.authority;
    const path = authority ? ACCOUNT_PATHS[authority] : undefined;
    if (!path) {
      throw new Error(`Pas d'espace « mon compte » pour le rôle ${authority ?? 'anonyme'}`);
    }
    return `${environment.apiUrl}/${path}/account`;
  }

  getAccount(): Observable<Account> {
    return this.http.get<Account>(this.base);
  }

  updateAccount(payload: AccountUpdate): Observable<Account> {
    return this.http.put<Account>(this.base, payload);
  }

  /** Erreurs attendues : 400 (email invalide), 409 (déjà pris), 401/403 (mot de passe actuel faux) */
  updateEmail(payload: EmailUpdate): Observable<void> {
    return this.http.put<void>(`${this.base}/email`, payload);
  }

  /** Erreurs attendues : 400 (format, < 8 caractères), 401/403 (mot de passe actuel faux) */
  updatePassword(payload: PasswordUpdate): Observable<void> {
    return this.http.put<void>(`${this.base}/password`, payload);
  }
}
