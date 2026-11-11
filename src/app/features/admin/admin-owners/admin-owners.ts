import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminOwner } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';

/** Comptes propriétaires : création, suspension, réactivation. */
@Component({
  selector: 'app-admin-owners',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-owners.html',
})
export class AdminOwners {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly owners = signal<AdminOwner[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly busyId = signal<number | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly formOpen = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstname: ['', [Validators.required, Validators.maxLength(255)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(/^$|^[0-9 +.()-]{6,20}$/)],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.owners().subscribe({
      next: (owners) => {
        this.owners.set(owners);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les propriétaires.');
        this.loading.set(false);
      },
    });
  }

  openForm(): void {
    this.form.reset();
    this.error.set('');
    this.success.set('');
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    this.admin
      .createOwner({
        firstname: v.firstname.trim(),
        name: v.name.trim(),
        email: v.email.trim().toLowerCase(),
        phone: v.phone.trim(),
        password: v.password,
      })
      .subscribe({
        next: (created) => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.success.set(
            `Compte créé pour ${created.firstname} ${created.name} — communique-lui son mot de passe provisoire.`,
          );
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'Création impossible (email déjà utilisé ?).');
        },
      });
  }

  toggle(o: AdminOwner): void {
    const suspend = o.enabled;
    const question = suspend
      ? `Suspendre le compte de ${o.firstname} ${o.name} ? Il sera déconnecté immédiatement.`
      : `Réactiver le compte de ${o.firstname} ${o.name} ?`;
    if (!confirm(question)) return;
    this.busyId.set(o.id);
    this.admin.setEnabled(o.id, !suspend).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.owners.update((list) => list.map((x) => (x.id === o.id ? updated : x)));
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Action impossible — réessaie.');
      },
    });
  }

  isInvalid(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  inputClasses(ctrl: AbstractControl): string {
    const base =
      'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2';
    return this.isInvalid(ctrl)
      ? `${base} border-red-400 focus:border-red-400 focus:ring-red-100`
      : `${base} border-line focus:border-accent focus:ring-accent/20`;
  }
}
