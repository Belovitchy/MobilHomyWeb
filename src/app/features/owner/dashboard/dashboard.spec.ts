import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OwnerDashboard } from './dashboard';

await TestBed.configureTestingModule({
  imports: [OwnerDashboard],
  providers: [provideHttpClient(), provideHttpClientTesting()],
}).compileComponents();

describe('OwnerDashboard', () => {
  let component: OwnerDashboard;
  let fixture: ComponentFixture<OwnerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
