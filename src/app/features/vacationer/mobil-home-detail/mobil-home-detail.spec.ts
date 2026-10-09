import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobilHomeDetail } from './mobil-home-detail';

describe('MobilHomeDetail', () => {
  let component: MobilHomeDetail;
  let fixture: ComponentFixture<MobilHomeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilHomeDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(MobilHomeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
