import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Occupant } from '../../../core/models/occupant.models';
import { Reservation, ReservationUpdate } from '../../../core/models/reservation.models';
import { ReservationService } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-complete-reservation',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './complete-reservation.html',
})
export class CompleteReservation implements OnInit {
  @Input() id!: string;

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReservationService);
  private readonly router = inject(Router);

  readonly reservation = signal<Reservation | null>(null);
  readonly notFound = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    immat: [''], // ⚠️ PAS de required : le brouillon partiel doit rester possible
    occupants: this.fb.array([]),
  });

  get occupants(): FormArray {
    return this.form.controls.occupants;
  }

  /** Dossier prêt à être envoyé au propriétaire */
  get readyToSend(): boolean {
    return (
      !!this.form.controls.immat.value.trim() && // plaque renseignée
      this.form.valid && // lignes occupants valides
      this.occupants.length > 0 // au moins un occupant
    );
  }

  ngOnInit(): void {
    this.api.mine().subscribe((list) => {
      const res = list.find((r) => r.id === Number(this.id));
      if (!res) {
        this.notFound.set(true);
        return;
      }
      if (res.status !== 'PENDING') {
        this.router.navigate(['/mon-compte/reservations']);
        return;
      }
      this.reservation.set(res);
      this.form.patchValue({ immat: res.immat ?? '' });
      for (const occ of res.occupants ?? []) {
        this.addOccupant(occ.firstname, occ.name, occ.age);
      }
    });
  }

  /** Style des inputs selon l'état de validation */
  inputClasses(invalid: boolean): string {
    const base = 'rounded-lg border px-3 py-2 text-sm outline-none';
    return invalid
      ? `${base} border-red-400 bg-red-50/40 focus:border-red-500`
      : `${base} border-line focus:border-accent`;
  }

  /** Control invalide ET déjà touché/dirty (pas au 1er affichage) */
  isInvalid(path: string): boolean {
    const c = this.form.get(path);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  isOccupantInvalid(index: number, field: string): boolean {
    const c = this.occupants.at(index)?.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  addOccupant(firstname = '', name = '', age: number | null = null): void {
    this.occupants.push(
      this.fb.nonNullable.group({
        firstname: [firstname, Validators.required],
        name: [name, Validators.required],
        age: [age, [Validators.required, Validators.min(0), Validators.max(120)]],
      }),
    );
  }

  removeOccupant(index: number): void {
    this.occupants.removeAt(index);
  }

  /** Payload commun aux deux actions */
  private buildPayload(): ReservationUpdate {
    const { immat, occupants } = this.form.getRawValue();
    return {
      immat: immat.trim(),
      occupants: (occupants as Occupant[]).map((o: Occupant) => ({
        firstname: o.firstname,
        name: o.name,
        age: o.age!,
      })),
    };
  }

  save(send: boolean): void {
    // 📤 Envoyer : dossier complet obligatoire
    if (send && !this.readyToSend) {
      this.error.set('Pour envoyer : plaque + au moins un occupant complet requis.');
      return;
    }
    // 💾 Enregistrer : immat optionnelle, mais les lignes occupants saisies doivent être valides
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // ← déclenche le rouge partout où il faut
      this.error.set(
        "Corrigez les champs en rouge (ou retirez la ligne occupant vide) avant d'enregistrer.",
      );
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const call$ = send
      ? this.api.submit(Number(this.id), this.buildPayload()) // 📤 → COMPLETED (ou 400)
      : this.api.update(Number(this.id), this.buildPayload()); // 💾 → reste PENDING

    call$.subscribe({
      next: () => {
        this.router.navigate(['/mon-compte/reservations'], {
          queryParams: send ? { sent: '1' } : {},
        });
      },
      error: (err) => {
        // Le back renvoie 400 + { "error": "..." } si le submit est incomplet
        this.error.set(
          err.error?.error ??
            (send
              ? 'Envoi refusé par le serveur — vérifiez que le dossier est complet.'
              : "Erreur lors de l'enregistrement. Réessayez."),
        );
        this.loading.set(false);
      },
    });
  }
}
