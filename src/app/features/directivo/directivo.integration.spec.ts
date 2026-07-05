import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoPage } from './directivo.page';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { PerfilService } from '../../data-access/services/perfil.service';
import { DirectivoMother } from './directivo.mother';
import { AuthService } from '../../core/auth/services/auth.service';
import { Perfil } from '../../data-access/models/perfil.model';

describe('DirectivoPage Integration', () => {
  let fixture: ComponentFixture<DirectivoPage>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [DirectivoPage],
      providers: [
        DirectivoPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
      ],
    })
      .overrideComponent(DirectivoPage, {
        set: {
          providers: [
            DirectivoPresenter,
            { provide: AuthService, useValue: authServiceSpy },
          ],
        },
      })
      .compileComponents();
  });

  describe('Flujo Principal (Happy Path)', () => {
    it('dado un perfil con nombre "Carlos" del back, cuando se monta la page, deberia renderizar el saludo y el dashboard', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'Carlos' }));

      await whenMontoYInicializo();

      const h1Element = fixture.nativeElement.querySelector('h1');
      expect(h1Element.textContent.trim()).toBe('Hola bienvenido, Carlos');
      const dashboardElement = fixture.nativeElement.querySelector('app-directivo-dashboard');
      expect(dashboardElement).toBeTruthy();
    });
  });

  function givenPerfilDelDirectivo(perfil: Perfil): void {
    perfilServiceSpy.cargarPerfil.and.resolveTo(perfil);
  }

  async function whenMontoYInicializo(): Promise<void> {
    fixture = TestBed.createComponent(DirectivoPage);
    fixture.componentInstance.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
