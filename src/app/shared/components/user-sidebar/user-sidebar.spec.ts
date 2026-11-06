import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserSidebarComponent } from './user-sidebar';

describe('UserSidebar', () => {
  let component: UserSidebarComponent;
  let fixture: ComponentFixture<UserSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSidebarComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSidebarComponent);
    fixture.componentRef.setInput('title', 'Espace Vacancier');
    fixture.componentRef.setInput('sections', []);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
