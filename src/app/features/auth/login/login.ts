import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    login: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    const { login, password } = this.form.getRawValue();
    this.auth.login(login, password).subscribe({
      next: (res) => {
        const routes: Record<string, string> = {
          ADMIN: '/admin',
          PROPRIETAIRE: '/proprietaire',
          GERANT: '/gerant',
          VACANCIER: '/vacancier',
        };
        this.router.navigateByUrl(routes[res.authority] ?? '/accueil');
      },
      error: () => {
        this.error.set('Identifiants incorrects.');
        this.loading.set(false);
      },
    });
  }
}
