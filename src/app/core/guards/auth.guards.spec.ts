import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, roleGuard } from './auth.guards';

/** Faux AuthService : on choisit l'état de connexion et le rôle pour chaque test. */
function setup(authenticated: boolean, authority: string | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          isAuthenticated: () => authenticated,
          hasRole: (...roles: string[]) => !!authority && roles.includes(authority),
        },
      },
    ],
  });
}

function run(guard: typeof authGuard): boolean | UrlTree {
  return TestBed.runInInjectionContext(
    () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as boolean | UrlTree,
  );
}

function url(result: boolean | UrlTree): string {
  return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : String(result);
}

describe('authGuard', () => {
  it('laisse passer un utilisateur connecté', () => {
    setup(true, 'VACATIONER');
    expect(run(authGuard)).toBe(true);
  });

  it('redirige un visiteur anonyme vers /login', () => {
    setup(false, null);
    expect(url(run(authGuard))).toBe('/login');
  });
});

describe('roleGuard', () => {
  it('laisse passer le bon rôle', () => {
    setup(true, 'OWNER');
    expect(run(roleGuard('OWNER'))).toBe(true);
  });

  it('accepte l’un des rôles listés', () => {
    setup(true, 'MANAGER');
    expect(run(roleGuard('OWNER', 'MANAGER'))).toBe(true);
  });

  it('envoie un vacancier qui tente /owner vers /forbidden', () => {
    setup(true, 'VACATIONER');
    expect(url(run(roleGuard('OWNER')))).toBe('/forbidden');
  });

  it('envoie un visiteur anonyme vers /login (et non /forbidden)', () => {
    setup(false, null);
    expect(url(run(roleGuard('OWNER')))).toBe('/login');
  });
});
