import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobilHomeForm } from './mobil-home-form';

describe('MobilHomeForm', () => {
  let component: MobilHomeForm;
  let fixture: ComponentFixture<MobilHomeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilHomeForm],
    }).compileComponents();

    fixture = TestBed.createComponent(MobilHomeForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
