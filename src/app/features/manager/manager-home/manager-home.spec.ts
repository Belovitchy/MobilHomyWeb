import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerHome } from './manager-home';

describe('ManagerHome', () => {
  let component: ManagerHome;
  let fixture: ComponentFixture<ManagerHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerHome],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
