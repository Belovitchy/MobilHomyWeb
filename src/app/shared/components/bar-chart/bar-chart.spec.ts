import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChart } from './bar-chart';

describe('BarChart', () => {
  let fixture: ComponentFixture<BarChart>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BarChart);
    fixture.componentRef.setInput('labels', ['Jan', 'Fév']);
    fixture.componentRef.setInput('series', [
      { label: 'Recettes', color: '#2E6E5A', values: [300, 0] },
      { label: 'Dépenses', color: '#D97706', values: [40, 120] },
    ]);
    fixture.detectChanges();
  });

  it('dessine une barre par série et par mois, avec une infobulle', () => {
    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll<SVGRectElement>('rect.bar');
    expect(bars.length).toBe(4);
    expect(bars[0].querySelector('title')?.textContent).toContain('Recettes · Jan : 300.00 €');
  });

  it('arrondit l’échelle au-dessus du maximum', () => {
    expect(fixture.componentInstance.max()).toBe(400);
    expect(fixture.componentInstance.max()).toBeGreaterThanOrEqual(300);
  });
});
