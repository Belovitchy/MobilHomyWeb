import { Component, Input, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MobilHome } from '../../../core/models/mobilhome.models';
import { OccupantPayload } from '../../../core/models/occupant.models';
import { ReservationPayload } from '../../../core/models/reservation.models';
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
  /** Dates choisies sur la fiche du mobil-home, transmises en paramètres d'URL (?start=…&end=…). */
  @Input() start?: string;
  @Input() end?: string;

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
    // Reprend la période déjà saisie sur la fiche, pour ne pas la redemander
    this.form.patchValue({ start: this.start ?? '', end: this.end ?? '' });
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
    if (this.loading()) return;
    if (this.form.invalid) {
      // Sans ce message, le clic sur « Envoyer » ne produisait aucun effet visible
      this.form.markAllAsTouched();
      this.error.set(this.missingFieldsMessage());
      return;
    }
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
        this.router.navigate(['/mon-compte-vacationer/reservations'], {
          queryParams: { created: '1' },
        }),
      error: (err) => {
        this.error.set(
          err.status === 409
            ? 'Ces dates ne sont plus disponibles (calendrier ou sync externe).'
            : (err.error?.message ?? "Erreur lors de l'envoi de la demande."),
        );
        this.loading.set(false);
      },
    });
  }

  /** Liste les informations manquantes pour guider le vacancier. */
  private missingFieldsMessage(): string {
    const c = this.form.controls;
    const missing: string[] = [];
    if (c.start.invalid || c.end.invalid) missing.push("les dates d'arrivée et de départ");
    if (this.occupants.invalid) missing.push("le nom, le prénom et l'âge de chaque voyageur");
    if (c.immat.invalid) missing.push("la plaque d'immatriculation");
    return `Complétez ${missing.join(', ')} pour envoyer la demande.`;
  }
}
