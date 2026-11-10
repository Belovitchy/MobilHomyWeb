import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagerInfo, ManagerInput } from '../../../core/models/manager.models';
import { OwnerService } from '../../../core/services/owner.service';

@Component({
  selector: 'app-owner-manager-list',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manager-list.html',
})
export class ManagerList {
  private readonly owner = inject(OwnerService);
  private readonly fb = inject(FormBuilder);

  readonly managers = signal<ManagerInfo[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly busyId = signal<number | null>(null);
  readonly formOpen = signal(false);
  readonly editing = signal<ManagerInfo | null>(null);

  readonly form = this.fb.group({
    first_name: ['', [Validators.required, Validators.maxLength(60)]],
    last_name: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    // Mêmes règles que le back (OwnerManagerRequestDto) : téléphone obligatoire.
    phone: ['', [Validators.required, Validators.pattern(/^[+0-9 ().-]{6,20}$/)]],
    // Obligatoire (8 caractères min.) à la création uniquement — cf. setPasswordRules().
    password: [''],
  });

  static readonly MIN_PASSWORD_LENGTH = 8;

  /** Le mot de passe provisoire est exigé par le back à la création, ignoré en modification. */
  private setPasswordRules(create: boolean): void {
    const ctrl = this.form.controls.password;
    ctrl.setValidators(
      create ? [Validators.required, Validators.minLength(ManagerList.MIN_PASSWORD_LENGTH)] : [],
    );
    ctrl.updateValueAndValidity();
  }

  /** Champ mot de passe affiché uniquement à la création. */
  readonly isCreate = computed(() => this.editing() === null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.owner.managers().subscribe({
      next: (managers) => {
        this.managers.set(managers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les gérants.');
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.form.reset({ first_name: '', last_name: '', email: '', phone: '', password: '' });
    this.setPasswordRules(true);
    this.formOpen.set(true);
  }

  startEdit(m: ManagerInfo): void {
    this.editing.set(m);
    this.form.reset({
      first_name: m.firstname,
      last_name: m.name,
      email: m.email,
      phone: m.phone ?? '',
      password: '',
    });
    this.setPasswordRules(false);
    this.formOpen.set(true);
  }

  cancel(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.error.set('');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input: ManagerInput = {
      firstname: (v.first_name ?? '').trim(),
      name: (v.last_name ?? '').trim(),
      email: (v.email ?? '').trim().toLowerCase(),
      phone: (v.phone ?? '').trim(),
    };
    if (this.isCreate() && v.password) input.password = v.password;
    this.saving.set(true);
    this.error.set('');
    const call = this.isCreate()
      ? this.owner.createManager(input)
      : this.owner.updateManager(this.editing()!.id, input);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Enregistrement impossible (email déjà utilisé ?).');
      },
    });
  }

  remove(m: ManagerInfo): void {
    if (!confirm(`Retirer le gérant « ${m.firstname} ${m.name} » ?`)) return;
    this.busyId.set(m.id);
    this.owner.deleteManager(m.id).subscribe({
      next: () => this.load(),
      error: () => {
        this.busyId.set(null);
        this.error.set('Suppression impossible.');
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
