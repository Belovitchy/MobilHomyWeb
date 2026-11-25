import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { OwnerMobilHome } from '../../../core/models/mobilhome.models';
import {
  ExternalSource,
  OwnerReservation,
  SOURCE_LABELS,
} from '../../../core/models/reservation.models';
import { OwnerService } from '../../../core/services/owner.service';

type OccupantGroup = FormGroup<{
  firstname: FormControl<string>;
  name: FormControl<string>;
  age: FormControl<number>;
}>;

/** Mêmes règles que le back (ExternalReservationRequestDto). */
const PHONE = /^$|^[0-9 +.()-]{6,20}$/;
const IMMAT = /^$|^[A-Za-z0-9 -]{4,15}$/;

/** Le départ doit être après l'arrivée (ignoré si les dates sont désactivées, en modification). */
function datesInOrder(group: AbstractControl): ValidationErrors | null {
  const { start_date, end_date } = group.value as { start_date?: string; end_date?: string };
  return start_date && end_date && end_date <= start_date ? { dates: true } : null;
}

/**
 * Réservation prise sur une autre plateforme (Booking, Airbnb, Abritel…) : le propriétaire saisit
 * lui-même le client, la plaque et les occupants nécessaires à la déclaration au camping.
 * - /owner/requests/externe     → création (confirmée d'office)
 * - /owner/requests/:id/details → modification du client, de la plaque et des occupants
 */
@Component({
  selector: 'app-owner-external-reservation-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './external-reservation-form.html',
})
export class ExternalReservationForm {
  private readonly owner = inject(OwnerService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = signal<number | null>(null);
  readonly isEdit = computed(() => this.id() !== null);
  readonly reservation = signal<OwnerReservation | null>(null);
  readonly homes = signal<OwnerMobilHome[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly sources: { value: ExternalSource; label: string }[] = (
    ['BOOKING', 'AIRBNB', 'ABRITEL', 'OTHER'] as ExternalSource[]
  ).map((value) => ({ value, label: SOURCE_LABELS[value] }));

  readonly form = this.fb.group(
    {
      mobil_home_id: this.fb.control<number | null>(null, Validators.required),
      source: this.fb.nonNullable.control<ExternalSource>('BOOKING'),
      guest_name: ['', [Validators.required, Validators.maxLength(120)]],
      guest_phone: ['', Validators.pattern(PHONE)],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      immat: ['', Validators.pattern(IMMAT)],
      occupants: this.fb.array<OccupantGroup>([]),
    },
    { validators: datesInOrder },
  );

  get occupants() {
    return this.form.controls.occupants;
  }

  /** Capacité du mobil-home choisi, pour prévenir avant que le back ne refuse. */
  readonly capacity = signal<number | null>(null);

  constructor() {
    this.form.controls.mobil_home_id.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.capacity.set(this.homes().find((h) => h.id === id)?.capacity ?? null));

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const raw = pm.get('id');
      this.id.set(raw ? Number(raw) : null);
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      homes: this.owner.mobilHomes(),
      resas: this.isEdit() ? this.owner.reservations() : of([] as OwnerReservation[]),
    }).subscribe({
      next: ({ homes, resas }) => {
        this.homes.set(homes);
        if (this.isEdit()) this.patchFromReservation(resas.find((r) => r.id === this.id()));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les données.');
        this.loading.set(false);
      },
    });
  }

  private patchFromReservation(r: OwnerReservation | undefined): void {
    if (!r) {
      this.error.set('Réservation introuvable.');
      return;
    }
    if (!r.source || r.source === 'MOBILHOMY') {
      this.error.set('Cette réservation vient de MobilHomy : ses informations sont saisies par le vacancier.');
      return;
    }
    this.reservation.set(r);
    this.form.patchValue({
      mobil_home_id: r.mobil_home_id,
      source: r.source,
      guest_name: r.occupant_name ?? '',
      guest_phone: r.guest_phone ?? '',
      start_date: r.start_date,
      end_date: r.end_date,
      immat: r.immat ?? '',
    });
    this.occupants.clear();
    (r.occupants ?? []).forEach((o) => this.occupants.push(this.occupantGroup(o)));
    // En modification, seuls le client, la plaque et les occupants changent.
    for (const key of ['mobil_home_id', 'source', 'start_date', 'end_date'] as const) {
      this.form.controls[key].disable();
    }
  }

  private occupantGroup(o?: { firstname: string; name: string; age: number }): OccupantGroup {
    return this.fb.nonNullable.group({
      firstname: [o?.firstname ?? '', [Validators.required, Validators.maxLength(100)]],
      name: [o?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      age: [o?.age ?? 0, [Validators.required, Validators.min(0), Validators.max(120)]],
    });
  }

  addOccupant(): void {
    this.occupants.push(this.occupantGroup());
  }

  removeOccupant(i: number): void {
    this.occupants.removeAt(i);
  }

  readonly tooMany = (): boolean => {
    const cap = this.capacity();
    return cap !== null && this.occupants.length > cap;
  };

  save(): void {
    if (this.form.invalid || this.saving() || this.tooMany()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const occupants = v.occupants.map((o) => ({
      firstname: o.firstname.trim(),
      name: o.name.trim(),
      age: Number(o.age),
    }));
    const details = {
      guest_name: (v.guest_name ?? '').trim(),
      guest_phone: (v.guest_phone ?? '').trim(),
      immat: (v.immat ?? '').trim().toUpperCase(),
      occupants,
    };
    const call = this.isEdit()
      ? this.owner.updateReservationDetails(this.id()!, details)
      : this.owner.createExternalReservation({
          ...details,
          mobil_home_id: v.mobil_home_id!,
          source: v.source,
          start_date: v.start_date ?? '',
          end_date: v.end_date ?? '',
        });
    this.saving.set(true);
    this.error.set('');
    call.subscribe({
      next: () => this.router.navigate(['/owner/requests']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Enregistrement impossible — vérifie les champs.');
      },
    });
  }

  isInvalid(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  inputClasses(ctrl: AbstractControl): string {
    const base =
      'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 disabled:bg-surface disabled:text-soft';
    return this.isInvalid(ctrl)
      ? `${base} border-red-400 focus:border-red-400 focus:ring-red-100`
      : `${base} border-line focus:border-accent focus:ring-accent/20`;
  }
}
