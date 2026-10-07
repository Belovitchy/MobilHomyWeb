import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProprioHome } from './owner-home';

describe('ProprioHome', () => {
  let component: ProprioHome;
  let fixture: ComponentFixture<ProprioHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProprioHome],
    }).compileComponents();

    fixture = TestBed.createComponent(ProprioHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
