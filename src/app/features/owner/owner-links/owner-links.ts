import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OwnerLink } from '../../../core/models/link.models';
import { OwnerLinksStore } from '../../../core/services/owner-links.store';

/**
 * URL http(s) uniquement — même règle que le back (un lien « javascript: » serait exécuté au clic).
 * Les espaces autour sont tolérés (copier-coller) : ils sont retirés avant l'envoi au back.
 */
export const URL_PATTERN = /^\s*https?:\/\/\S+\s*$/;

/** Liens d'usage courant du propriétaire, affichés dans son menu (extranet Booking, déclaration Siblu…). */
@Component({
  selector: 'app-owner-links',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './owner-links.html',
})
export class OwnerLinks {
  private readonly store = inject(OwnerLinksStore);
  private readonly fb = inject(FormBuilder);

  readonly links = this.store.links;
  readonly editing = signal<OwnerLink | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly busyId = signal<number | null>(null);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    url: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(URL_PATTERN)]],
  });

  startCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', url: 'https://' });
    this.error.set('');
    this.formOpen.set(true);
  }

  startEdit(link: OwnerLink): void {
    this.editing.set(link);
    this.form.reset({ name: link.name, url: link.url });
    this.error.set('');
    this.formOpen.set(true);
  }

  cancel(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input = { name: v.name.trim(), url: v.url.trim() };
    const current = this.editing();
    this.saving.set(true);
    this.error.set('');
    const call = current ? this.store.update(current.id, input) : this.store.create(input);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Enregistrement impossible — vérifie le nom et l’URL.');
      },
    });
  }

  remove(link: OwnerLink): void {
    if (!confirm(`Supprimer le lien « ${link.name} » ?`)) return;
    this.busyId.set(link.id);
    this.store.remove(link.id).subscribe({
      next: () => this.busyId.set(null),
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
