import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VacationerHome } from './vacationer-home';

describe('VacationerHome', () => {
  let component: VacationerHome;
  let fixture: ComponentFixture<VacationerHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VacationerHome],
    }).compileComponents();

    fixture = TestBed.createComponent(VacationerHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
