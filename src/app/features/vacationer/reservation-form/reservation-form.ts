import { Component, Input, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  MobilHome,
  OccupantPayload,
  ReservationPayload,
} from '../../../core/models/vacationer.models';
import { AuthService } from '../../../core/services/auth.service';
import { MobilHomeService } from '../../../core/services/mobil-home.service';
import { ReservationService } from '../../../core/services/reservation.service';

type ReservationFormRawValue = {
  start: string;
  end: string;
  immat: string;
  occupants: Array<{
    name: string;
    firstname: string;
    age: number | null;
  }>;
};

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule],
  templateUrl: './reservation-form.html',
})
export class ReservationForm {
  @Input() id!: string;

  private readonly fb = inject(FormBuilder);
  private readonly reservationApi = inject(ReservationService);
  private readonly mobilHomeApi = inject(MobilHomeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly home = signal<MobilHome | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    start: ['', Validators.required],
    end: ['', Validators.required],
    occupants: this.fb.array([]),
    immat: ['', Validators.required],
  });

  ngOnInit(): void {
    this.mobilHomeApi.getById(Number(this.id)).subscribe((home) => this.home.set(home));
    // Le référent = l'utilisateur connecté, pré-rempli
    const user = this.auth.currentUser();
    this.addOccupant(user?.name ?? '', user?.firstname ?? '');
  }

  get occupants(): FormArray {
    return this.form.controls.occupants;
  }

  addOccupant(name = '', firstname = ''): void {
    this.occupants.push(
      this.fb.nonNullable.group({
        name: [name, Validators.required],
        firstname: [firstname, Validators.required],
        age: [null as number | null, [Validators.required, Validators.min(0), Validators.max(120)]],
      }),
    );
  }

  removeOccupant(index: number): void {
    if (index === 0) return; // le référent ne peut pas être retiré
    this.occupants.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    const { start, end, occupants, immat } = this.form.getRawValue() as ReservationFormRawValue;
    const payload: ReservationPayload = {
      mobilhome_id: Number(this.id),
      start_date: start,
      end_date: end,
      immat,
      occupants: occupants.map((o): OccupantPayload => ({
        name: o.name,
        firstname: o.firstname,
        age: Number(o.age),
      })),
    };
    this.reservationApi.create(payload).subscribe({
      next: () =>
        this.router.navigate(['/mon-compte/reservations'], {
          queryParams: { created: '1' },
        }),
      error: (err) => {
        this.error.set(
          err.status === 409
            ? 'Ces dates ne sont plus disponibles (calendrier ou sync externe).'
            : "Erreur lors de l'envoi de la demande.",
        );
        this.loading.set(false);
      },
    });
  }
}
