import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { concatMap, from } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ManagerInfo } from '../../../core/models/manager.models';
import { OwnerMobilHomeInput } from '../../../core/models/mobilhome.models';
import { OwnerService } from '../../../core/services/owner.service';

@Component({
  selector: 'app-owner-mobil-home-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobil-home-form.html',
})
export class MobilHomeForm {
  private readonly fb = inject(FormBuilder);
  private readonly owner = inject(OwnerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = signal<number | null>(null);
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  /** Gérants du propriétaire, pour la liste déroulante d'affectation. */
  readonly managers = signal<ManagerInfo[]>([]);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    location: ['', [Validators.required, Validators.maxLength(255)]],
    manager_id: this.fb.control<number | null>(null),
    address: ['', Validators.required],
    postal_code: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    department: ['', [Validators.required, Validators.pattern(/^\d{2,3}$|^[23][AB]$/i)]],
    capacity: [4, [Validators.required, Validators.min(1), Validators.max(16)]],
    price: [0, [Validators.required, Validators.min(0)]],
    images: this.fb.array<FormControl<string>>([]),
  });

  get imageRows(): FormArray<FormControl<string>> {
    return this.form.controls.images;
  }

  constructor() {
    // Liste des gérants : un échec n'empêche pas d'enregistrer le mobil-home (sans gérant).
    this.owner.managers().subscribe({
      next: (managers) => this.managers.set(managers),
      error: () => this.managers.set([]),
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const raw = pm.get('id');
      if (raw) this.load(Number(raw));
    });
  }

  addImage(): void {
    this.imageRows.push(this.fb.nonNullable.control('', Validators.required));
  }

  removeImage(i: number): void {
    this.imageRows.removeAt(i);
  }

  private patchImages(urls: string[]): void {
    const arr = this.imageRows;
    arr.clear();
    for (const url of urls) arr.push(this.fb.nonNullable.control(url, Validators.required));
  }

  // ----- Upload de photos -----

  /** Formats et taille acceptés — mêmes règles que le serveur (qui revérifie de toute façon). */
  private static readonly ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly MAX_BYTES = 5 * 1024 * 1024;

  readonly uploading = signal(false);

  /** URL affichable d'une image : chemin /images/… servi par le back, ou URL https externe. */
  imageSrc(path: string): string {
    return /^https?:\/\//.test(path) ? path : `${environment.apiOrigin}${path}`;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // permet de re-sélectionner le même fichier
    if (files.length === 0) return;

    const rejected = files.filter(
      (f) => !MobilHomeForm.ACCEPTED_TYPES.includes(f.type) || f.size > MobilHomeForm.MAX_BYTES,
    );
    if (rejected.length > 0) {
      this.error.set(`Fichier refusé : ${rejected[0].name} (JPEG, PNG ou WebP, 5 Mo maximum).`);
      return;
    }

    this.error.set('');
    this.uploading.set(true);
    // Upload séquentiel : l'ordre des photos suit l'ordre de sélection.
    from(files)
      .pipe(concatMap((file) => this.owner.uploadImage(file)))
      .subscribe({
        next: ({ path }) => {
          // Remplace d'abord une ligne restée vide, sinon ajoute une ligne.
          const empty = this.imageRows.controls.find((c) => !c.value.trim());
          if (empty) empty.setValue(path);
          else this.imageRows.push(this.fb.nonNullable.control(path, Validators.required));
        },
        error: (err) => {
          this.uploading.set(false);
          this.error.set(err?.error?.message ?? "Échec de l'envoi de la photo — réessaie.");
        },
        complete: () => this.uploading.set(false),
      });
  }

  private load(id: number): void {
    this.id.set(id);
    this.loading.set(true);
    // Pas de GET /{id} nécessaire : on retrouve le mobil-home dans la liste.
    this.owner.mobilHomes().subscribe({
      next: (homes) => {
        const home = homes.find((h) => h.id === id);
        if (!home) {
          this.error.set('Mobil-home introuvable.');
        } else {
          this.form.patchValue({
            title: home.title,
            description: home.description ?? '',
            location: home.location ?? '',
            manager_id: home.manager_id ?? null,
            address: home.address,
            postal_code: home.postal_code,
            department: home.department,
            capacity: home.capacity,
            price: home.price,
          });
          this.patchImages(home.images ?? []);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le mobil-home.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input: OwnerMobilHomeInput = {
      title: v.title?.trim() ?? '',
      description: v.description?.trim() ?? '',
      location: v.location?.trim() ?? '',
      manager_id: v.manager_id ?? null,
      address: v.address?.trim() ?? '',
      postal_code: v.postal_code?.trim() ?? '',
      department: v.department?.trim().toUpperCase() ?? '',
      capacity: Number(v.capacity),
      price: Number(v.price),
      images: v.images.map((u) => u.trim()).filter((u) => u.length > 0),
    };
    this.saving.set(true);
    this.error.set('');
    const call =
      this.id() === null
        ? this.owner.createMobilHome(input)
        : this.owner.updateMobilHome(this.id()!, input);
    call.subscribe({
      next: () => this.router.navigate(['/owner/mobil-homes']),
      error: () => {
        this.saving.set(false);
        this.error.set('Enregistrement impossible — vérifie les champs puis réessaie.');
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
