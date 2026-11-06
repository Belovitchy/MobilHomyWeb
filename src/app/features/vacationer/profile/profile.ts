import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VacationerAccount } from '../../../core/models/account.models';
import { VacationerService } from '../../../core/services/vacationer.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(VacationerService);
  private readonly fb = inject(FormBuilder);

  readonly account = signal<VacationerAccount | null>(null);
  readonly loading = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    name: ['', Validators.required],
    email: [{ value: '', disabled: true }], // RG-02 : email = identifiant, non modifiable
    phone: [''],
  });

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

  save(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.saved.set(false);
    this.error.set('');

    const { firstname, name, phone } = this.form.getRawValue();
    this.api.updateAccount({ firstname, name, phone: phone.trim() }).subscribe({
      next: (acc) => {
        this.account.set(acc);
        this.saved.set(true); // ✓ bandeau de confirmation
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Erreur lors de l'enregistrement. Réessayez.");
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
}
