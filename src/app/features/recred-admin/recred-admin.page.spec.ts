import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecredAdminPage } from './recred-admin.page';
import { RecredAdminPresenter } from './presenter/recred-admin.presenter';
import { AuthService } from '../../core/auth/services/auth.service';

describe('RecredAdminPage', () => {
  let component: RecredAdminPage;
  let fixture: ComponentFixture<RecredAdminPage>;
  let presenterSpy: jasmine.SpyObj<RecredAdminPresenter>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    presenterSpy = jasmine.createSpyObj('RecredAdminPresenter', ['initialize']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [RecredAdminPage],
    })
      .overrideComponent(RecredAdminPage, {
        set: {
          providers: [
            { provide: RecredAdminPresenter, useValue: presenterSpy },
            { provide: AuthService, useValue: authServiceSpy }
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecredAdminPage);
    component = fixture.componentInstance;
  });

  it('debería inicializar el presenter en el ngOnInit', () => {
    whenSeInicializaElComponente();
    thenElPresenterEsInicializado();
  });

  it('debería llamar al authService al cerrarSesion', async () => {
    await whenSeCierraSesion();
    thenElAuthServiceEsLlamado();
  });

  function whenSeInicializaElComponente(): void {
    component.ngOnInit();
  }

  async function whenSeCierraSesion(): Promise<void> {
    await component.cerrarSesion();
  }

  function thenElPresenterEsInicializado(): void {
    expect(presenterSpy.initialize).toHaveBeenCalled();
  }

  function thenElAuthServiceEsLlamado(): void {
    expect(authServiceSpy.logout).toHaveBeenCalled();
  }
});
