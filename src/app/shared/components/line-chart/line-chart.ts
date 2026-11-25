import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ChartSeries {
  label: string;
  color: string;
  /** Valeurs en % (0 à 100), alignées sur les labels de l'axe X. */
  points: number[];
}

/** Petit graphique en courbes SVG — suit la palette MobilHomy. */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="w-full select-none" role="img">
      @for (g of grid; track g.v) {
        <line
          [attr.x1]="padL"
          [attr.x2]="W - padR"
          [attr.y1]="y(g.v)"
          [attr.y2]="y(g.v)"
          stroke="#E5E7EB"
          stroke-width="1"
        />
        <text
          [attr.x]="padL - 8"
          [attr.y]="y(g.v) + 4"
          text-anchor="end"
          font-size="11"
          fill="#9CA3AF"
        >
          {{ g.v }}%
        </text>
      }
      <line
        [attr.x1]="padL"
        [attr.x2]="W - padR"
        [attr.y1]="y(0)"
        [attr.y2]="y(0)"
        stroke="#D8DBE0"
        stroke-width="1.5"
      />
      @for (l of xLabels(); track l.i) {
        <text [attr.x]="x(l.i)" [attr.y]="H - 6" text-anchor="middle" font-size="11" fill="#9CA3AF">
          {{ l.text }}
        </text>
      }
      @for (s of series(); track s.label) {
        <polyline
          [attr.points]="polyline(s)"
          fill="none"
          [attr.stroke]="s.color"
          stroke-width="2.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        @for (p of s.points; track $index; let pi = $index) {
          <circle [attr.cx]="x(pi)" [attr.cy]="y(p)" r="3" [attr.fill]="s.color">
            <title>{{ s.label }} · {{ labels()[pi] }} : {{ p }}%</title>
          </circle>
        }
      }
    </svg>
  `,
})
export class LineChart {
  readonly labels = input.required<string[]>();
  readonly series = input.required<ChartSeries[]>();

  readonly W = 880;
  readonly H = 300;
  readonly padL = 48;
  readonly padR = 16;
  readonly padT = 14;
  readonly padB = 30;
  readonly grid = [0, 25, 50, 75, 100].map((v) => ({ v }));

  readonly xLabels = computed(() => {
    const labels = this.labels();
    const step = Math.max(1, Math.ceil(labels.length / 14));
    return labels.map((text, i) => ({ i, text })).filter((l) => l.i % step === 0);
  });

  x(i: number): number {
    const n = Math.max(this.labels().length, 2);
    return this.padL + (i * (this.W - this.padL - this.padR)) / (n - 1);
  }

  y(v: number): number {
    return this.padT + (this.H - this.padT - this.padB) * (1 - Math.min(100, Math.max(0, v)) / 100);
  }

  polyline(s: ChartSeries): string {
    return s.points.map((p, i) => `${this.x(i)},${this.y(p)}`).join(' ');
  }
}
