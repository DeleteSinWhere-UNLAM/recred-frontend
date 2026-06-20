import { TestBed } from '@angular/core/testing';
import { LandingPresenter } from './landing.presenter';
import { AuthService } from '../../../core/auth/services/auth.service';

describe('LandingPresenter', () => {
  let presenter: LandingPresenter;
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = {
      login: jasmine.createSpy('login').and.returnValue(Promise.resolve())
    };

    TestBed.configureTestingModule({
      providers: [
        LandingPresenter,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    presenter = TestBed.inject(LandingPresenter);
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(presenter).toBeTruthy();
  });

  it('dado que se inicializa, debe tener CTAs definidos', () => {
    expect(presenter.ctas.length).toBe(2);
    expect(presenter.ctas[0].texto).toBe('Iniciar sesión');
  });

  it('dado que se ejecuta iniciarLogin, debe llamar a authService.login', async () => {
    await presenter.iniciarLogin();
    expect(mockAuthService.login).toHaveBeenCalled();
  });
});
