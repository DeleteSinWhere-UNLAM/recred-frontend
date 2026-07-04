import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ALUMNO_ID_TEST } from './restricciones-nutricionales.mother';
import { RestriccionesNutricionalesPresenter } from './presenter/restricciones-nutricionales.presenter';
import { RestriccionesNutricionalesPage } from './restricciones-nutricionales.page';

interface PresenterFake {
  init: jasmine.Spy<(alumnoId: string) => Promise<void>>;
  alumno: ReturnType<typeof signal<{ nombre: string } | undefined>>;
  nombreCompleto: ReturnType<typeof signal<string>>;
  restricciones: ReturnType<typeof signal<Record<string, boolean>>>;
  catalogo: unknown[];
  cargando: ReturnType<typeof signal<boolean>>;
  guardando: ReturnType<typeof signal<boolean>>;
  alternar: jasmine.Spy;
  guardar: jasmine.Spy;
}

describe('RestriccionesNutricionalesPage', () => {
  let fixture: ComponentFixture<RestriccionesNutricionalesPage>;
  let presenter: PresenterFake;
  let contextoService: { alumnoId: ReturnType<typeof signal<string>> };
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let perfilService: { esPlanGratuito: ReturnType<typeof signal<boolean>> };

  beforeEach(async () => {
    presenter = {
      init: jasmine.createSpy('init').and.resolveTo(),
      alumno: signal<{ nombre: string } | undefined>({ nombre: 'Julián' }),
      nombreCompleto: signal('Julián García'),
      restricciones: signal<Record<string, boolean>>({}),
      catalogo: [],
      cargando: signal(false),
      guardando: signal(false),
      alternar: jasmine.createSpy('alternar'),
      guardar: jasmine.createSpy('guardar'),
    };
    contextoService = { alumnoId: signal(ALUMNO_ID_TEST) };
    usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['getUsuarioActual']);
    usuarioService.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);
    perfilService = { esPlanGratuito: signal(false) };

    await TestBed.configureTestingModule({
      imports: [RestriccionesNutricionalesPage],
      providers: [
        { provide: AlumnoContextoService, useValue: contextoService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: PerfilService, useValue: perfilService },
      ],
    })
      .overrideComponent(RestriccionesNutricionalesPage, {
        set: { providers: [{ provide: RestriccionesNutricionalesPresenter, useValue: presenter }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RestriccionesNutricionalesPage);
  });

  describe('inicializacion via effect', () => {
    it('dado un alumnoId en el contexto, cuando se monta la page, deberia llamar a presenter.init con ese id', () => {
      whenMonto();

      expect(presenter.init).toHaveBeenCalledWith(ALUMNO_ID_TEST);
    });

    it('dado el usuarioService, cuando se monta, deberia leer el nombre del usuario actual', () => {
      whenMonto();

      expect(fixture.componentInstance.nombreUsuario).toBe('Tutor Test');
    });
  });

  describe('esPremium', () => {
    it('dado que el perfil NO es plan gratuito, deberia ser premium', () => {
      whenMonto();

      expect(fixture.componentInstance['esPremium']()).toBeTrue();
    });

    it('dado que el perfil ES plan gratuito, no deberia ser premium', () => {
      perfilService.esPlanGratuito.set(true);

      whenMonto();

      expect(fixture.componentInstance['esPremium']()).toBeFalse();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
