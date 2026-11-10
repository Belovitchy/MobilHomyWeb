import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OwnerLayout } from './owner-layout';

describe('OwnerLayout', () => {
  let component: OwnerLayout;
  let fixture: ComponentFixture<OwnerLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerLayout],
      // Le composant (ou un enfant) injecte HttpClient / Router : sans eux, la création échoue.
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
