import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Reservation, ReservationStatus } from '../../../core/models/reservation.models';
import { ReservationService } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-my-reservations',
  imports: [RouterLink],
  templateUrl: './my-reservations.html',
})
export class MyReservations implements OnInit {
  private readonly api = inject(ReservationService);
  private readonly router = inject(Router);

  readonly reservations = signal<Reservation[]>([]);
  readonly created = signal(false);
  readonly loading = signal(true);

  ngOnInit(): void {
    const qp = new URLSearchParams(window.location.search);
    this.created.set(qp.get('created') === '1');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.mine().subscribe({
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
      case 'COMPLETED':
        return {
          label: 'Envoyée — en attente du propriétaire',
          classes: 'border-ink bg-white text-ink',
        };
      case 'REJECTED':
        return { label: 'Refusée', classes: 'border-red-300 bg-red-50 text-red-700' };
      case 'CANCELLED':
        return { label: 'Annulée', classes: 'border-line bg-gray-100 text-soft' };
      default: // PENDING
        return { label: 'À compléter', classes: 'border-amber-400 bg-amber-50 text-amber-700' };
    }
  }

  /** Ce qui manque pour envoyer la demande au propriétaire */
  missing(res: Reservation): string[] {
    const gaps: string[] = [];
    if (!res.immat?.trim()) gaps.push("la plaque d'immatriculation");
    if (!res.occupants?.length) gaps.push('au moins un occupant');
    if (res.status === 'PENDING') gaps.push('la demande doit être envoyée au propriétaire');
    return gaps;
  }

  complete(res: Reservation): void {
    this.router.navigate(['/mon-compte/reservations', res.id, 'completer']);
  }
}
