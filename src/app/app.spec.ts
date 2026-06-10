import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/auth/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { PerfilService } from './data-access/services/perfil.service';

describe('App', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockPerfilService: Pick<PerfilService, 'rol'>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAutenticado']);
    mockAuthService.isAutenticado.and.returnValue(Promise.resolve(false));

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['requestNotificationPermission', 'getNotifications']);
    mockPerfilService = {
      rol: signal(null).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PerfilService, useValue: mockPerfilService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
