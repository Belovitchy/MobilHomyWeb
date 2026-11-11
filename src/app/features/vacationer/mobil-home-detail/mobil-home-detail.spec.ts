import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MobilHomeDetail } from './mobil-home-detail';

describe('MobilHomeDetail', () => {
  let component: MobilHomeDetail;
  let fixture: ComponentFixture<MobilHomeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilHomeDetail],
      // Le composant (ou un enfant) injecte HttpClient / Router : sans eux, la création échoue.
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MobilHomeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
