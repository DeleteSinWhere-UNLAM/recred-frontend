import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { BilleteraPresenter, RangoFecha } from './billetera.presenter';
import { BilleteraService } from '../services/billetera.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import {
  BilleteraResumen,
  DireccionMovimiento,
  MovimientoBilletera,
} from '../models/billetera.model';

interface AlumnoMock {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  colegioId: string;
  saldo: number;
  urlFotoPerfil?: string;
}

describe('BilleteraPresenter', () => {
  let presenter: BilleteraPresenter;
  let billeteraServiceSpy: jasmine.SpyObj<BilleteraService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const ALUMNO_ID = 'alumno-1';

  beforeEach(() => {
    billeteraServiceSpy = jasmine.createSpyObj('BilleteraService', ['getResumen']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', [
      'getAlumnoActual',
      'esVistaAlumno',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    alumnosServiceSpy.asegurarCargados.and.resolveTo();
    givenUnAlumno();
    givenUnResumen();
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);
    usuarioServiceSpy.getAlumnoActual.and.returnValue(AlumnoMother.create());
    usuarioServiceSpy.esVistaAlumno.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        BilleteraPresenter,
        { provide: BilleteraService, useValue: billeteraServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    presenter = TestBed.inject(BilleteraPresenter);
  });

  describe('Inicialización y signals computadas', () => {
    it('dado un alumno con nombre, apellido y foto, cuando inicializo, deberia resolver nombre completo, iniciales y foto', fakeAsync(() => {
      givenUnAlumno({ nombre: 'Julián', apellido: 'García', urlFotoPerfil: 'foto.jpg' });

      whenInicializo(ALUMNO_ID);

      thenSeMuestraNombre('Juli', 'Garc');
      thenLasInicialesSon('JG');
      thenLaFotoEs('foto.jpg');
    }));

    it('dado un resumen con montos cargados, cuando inicializo, deberia formatearlos como moneda', fakeAsync(() => {
      givenUnResumen({ saldoActual: -100, montoIngresado: 3000, montoGastado: 1750 });

      whenInicializo(ALUMNO_ID);

      thenElSaldoEsNegativo();
      thenElMontoIngresadoContiene('3', '000');
      thenElMontoGastadoContiene('1', '750');
    }));

    it('dado un resumen con movimientos, categorias y clasificaciones, cuando inicializo, las banderas hay* deberian ser true', fakeAsync(() => {
      givenUnResumen({
        movimientos: [MovimientoMother.create()],
        gastoPorCategoria: [{ categoria: 'Golosinas', monto: 600, porcentaje: 30 }],
        gastoPorClasificacionSalud: [{ clasificacion: 'Saludable', monto: 900, porcentaje: 50 }],
      });

      whenInicializo(ALUMNO_ID);

      expect(presenter.hayMovimientos()).toBeTrue();
      expect(presenter.hayCategorias()).toBeTrue();
      expect(presenter.hayClasificacionSalud()).toBeTrue();
      expect(presenter.cantidadCompras()).toBe(8);
    }));

    it('dado que el alumno no existe en el cache, cuando inicializo, deberia devolver vacio en nombre, iniciales y foto', fakeAsync(() => {
      givenNingunAlumno();

      whenInicializo('alumno-desconocido');

      thenSeMuestraNombre('');
      thenLasInicialesSon('');
      thenLaFotoEs(null);
    }));

    it('dado que no hay alumno identificable, cuando inicializo con null, deberia setear error', fakeAsync(() => {
      givenQueNoHayAlumnoIdentificable();

      whenInicializo(null);

      thenSeMostroError('No se pudo identificar al alumno');
    }));

    it('dado que init recibe null y el perfil tiene alumnoId, cuando inicializo, deberia consultar al servicio con el id del perfil', fakeAsync(() => {
      givenQueElPerfilTieneAlumnoId('alumno-2');

      whenInicializo(null);

      thenSeLlamoGetResumenPara('alumno-2');
    }));

    it('dado un balance positivo, cuando inicializo, deberia marcar balancePositivo y formatear con "+"', fakeAsync(() => {
      givenUnResumen({ balancePeriodo: 500 });

      whenInicializo(ALUMNO_ID);

      expect(presenter.balancePositivo()).toBeTrue();
      expect(presenter.balancePeriodoFormateado()).toContain('+');
    }));

    it('dado un balance en cero, cuando inicializo, deberia formatear sin signo', fakeAsync(() => {
      givenUnResumen({ balancePeriodo: 0 });

      whenInicializo(ALUMNO_ID);

      expect(presenter.balancePositivo()).toBeTrue();
      expect(presenter.balancePeriodoFormateado()).not.toContain('+');
      expect(presenter.balancePeriodoFormateado()).not.toContain('-');
    }));

    it('dado un balance negativo, cuando inicializo, deberia formatear con "-"', fakeAsync(() => {
      givenUnResumen({ balancePeriodo: -500 });

      whenInicializo(ALUMNO_ID);

      expect(presenter.balancePositivo()).toBeFalse();
      expect(presenter.balancePeriodoFormateado()).toContain('-');
      expect(presenter.balancePeriodoFormateado()).toContain('500');
    }));
  });

  describe('Control de flujo y métodos asincrónicos', () => {
    it('dado que el servicio falla, cuando inicializo, deberia setear errorState y dejar cargando en false', fakeAsync(() => {
      givenQueElServicioFalla('API Error');

      whenInicializo(ALUMNO_ID);

      thenSeMostroError('No se pudo cargar la billetera');
      expect(presenter.cargando()).toBeFalse();
    }));

    it('dado un presenter ya inicializado, cuando recargo, deberia volver a llamar al servicio', fakeAsync(() => {
      whenInicializo(ALUMNO_ID);
      resetSpyResumen();

      presenter.recargar();

      thenSeLlamoGetResumenPara(ALUMNO_ID);
    }));

    it('dado un rango con fechas validas, cuando lo seteo, deberia marcarse custom y recargar', fakeAsync(() => {
      whenInicializo(ALUMNO_ID);
      resetSpyResumen();

      presenter.setearRango('2024-01-01', '2024-01-31');

      thenElRangoEs('custom');
      expect(presenter.desde()).toBe('2024-01-01');
      expect(presenter.hasta()).toBe('2024-01-31');
      thenSeLlamoGetResumenPara(ALUMNO_ID);
    }));

    it('dado un rango con fechas vacias, cuando lo seteo, no deberia llamar al servicio', fakeAsync(() => {
      whenInicializo(ALUMNO_ID);
      resetSpyResumen();

      presenter.setearRango('', '');

      thenElRangoEs('custom');
      thenNoSeLlamoAlServicio();
    }));

    it('dado cualquier rango predefinido, cuando lo elijo en cambiarFecha, deberia actualizar rangoFecha', fakeAsync(() => {
      whenInicializo(ALUMNO_ID);

      (['hoy', 'semana', 'mes', 'custom'] as RangoFecha[]).forEach((rango) => {
        presenter.cambiarFecha(rango);
        thenElRangoEs(rango);
      });
    }));

    it('dado que no hay alumno identificable, cuando recargo, no deberia llamar al servicio', fakeAsync(() => {
      givenQueNoHayAlumnoIdentificable();
      whenInicializo(null);
      resetSpyResumen();

      presenter.recargar();

      thenNoSeLlamoAlServicio();
    }));
  });

  describe('Formateadores y utilitarios', () => {
    it('dado un monto numerico, cuando formateo, deberia incluir partes esperadas como moneda', () => {
      const formateado = presenter.formatearMonto(1500);

      expect(formateado).toContain('1');
      expect(formateado).toContain('500');
    });

    it('dado un tipo de movimiento, deberia devolver el icono correspondiente', () => {
      thenElIconoEs('CARGA', 'fa-arrow-down');
      thenElIconoEs('COMPRA', 'fa-bag-shopping');
      thenElIconoEs('REEMBOLSO', 'fa-rotate-left');
      thenElIconoEs('TRANSFERENCIA', 'fa-right-left');
      thenElIconoEs('OTRO', 'fa-circle-info');
    });

    it('dado un movimiento, cuando lo formateo con signo, deberia anteponer "+" si entra y "-" si sale', () => {
      expect(presenter.formatearMontoConSigno(MovimientoMother.con('ENTRADA'))).toContain('+');
      expect(presenter.formatearMontoConSigno(MovimientoMother.con('SALIDA'))).toContain('-');
    });

    it('dado que estoy en vista alumno, cuando vuelvo, deberia navegar a /alumno', () => {
      givenQueEstoyEnVistaAlumno();

      presenter.volver();

      thenSeNavegoA('/alumno');
    });

    it('dado que estoy en vista tutor, cuando vuelvo, deberia navegar a /tutor', () => {
      givenQueEstoyEnVistaTutor();

      presenter.volver();

      thenSeNavegoA('/tutor');
    });

    it('dada una fecha ISO valida, cuando la formateo, deberia devolver una representacion no vacia', () => {
      const formateado = presenter.formatearFechaMovimiento('2024-06-15T12:00:00');
      expect(formateado.length).toBeGreaterThan(0);
    });

    it('dada una fecha invalida o vacia, cuando la formateo, deberia devolver string vacio', () => {
      expect(presenter.formatearFechaMovimiento('')).toBe('');
      expect(presenter.formatearFechaMovimiento('FECHA_MALA')).toBe('');
    });

    it('dado un resumen con periodo invalido, cuando inicializo, periodoLabel deberia ser vacio', fakeAsync(() => {
      givenUnResumen({ periodo: { desde: '', hasta: '' } });

      whenInicializo(ALUMNO_ID);

      expect(presenter.periodoLabel()).toBe('');
    }));
  });

  const AlumnoMother = {
    create(overrides: Partial<AlumnoMock> = {}): AlumnoMock {
      return {
        id: ALUMNO_ID,
        nombre: 'Nombre',
        apellido: 'Apellido',
        grado: '4to',
        colegioId: 'col-1',
        saldo: 0,
        urlFotoPerfil: undefined,
        ...overrides,
      };
    },
  };

  const MovimientoMother = {
    create(overrides: Partial<MovimientoBilletera> = {}): MovimientoBilletera {
      return {
        id: 'mov-1',
        fechaHora: '2026-06-14T10:15:00',
        tipo: 'COMPRA',
        descripcion: 'Compra en buffet',
        monto: 450,
        direccion: 'SALIDA',
        ...overrides,
      };
    },
    con(direccion: DireccionMovimiento): MovimientoBilletera {
      return this.create({ direccion, monto: 100 });
    },
  };

  const ResumenBilleteraMother = {
    create(overrides: Partial<BilleteraResumen> = {}): BilleteraResumen {
      return {
        alumnoId: ALUMNO_ID,
        saldoActual: 0,
        periodo: { desde: '2026-06-01', hasta: '2026-06-14' },
        montoIngresado: 0,
        montoGastado: 0,
        balancePeriodo: 0,
        cantidadCompras: 8,
        gastoPorCategoria: [],
        gastoPorClasificacionSalud: [],
        movimientos: [],
        ...overrides,
      };
    },
  };

  function givenUnAlumno(props: Partial<AlumnoMock> = {}): void {
    alumnosServiceSpy.getAlumnoById.and.returnValue(AlumnoMother.create(props) as never);
  }

  function givenNingunAlumno(): void {
    alumnosServiceSpy.getAlumnoById.and.returnValue(undefined as never);
  }

  function givenUnResumen(props: Partial<BilleteraResumen> = {}): void {
    billeteraServiceSpy.getResumen.and.returnValue(of(ResumenBilleteraMother.create(props)));
  }

  function givenQueElServicioFalla(mensaje: string): void {
    billeteraServiceSpy.getResumen.and.returnValue(
      throwError(() => new Error(mensaje)) as unknown as Observable<BilleteraResumen>,
    );
  }

  function givenQueNoHayAlumnoIdentificable(): void {
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);
    usuarioServiceSpy.getAlumnoActual.and.returnValue({ id: '' } as never);
  }

  function givenQueElPerfilTieneAlumnoId(id: string): void {
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(id);
  }

  function givenQueEstoyEnVistaAlumno(): void {
    usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
  }

  function givenQueEstoyEnVistaTutor(): void {
    usuarioServiceSpy.esVistaAlumno.and.returnValue(false);
  }

  function whenInicializo(idRuta: string | null): void {
    presenter.init(idRuta);
    tick();
  }

  function resetSpyResumen(): void {
    billeteraServiceSpy.getResumen.calls.reset();
  }

  function thenSeMuestraNombre(...partes: string[]): void {
    if (partes.length === 1 && partes[0] === '') {
      expect(presenter.nombreAlumno()).toBe('');
      return;
    }
    partes.forEach((parte) => expect(presenter.nombreAlumno()).toContain(parte));
  }

  function thenLasInicialesSon(esperado: string): void {
    expect(presenter.iniciales()).toBe(esperado);
  }

  function thenLaFotoEs(esperado: string | null): void {
    expect(presenter.urlFotoPerfil()).toBe(esperado);
  }

  function thenElSaldoEsNegativo(): void {
    expect(presenter.saldoNegativo()).toBeTrue();
  }

  function thenElMontoIngresadoContiene(...partes: string[]): void {
    partes.forEach((p) => expect(presenter.montoIngresadoFormateado()).toContain(p));
  }

  function thenElMontoGastadoContiene(...partes: string[]): void {
    partes.forEach((p) => expect(presenter.montoGastadoFormateado()).toContain(p));
  }

  function thenSeMostroError(mensaje: string): void {
    expect(presenter.error()).toBe(mensaje);
  }

  function thenSeLlamoGetResumenPara(alumnoId: string): void {
    expect(billeteraServiceSpy.getResumen).toHaveBeenCalledWith(
      alumnoId,
      jasmine.any(String),
      jasmine.any(String),
    );
  }

  function thenNoSeLlamoAlServicio(): void {
    expect(billeteraServiceSpy.getResumen).not.toHaveBeenCalled();
  }

  function thenElRangoEs(rango: RangoFecha): void {
    expect(presenter.rangoFecha()).toBe(rango);
  }

  function thenSeNavegoA(url: string): void {
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(url);
  }

  function thenElIconoEs(tipo: string, icono: string): void {
    expect(presenter.iconoMovimiento(tipo)).toBe(icono);
  }
});
