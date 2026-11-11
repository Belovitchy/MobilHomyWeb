import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  Invoice,
  InvoiceCategory,
  InvoiceInput,
  InvoiceStatus,
  ManagerMobilHome,
} from '../../../core/models/manager.models';
import { ManagerService } from '../../../core/services/manager.service';
import { todayIso } from '../manager-reservations/manager-reservations';

/** Refuse une date postérieure à aujourd'hui (même règle que @PastOrPresent côté back). */
function notInFuture(control: AbstractControl) {
  const v = control.value as string | null;
  return v && v > todayIso() ? { future: true } : null;
}

/**
 * Factures de fonctionnement du gérant (prestations, consommables) : saisie et suivi.
 * Le propriétaire les règle ; le gérant peut annuler une facture saisie par erreur tant qu'elle n'est pas payée.
 */
@Component({
  selector: 'app-manager-invoices',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manager-invoices.html',
})
export class ManagerInvoices {
  private readonly manager = inject(ManagerService);
  private readonly fb = inject(FormBuilder);

  readonly invoices = signal<Invoice[]>([]);
  readonly mobilHomes = signal<ManagerMobilHome[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly busyId = signal<number | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly formOpen = signal(false);

  readonly categories: { value: InvoiceCategory; label: string }[] = [
    { value: 'SERVICE', label: 'Prestation (ménage, entretien…)' },
    { value: 'CONSUMABLE', label: 'Consommables (gaz, produits…)' },
  ];

  readonly form = this.fb.group({
    mobil_home_id: this.fb.control<number | null>(null, Validators.required),
    category: this.fb.control<InvoiceCategory>('SERVICE', { nonNullable: true }),
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(99999.99),
    ]),
    date: [todayIso(), [Validators.required, notInFuture]],
  });

  /** Montant total des factures en attente de règlement par le propriétaire. */
  readonly pendingTotal = computed(() =>
    this.invoices()
      .filter((i) => i.status === 'ISSUED')
      .reduce((sum, i) => sum + Number(i.amount), 0),
  );

  constructor() {
    forkJoin({ invoices: this.manager.invoices(), homes: this.manager.mobilHomes() }).subscribe({
      next: ({ invoices, homes }) => {
        this.invoices.set(invoices);
        this.mobilHomes.set(homes);
        // Un seul mobil-home géré : on le présélectionne.
        if (homes.length === 1) this.form.controls.mobil_home_id.setValue(homes[0].id);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les factures.');
        this.loading.set(false);
      },
    });
  }

  private reload(): void {
    this.manager.invoices().subscribe({
      next: (invoices) => this.invoices.set(invoices),
      error: () => this.error.set('Impossible de recharger les factures.'),
    });
  }

  openForm(): void {
    this.success.set('');
    this.error.set('');
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
    const input: InvoiceInput = {
      mobil_home_id: v.mobil_home_id!,
      category: v.category,
      description: (v.description ?? '').trim(),
      amount: Math.round(Number(v.amount) * 100) / 100, // 2 décimales, comme le back
      date: v.date ?? todayIso(),
    };
    this.saving.set(true);
    this.error.set('');
    this.manager.createInvoice(input).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Facture enregistrée.');
        this.formOpen.set(false);
        // On garde mobil-home et catégorie (saisies en série), on vide le reste.
        this.form.patchValue({ description: '', amount: null, date: todayIso() });
        this.form.markAsUntouched();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Enregistrement impossible — vérifie les champs.');
      },
    });
  }

  cancel(i: Invoice): void {
    if (!confirm(`Annuler la facture « ${i.description} » (${i.amount} €) ?`)) return;
    this.busyId.set(i.id);
    this.manager.cancelInvoice(i.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.reload();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Annulation impossible (facture déjà payée ?).');
      },
    });
  }

  categoryLabel(c: InvoiceCategory): string {
    return c === 'SERVICE' ? 'Prestation' : 'Consommables';
  }

  badge(status: InvoiceStatus): { label: string; classes: string } {
    switch (status) {
      case 'PAID':
        return { label: 'Payée', classes: 'bg-accent-soft text-accent border-accent/20' };
      case 'CANCELLED':
        return { label: 'Annulée', classes: 'bg-surface text-soft border-line' };
      default:
        return { label: 'En attente', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
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
