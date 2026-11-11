import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobilHomeList } from './mobil-home-list';

describe('MobilHomeList', () => {
  let component: MobilHomeList;
  let fixture: ComponentFixture<MobilHomeList>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilHomeList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MobilHomeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpTestingController.expectOne((request) => request.method === 'GET').flush([]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
