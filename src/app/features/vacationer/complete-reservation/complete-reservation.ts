import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Occupant } from '../../../core/models/occupant.models';
import { Reservation } from '../../../core/models/reservation.models';
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
    immat: ['', Validators.required],
    occupants: this.fb.array([]),
  });

  get occupants(): FormArray {
    return this.form.controls.occupants;
  }

  /** Dossier prêt à être envoyé au propriétaire */
  get readyToSend(): boolean {
    return this.form.valid && this.occupants.length > 0;
  }

  ngOnInit(): void {
    // On récupère la résa via mine() et on filtre — fonctionne sans endpoint dédié
    this.api.mine().subscribe((list) => {
      const res = list.find((r) => r.id === Number(this.id));
      if (!res) {
        this.notFound.set(true);
        return;
      }
      if (res.status !== 'PENDING') {
        this.router.navigate(['/mon-compte/reservations']); // rien à compléter
        return;
      }
      this.reservation.set(res);
      this.form.patchValue({ immat: res.immat ?? '' });
      for (const occ of res.occupants ?? []) {
        this.addOccupant(occ.firstname, occ.name, occ.age);
      }
    });
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

  save(send: boolean): void {
    // "Enregistrer" (send=false) : sauvegarde partielle autorisée
    if (send && !this.readyToSend) return;
    if (!send && this.form.invalid) {
      this.error.set("Corrigez les champs en rouge avant d'enregistrer.");
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const { immat, occupants } = this.form.getRawValue();

    this.api
      .update(Number(this.id), {
        immat: immat.trim(),
        occupants: (occupants as Occupant[]).map((o) => ({
          firstname: o.firstname,
          name: o.name,
          age: o.age!,
        })),
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/mon-compte/reservations'], {
            queryParams: send ? { sent: '1' } : {},
          });
        },
        error: () => {
          this.error.set("Erreur lors de l'enregistrement. Réessayez.");
          this.loading.set(false);
        },
      });
  }
}
