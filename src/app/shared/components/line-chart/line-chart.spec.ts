import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChart } from './line-chart';

describe('LineChart', () => {
  let component: LineChart;
  let fixture: ComponentFixture<LineChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChart],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChart);
    // labels et series sont des input.required : il faut les fournir avant le rendu.
    fixture.componentRef.setInput('labels', ['S1', 'S2', 'S3']);
    fixture.componentRef.setInput('series', [{ label: 'Océane', color: '#2E6E5A', points: [0, 50, 100] }]);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
