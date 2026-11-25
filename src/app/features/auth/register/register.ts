import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      firstname: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: (g) => (g.value.password === g.value.confirm ? null : { mismatch: true }) },
  );

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    const { firstname, name, email, phone, password } = this.form.getRawValue();
    this.auth
      .register({
        firstname,
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      })
      .subscribe({
        // Le compte est créé → on renvoie au login avec un message de succès
        next: () => this.router.navigate(['/login'], { queryParams: { registered: '1' } }),
        error: (err) => {
          this.error.set(
            err.status === 409
              ? 'Un compte existe déjà avec cet email.'
              : err.status === 400
                ? 'Vérifiez les champs (email valide, mot de passe ≥ 8 caractères).'
                : "Erreur lors de l'inscription. Réessayez.",
          );
          this.loading.set(false);
        },
      });
  }

  inputClasses(invalid: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm outline-none';
    return invalid
      ? `${base} border-red-400 bg-red-50/40 focus:border-red-500`
      : `${base} border-line focus:border-accent`;
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  mismatch(): boolean {
    const c = this.form.get('confirm');
    return !!c && this.form.hasError('mismatch') && (c.dirty || c.touched);
  }
}
