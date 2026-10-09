import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobilHomeList } from './mobil-home-list';

describe('MobilHomeList', () => {
  let component: MobilHomeList;
  let fixture: ComponentFixture<MobilHomeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilHomeList],
    }).compileComponents();

    fixture = TestBed.createComponent(MobilHomeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
