import { Component, inject, signal } from '@angular/core';
import { MyReservation, ReservationStatus } from '../../../core/models/vacationer.models';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationService } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-my-reservations',
  imports: [],
  templateUrl: './my-reservations.html',
})
export class MyReservations {
  private readonly api = inject(ReservationService);

  readonly reservations = signal<MyReservation[]>([]);
  readonly created = signal(false); // query param ?created=1
  readonly loading = signal(true);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    const qp = new URLSearchParams(window.location.search);
    this.created.set(qp.get('created') === '1');

    const user = this.authService.currentUser();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.api.mine(user.userId).subscribe({
      next: (list) => {
        this.reservations.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  badge(status: ReservationStatus): { label: string; classes: string } {
    switch (status) {
      case 'VALIDATED':
        return { label: 'Confirmée', classes: 'border-accent bg-accent-soft text-accent' };
      case 'PENDING':
        return { label: 'Contrat à signer', classes: 'border-ink bg-white text-ink' };
      case 'REJECTED':
        return { label: 'Refusée', classes: 'border-red-300 bg-red-50 text-red-700' };
      default:
        return { label: 'En attente du propriétaire', classes: 'border-line bg-white text-soft' };
    }
  }

  sign(res: MyReservation): void {
    if (!res.contractId) return;
    this.api.signContract(res.contractId).subscribe(() => this.ngOnInit());
  }
}
