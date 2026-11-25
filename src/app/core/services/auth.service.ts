import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, LoginResponse, RegisterPayload } from '../models/auth.models';

const TOKEN_KEY = 'mobilhomy_token';
const USER_KEY = 'mobilhomy_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // ⚠️ Déclaré AVANT userSignal : les champs sont initialisés dans l'ordre, et restoreUser()
  // (appelé pour initialiser userSignal) en a besoin. Dans l'ordre inverse, `token` valait
  // undefined → la session n'était jamais restaurée après un rechargement de page (F5).
  readonly token = (): string | null => localStorage.getItem(TOKEN_KEY);

  private readonly userSignal = signal<CurrentUser | null>(this.restoreUser());
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal() && !this.isTokenExpired());

  login(login: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { login, password })
      .pipe(tap((res) => this.store(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  hasRole(...roles: string[]): boolean {
    const authority = this.userSignal()?.authority;
    return !!authority && roles.includes(authority);
  }

  // --- privé ---
  private store(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    const user: CurrentUser = {
      userId: res.userId,
      firstname: res.firstname,
      name: res.name,
      authority: res.authority,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  private restoreUser(): CurrentUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw && !this.isTokenExpired() ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /** Inscription vacancier — le back force authority=VACATIONER */
  register(payload: RegisterPayload): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/register`, payload);
  }
}
