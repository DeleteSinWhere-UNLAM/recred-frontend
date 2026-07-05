import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/services/auth.service';
import { RecredAdminPresenter } from './presenter/recred-admin.presenter';
import { RecredAdminPage } from './recred-admin.page';

describe('RecredAdminPage', () => {
  let component: RecredAdminPage;
  let fixture: ComponentFixture<RecredAdminPage>;
  let presenterSpy: jasmine.SpyObj<RecredAdminPresenter>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    presenterSpy = jasmine.createSpyObj<RecredAdminPresenter>(
      'RecredAdminPresenter',
      ['initialize', 'aprobar', 'rechazar'],
      {
        solicitudes$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
        cargando$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
        error$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
      },
    );
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    authServiceSpy.logout.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [RecredAdminPage],
    })
      .overrideComponent(RecredAdminPage, {
        set: {
          providers: [
            { provide: RecredAdminPresenter, useValue: presenterSpy },
            { provide: AuthService, useValue: authServiceSpy },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecredAdminPage);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('dado la page, cuando se monta, deberia inicializar el presenter', () => {
      whenSeMontaLaPage();

      thenSeInicializoElPresenter();
    });
  });

  describe('cerrarSesion', () => {
    it('dado la page, cuando llamo cerrarSesion, deberia delegar en authService.logout', async () => {
      await whenLlamoCerrarSesion();

      thenSeLlamoALogout();
    });
  });

  function whenSeMontaLaPage(): void {
    component.ngOnInit();
  }

  function whenLlamoCerrarSesion(): Promise<void> {
    return component.cerrarSesion();
  }

  function thenSeInicializoElPresenter(): void {
    expect(presenterSpy.initialize).toHaveBeenCalled();
  }

  function thenSeLlamoALogout(): void {
    expect(authServiceSpy.logout).toHaveBeenCalled();
  }
});
