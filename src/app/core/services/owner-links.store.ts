import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { OwnerLink, OwnerLinkInput } from '../models/link.models';
import { OwnerService } from './owner.service';

/**
 * État partagé des liens du propriétaire : la page « Mes liens » les modifie,
 * le menu latéral (OwnerLayout) les affiche — sans rechargement, grâce au signal.
 */
@Injectable({ providedIn: 'root' })
export class OwnerLinksStore {
  private readonly owner = inject(OwnerService);

  private readonly state = signal<OwnerLink[]>([]);
  readonly links = this.state.asReadonly();

  load(): void {
    this.owner.links().subscribe({
      next: (links) => this.state.set(links),
      error: () => this.state.set([]),
    });
  }

  create(input: OwnerLinkInput): Observable<OwnerLink> {
    return this.owner.createLink(input).pipe(tap((link) => this.state.update((l) => sortByName([...l, link]))));
  }

  update(id: number, input: OwnerLinkInput): Observable<OwnerLink> {
    return this.owner
      .updateLink(id, input)
      .pipe(tap((link) => this.state.update((l) => sortByName(l.map((x) => (x.id === id ? link : x))))));
  }

  remove(id: number): Observable<void> {
    return this.owner.deleteLink(id).pipe(tap(() => this.state.update((l) => l.filter((x) => x.id !== id))));
  }
}

function sortByName(links: OwnerLink[]): OwnerLink[] {
  return [...links].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
