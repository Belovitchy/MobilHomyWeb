import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserSidebar } from './user-sidebar';

describe('UserSidebar', () => {
  let component: UserSidebar;
  let fixture: ComponentFixture<UserSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
