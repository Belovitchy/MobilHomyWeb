import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OwnerMobilHomeList } from './owner-mobil-home-list';

describe('OwnerMobilHomeList', () => {
  let component: OwnerMobilHomeList;
  let fixture: ComponentFixture<OwnerMobilHomeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerMobilHomeList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerMobilHomeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
