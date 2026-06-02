import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/auth/services/auth.service';
import { NotificationService } from './core/services/notification.service';

describe('App', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAutenticado']);
    mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['requestNotificationPermission']);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
