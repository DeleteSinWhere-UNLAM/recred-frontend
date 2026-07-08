import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { BilleteraPage } from './billetera.page';
import { BilleteraPresenter } from './presenter/billetera.presenter';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';

type Rol = 'ALUMNO' | 'PADRE' | 'VENDEDOR';
type PresenterSpy = jasmine.SpyObj<BilleteraPresenter>;

describe('BilleteraPage', () => {
  let presenterSpy: PresenterSpy;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  const ALUMNO_ID = 'alumno-1';

  describe('dado rol ALUMNO con un alumno en contexto', () => {
    beforeEach(async () => {
      await givenUnEscenarioCon({ rol: 'ALUMNO', alumnoIdEnContexto: ALUMNO_ID });
    });

    it('cuando se inicializa la pagina, deberia configurar homeUrl en /alumno e inicializar el presenter con el alumno del contexto', () => {
      const { component } = whenCreoElComponente();

      expect(component).toBeTruthy();
      thenSeConfiguroHomeUrl('/alumno');
      thenElPresenterSeInicializoCon(ALUMNO_ID);
    });

    it('cuando invoco cambiarFecha, deberia delegar al presenter con el mismo rango', () => {
      const { component } = whenCreoElComponente();

      invokeProtected(component, 'cambiarFecha', 'mes');

      thenElPresenterRecibio('cambiarFecha', 'mes');
    });

    it('cuando cambio la fecha desde, deberia delegar a setearRango manteniendo la fecha hasta', () => {
      const { component } = whenCreoElComponente();

      invokeProtected(component, 'onDesdeChange', inputEventConValor('2024-02-01'));

      thenSeSeteoRango('2024-02-01', '2024-01-31');
    });

    it('cuando cambio la fecha hasta, deberia delegar a setearRango manteniendo la fecha desde', () => {
      const { component } = whenCreoElComponente();

      invokeProtected(component, 'onHastaChange', inputEventConValor('2024-02-28'));

      thenSeSeteoRango('2024-01-01', '2024-02-28');
    });
  });

  describe('dado rol PADRE sin alumno en contexto', () => {
    beforeEach(async () => {
      await givenUnEscenarioCon({ rol: 'PADRE', alumnoIdEnContexto: '' });
    });

    it('cuando se inicializa la pagina, deberia configurar homeUrl en /tutor e inicializar el presenter con null', () => {
      whenCreoElComponente();

      thenSeConfiguroHomeUrl('/tutor');
      thenElPresenterSeInicializoCon(null);
    });
  });

  describe('dado un rol no soportado en billetera (VENDEDOR)', () => {
    beforeEach(async () => {
      await givenUnEscenarioCon({ rol: 'VENDEDOR', alumnoIdEnContexto: '' });
    });

    it('cuando se inicializa la pagina, no deberia configurar homeUrl', () => {
      whenCreoElComponente();

      thenNoSeConfiguroHomeUrl();
    });
  });

  const PresenterMother = {
    create(): PresenterSpy {
      const spy = jasmine.createSpyObj<BilleteraPresenter>('BilleteraPresenter', [
        'init',
        'cambiarFecha',
        'formatearMontoConSigno',
        'iconoMovimiento',
        'formatearFechaMovimiento',
        'formatearMonto',
        'recargar',
        'setearRango',
        'volver',
      ]);
      Object.assign(spy, {
        cargando: signal(false),
        alumno: signal(undefined),
        resumen: signal(undefined),
        rangoFecha: signal('semana'),
        nombreAlumno: signal(''),
        grado: signal(''),
        iniciales: signal(''),
        urlFotoPerfil: signal(null),
        saldoNegativo: signal(false),
        desde: signal('2024-01-01'),
        hasta: signal('2024-01-31'),
        saldoActualFormateado: signal('$ 0'),
        periodoLabel: signal(''),
        error: signal(null),
        montoIngresadoFormateado: signal('$ 0'),
        montoGastadoFormateado: signal('$ 0'),
        balancePositivo: signal(true),
        balancePeriodoFormateado: signal('$ 0'),
        cantidadCompras: signal(0),
        hayCategorias: signal(false),
        gastoPorCategoria: signal([]),
        hayClasificacionSalud: signal(false),
        gastoPorClasificacionSalud: signal([]),
        hayMovimientos: signal(false),
        movimientos: signal([]),
      });
      return spy;
    },
  };

  const ActivatedRouteMother = {
    conAlumnoId(alumnoId: string | null) {
      const getter = (key: string) => (key === 'alumnoId' ? alumnoId : null);
      return {
        paramMap: of({ get: getter }),
        snapshot: { paramMap: { get: getter } },
      };
    },
  };

  const AlumnoContextoMother = {
    con(alumnoId: string) {
      return { alumnoId: signal(alumnoId) };
    },
  };

  function inputEventConValor(valor: string): Event {
    return { target: { value: valor } } as unknown as Event;
  }

  async function givenUnEscenarioCon(opciones: {
    rol: Rol;
    alumnoIdEnContexto: string;
  }): Promise<void> {
    presenterSpy = PresenterMother.create();

    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['rol']);
    perfilServiceSpy.rol.and.returnValue(opciones.rol);

    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    Object.assign(usuarioServiceSpy, {
      esVistaAlumno: signal(opciones.rol === 'ALUMNO'),
      esVistaKiosquero: signal(opciones.rol === 'VENDEDOR'),
      nombreNavbar: signal(''),
    });

    await TestBed.configureTestingModule({
      imports: [BilleteraPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: ActivatedRouteMother.conAlumnoId(opciones.alumnoIdEnContexto || null),
        },
        {
          provide: AlumnoContextoService,
          useValue: AlumnoContextoMother.con(opciones.alumnoIdEnContexto),
        },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(BilleteraPage, {
        set: {
          template: '',
          providers: [{ provide: BilleteraPresenter, useValue: presenterSpy }],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();
  }

  function whenCreoElComponente() {
    const fixture = TestBed.createComponent(BilleteraPage);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  function invokeProtected<TArg>(
    component: BilleteraPage,
    metodo: 'cambiarFecha' | 'onDesdeChange' | 'onHastaChange',
    arg: TArg,
  ): void {
    (component as unknown as Record<string, (a: TArg) => void>)[metodo](arg);
  }

  function thenSeConfiguroHomeUrl(url: string): void {
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith(url);
  }

  function thenNoSeConfiguroHomeUrl(): void {
    expect(usuarioServiceSpy.setHomeUrl).not.toHaveBeenCalled();
  }

  function thenElPresenterSeInicializoCon(alumnoId: string | null): void {
    expect(presenterSpy.init).toHaveBeenCalledWith(alumnoId);
  }

  function thenElPresenterRecibio<M extends keyof PresenterSpy>(
    metodo: M,
    ...args: unknown[]
  ): void {
    expect(presenterSpy[metodo] as jasmine.Spy).toHaveBeenCalledWith(...args);
  }

  function thenSeSeteoRango(desde: string, hasta: string): void {
    expect(presenterSpy.setearRango).toHaveBeenCalledWith(desde, hasta);
  }
});
