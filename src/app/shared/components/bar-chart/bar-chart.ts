import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarSeries {
  label: string;
  color: string;
  /** Montants (€), alignés sur les labels de l'axe X. */
  values: number[];
}

/** Graphique en barres groupées SVG (ex. recettes / dépenses par mois). */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="w-full select-none" role="img">
      @for (g of grid(); track g) {
        <line [attr.x1]="padL" [attr.x2]="W - padR" [attr.y1]="y(g)" [attr.y2]="y(g)"
              stroke="#E5E7EB" stroke-width="1" />
        <text [attr.x]="padL - 8" [attr.y]="y(g) + 4" text-anchor="end" font-size="11" fill="#9CA3AF">
          {{ g }} €
        </text>
      }
      @for (l of labels(); track $index; let i = $index) {
        <text [attr.x]="groupX(i) + groupW / 2" [attr.y]="H - 6" text-anchor="middle"
              font-size="11" fill="#9CA3AF">{{ l }}</text>
      }
      @for (s of series(); track s.label; let si = $index) {
        @for (v of s.values; track $index; let i = $index) {
          <rect class="bar" [attr.x]="barX(i, si)" [attr.y]="y(v)" [attr.width]="barW()"
                [attr.height]="y(0) - y(v)" [attr.fill]="s.color" rx="2">
            <title>{{ s.label }} · {{ labels()[i] }} : {{ v.toFixed(2) }} €</title>
          </rect>
        }
      }
      <line [attr.x1]="padL" [attr.x2]="W - padR" [attr.y1]="y(0)" [attr.y2]="y(0)"
            stroke="#D8DBE0" stroke-width="1.5" />
    </svg>
  `,
})
export class BarChart {
  readonly labels = input.required<string[]>();
  readonly series = input.required<BarSeries[]>();

  readonly W = 720;
  readonly H = 240;
  readonly padL = 56;
  readonly padR = 8;
  readonly padT = 12;
  readonly padB = 24;

  get groupW(): number {
    return (this.W - this.padL - this.padR) / Math.max(this.labels().length, 1);
  }

  /** Graduation « ronde » au-dessus du maximum (1, 2 ou 5 × 10^n). */
  readonly max = computed(() => {
    const m = Math.max(0, ...this.series().flatMap((s) => s.values));
    if (m === 0) return 100;
    const step = 10 ** Math.floor(Math.log10(m / 4));
    const nice = [1, 2, 5, 10].map((k) => k * step).find((k) => k * 4 >= m) ?? step * 10;
    return nice * 4;
  });

  readonly grid = computed(() => [0, 1, 2, 3, 4].map((k) => (this.max() / 4) * k));

  readonly barW = computed(() => (this.groupW * 0.7) / Math.max(this.series().length, 1));

  y(v: number): number {
    return this.padT + (1 - v / this.max()) * (this.H - this.padT - this.padB);
  }

  groupX(i: number): number {
    return this.padL + i * this.groupW;
  }

  barX(i: number, si: number): number {
    return this.groupX(i) + this.groupW * 0.15 + si * this.barW();
  }
}
