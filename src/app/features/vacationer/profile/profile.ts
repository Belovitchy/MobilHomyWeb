import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Account } from '../../../core/models/account.models';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  /** Partagé par le vacancier et le propriétaire : AccountService choisit la route selon le rôle. */
  private readonly api = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly account = signal<Account | null>(null);
  readonly loading = signal(false);
  readonly saved = signal('');
  readonly error = signal('');

  // --- Form 1 : infos perso ---
  readonly form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    name: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    phone: [''],
  });

  // --- Form 2 : email (login) ---
  readonly emailForm = this.fb.nonNullable.group({
    newEmail: ['', [Validators.required, Validators.email]],
    currentPassword: ['', Validators.required],
  });

  // --- Form 3 : mot de passe ---
  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: (g) => (g.value.newPassword === g.value.confirm ? null : { mismatch: true }) },
  );

  ngOnInit(): void {
    this.api.getAccount().subscribe({
      next: (acc) => {
        this.account.set(acc);
        this.form.patchValue({
          firstname: acc.firstname,
          name: acc.name,
          email: acc.email,
          phone: acc.phone ?? '',
        });
      },
      error: () => this.error.set('Impossible de charger votre profil.'),
    });
  }

  // --- Soumissions ---
  saveProfile(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.resetMessages();
    const { firstname, name, phone } = this.form.getRawValue();
    this.api.updateAccount({ firstname, name, phone: phone.trim() }).subscribe({
      next: (acc) => {
        this.account.set(acc);
        this.saved.set('Profil mis à jour.');
        this.loading.set(false);
      },
      error: () => this.fail("Erreur lors de l'enregistrement."),
    });
  }

  saveEmail(): void {
    if (this.emailForm.invalid || this.loading()) return;
    this.loading.set(true);
    this.resetMessages();
    const { newEmail, currentPassword } = this.emailForm.getRawValue();
    this.api.updateEmail({ newEmail: newEmail.trim().toLowerCase(), currentPassword }).subscribe({
      next: () => {
        // Le JWT contient l'ancien email comme "sub" → reconnexion obligatoire
        this.auth.logout();
        this.router.navigate(['/login'], {
          queryParams: { reason: 'email-changed' },
        });
      },
      error: (err) => {
        this.error.set(
          err.status === 400 || err.status === 409
            ? 'Cet email est déjà utilisé ou invalide.'
            : err.status === 401 || err.status === 403
              ? 'Mot de passe actuel incorrect.'
              : 'Erreur lors du changement. Réessayez.',
        );
        this.loading.set(false);
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid || this.loading()) return;
    this.loading.set(true);
    this.resetMessages();
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.api.updatePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/login'], {
          queryParams: { reason: 'password-changed' },
        });
      },
      error: (err) => {
        this.error.set(
          err.status === 401 || err.status === 403
            ? 'Mot de passe actuel incorrect.'
            : 'Erreur lors du changement. Réessayez.',
        );
        this.loading.set(false);
      },
    });
  }

  // --- Helpers ---
  private resetMessages(): void {
    this.saved.set('');
    this.error.set('');
  }

  private fail(msg: string): void {
    this.error.set(msg);
    this.loading.set(false);
  }

  inputClasses(invalid: boolean): string {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm outline-none';
    return invalid
      ? `${base} border-red-400 bg-red-50/40 focus:border-red-500`
      : `${base} border-line focus:border-accent`;
  }

  isInvalid(name: string, group: AbstractControl = this.form): boolean {
    const c = group.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  mismatch(): boolean {
    const g = this.passwordForm;
    return g.hasError('mismatch') && (!!g.get('confirm')?.dirty || !!g.get('confirm')?.touched);
  }
}
