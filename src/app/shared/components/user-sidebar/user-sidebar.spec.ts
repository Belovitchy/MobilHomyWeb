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

  it('ouvre les liens externes dans un nouvel onglet, sans accès à la page appelante', () => {
    fixture.componentRef.setInput('sections', [
      { label: 'Liens utiles', items: [{ label: 'Déclaration Siblu', href: 'https://www.siblu.fr/' }] },
    ]);
    fixture.detectChanges();

    const a = (fixture.nativeElement as HTMLElement).querySelector('a[href="https://www.siblu.fr/"]');
    expect(a).not.toBeNull();
    expect(a!.getAttribute('target')).toBe('_blank');
    expect(a!.getAttribute('rel')).toContain('noopener');
    expect(a!.textContent).toContain('Déclaration Siblu');
  });
});
