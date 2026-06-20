import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError, of } from 'rxjs';
import { BilleteraPresenter } from './billetera.presenter';
import { BilleteraService } from '../services/billetera.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { BilleteraResumen } from '../models/billetera.model';

describe('BilleteraPresenter', () => {
  let presenter: BilleteraPresenter;
  let billeteraServiceSpy: jasmine.SpyObj<BilleteraService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const resumenMock: BilleteraResumen = {
    alumnoId: 'alumno-1',
    saldoActual: -100, // For saldoNegativo
    periodo: { desde: '2026-06-01', hasta: '2026-06-14' },
    montoIngresado: 3000,
    montoGastado: 1750,
    balancePeriodo: -500, // For balance negativo
    cantidadCompras: 8,
    gastoPorCategoria: [
      { categoria: 'Golosinas', monto: 600, porcentaje: 34.28 },
    ],
    gastoPorClasificacionSalud: [
      { clasificacion: 'Saludable', monto: 900, porcentaje: 51.43 },
    ],
    movimientos: [
      {
        id: 'mov-1',
        fechaHora: '2026-06-14T10:15:00',
        tipo: 'COMPRA',
        descripcion: 'Compra en buffet',
        monto: 450,
        direccion: 'SALIDA',
      },
    ],
  };

  beforeEach(() => {
    billeteraServiceSpy = jasmine.createSpyObj('BilleteraService', ['getResumen']);
    billeteraServiceSpy.getResumen.and.returnValue(of(resumenMock));

    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    alumnosServiceSpy.asegurarCargados.and.resolveTo();
    alumnosServiceSpy.getAlumnoById.and.returnValue({
      id: 'alumno-1',
      nombre: 'Julián',
      apellido: 'García',
      grado: '4to',
      colegioId: 'col-1',
      saldo: 1250,
      urlFotoPerfil: 'foto.jpg'
    });

    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);

    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getAlumnoActual', 'esVistaAlumno']);
    usuarioServiceSpy.getAlumnoActual.and.returnValue({
      id: 'alumno-1',
      nombre: 'Julián',
      apellido: 'García',
      grado: '4to',
      colegioId: 'col-1',
      saldo: 1250,
    });
    usuarioServiceSpy.esVistaAlumno.and.returnValue(true);

    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

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

  describe('Inicialización y Signals Computadas', () => {
    it('deberia resolver iniciales, nombre y foto correctamente si hay alumno', fakeAsync(() => {
      presenter.init('alumno-1');
      tick();
      expect(presenter.nombreAlumno()).toContain('Juli');
      expect(presenter.nombreAlumno()).toContain('Garc');
      expect(presenter.iniciales()).toBe('JG');
      expect(presenter.urlFotoPerfil()).toBe('foto.jpg');
      
      expect(presenter.saldoActualFormateado()).toContain('100'); // -100 formated absolute value logic is standard but we check string exists
      expect(presenter.saldoNegativo()).toBeTrue();
      expect(presenter.montoIngresadoFormateado()).toContain('3');
      expect(presenter.montoIngresadoFormateado()).toContain('000');
      expect(presenter.montoGastadoFormateado()).toContain('1');
      expect(presenter.montoGastadoFormateado()).toContain('750');
      expect(presenter.balancePositivo()).toBeFalse(); // Porque el mock tiene balance -500
      expect(presenter.balancePeriodoFormateado()).toContain('-');
      expect(presenter.balancePeriodoFormateado()).toContain('500'); // balance format
      expect(presenter.cantidadCompras()).toBe(8);
      expect(presenter.periodoLabel()).toContain('2026'); // Validar formato fecha periodo
      
      expect(presenter.hayMovimientos()).toBeTrue();
      expect(presenter.hayCategorias()).toBeTrue();
      expect(presenter.hayClasificacionSalud()).toBeTrue();
    }));

    it('deberia devolver vacio si no hay alumno en signals', fakeAsync(() => {
      alumnosServiceSpy.getAlumnoById.and.returnValue(undefined);
      presenter.init('alumno-desc');
      tick();
      expect(presenter.nombreAlumno()).toBe('');
      expect(presenter.iniciales()).toBe('');
      expect(presenter.urlFotoPerfil()).toBeNull();
    }));

    it('deberia setear error si no se pudo identificar alumno', fakeAsync(() => {
      perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);
      usuarioServiceSpy.getAlumnoActual.and.returnValue({} as any); // sin ID
      presenter.init(null);
      tick();
      expect(presenter.error()).toBe('No se pudo identificar al alumno');
    }));

    it('deberia usar desdePerfil si init recibe null', fakeAsync(() => {
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('alumno-2');
      presenter.init(null);
      tick();
      expect(billeteraServiceSpy.getResumen).toHaveBeenCalledWith('alumno-2', jasmine.any(String), jasmine.any(String));
    }));

    it('deberia retornar balance positivo y formato con "+" si balance > 0', fakeAsync(() => {
      billeteraServiceSpy.getResumen.and.returnValue(of({ ...resumenMock, balancePeriodo: 500 }));
      presenter.init('alumno-1');
      tick();
      expect(presenter.balancePositivo()).toBeTrue();
      expect(presenter.balancePeriodoFormateado()).toContain('+');
    }));
    
    it('deberia formatear balance como 0 si no hay resumen o balance es 0', fakeAsync(() => {
      billeteraServiceSpy.getResumen.and.returnValue(of({ ...resumenMock, balancePeriodo: 0 }));
      presenter.init('alumno-1');
      tick();
      expect(presenter.balancePositivo()).toBeTrue();
      expect(presenter.balancePeriodoFormateado()).not.toContain('+');
      expect(presenter.balancePeriodoFormateado()).not.toContain('-');
    }));
  });

  describe('Metodos de control de flujo y asincronos', () => {
    it('dado que falla getResumen deberia asignar errorState', fakeAsync(() => {
      billeteraServiceSpy.getResumen.and.returnValue(throwError(() => new Error('API Error')));
      presenter.init('alumno-1');
      tick();
      expect(presenter.error()).toBe('No se pudo cargar la billetera');
      expect(presenter.cargando()).toBeFalse();
    }));

    it('dado que se llama a recargar deberia disparar peticion', fakeAsync(() => {
      presenter.init('alumno-1');
      tick();
      billeteraServiceSpy.getResumen.calls.reset();
      presenter.recargar();
      expect(billeteraServiceSpy.getResumen).toHaveBeenCalled();
    }));

    it('dado que se llama a setearRango con datos, deberia cargarResumen y ser custom', fakeAsync(() => {
      presenter.init('alumno-1');
      tick();
      billeteraServiceSpy.getResumen.calls.reset();
      presenter.setearRango('2024-01-01', '2024-01-31');
      expect(presenter.rangoFecha()).toBe('custom');
      expect(presenter.desde()).toBe('2024-01-01');
      expect(presenter.hasta()).toBe('2024-01-31');
      expect(billeteraServiceSpy.getResumen).toHaveBeenCalled();
    }));

    it('dado que se llama a setearRango sin datos validos, deberia fallar sin llamar getResumen', fakeAsync(() => {
      presenter.init('alumno-1');
      tick();
      billeteraServiceSpy.getResumen.calls.reset();
      presenter.setearRango('', '');
      expect(presenter.rangoFecha()).toBe('custom');
      expect(billeteraServiceSpy.getResumen).not.toHaveBeenCalled();
    }));

    it('dado que se llama a cambiarFecha con rangos definidos, deberia calcular desde/hasta', fakeAsync(() => {
      presenter.init('alumno-1');
      tick();
      
      presenter.cambiarFecha('hoy');
      expect(presenter.rangoFecha()).toBe('hoy');
      
      presenter.cambiarFecha('semana');
      expect(presenter.rangoFecha()).toBe('semana');

      presenter.cambiarFecha('mes');
      expect(presenter.rangoFecha()).toBe('mes');
      
      presenter.cambiarFecha('custom');
      expect(presenter.rangoFecha()).toBe('custom'); // custom no triggerea aplicarRangoFecha por si solo
    }));

    it('dado que getResumen no es disparado cuando id es vacio en cargarResumen', fakeAsync(() => {
      // Forzar que alumnoId quede en vacio internamente y llamar a cargarResumen manual para cobertura full
      perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);
      usuarioServiceSpy.getAlumnoActual.and.returnValue({} as any); 
      presenter.init(null);
      tick();
      billeteraServiceSpy.getResumen.calls.reset();
      presenter.recargar();
      expect(billeteraServiceSpy.getResumen).not.toHaveBeenCalled();
    }));
  });

  describe('Formateadores y Utilitarios', () => {
    it('deberia formatear montos simples', () => {
      expect(presenter.formatearMonto(1500)).toContain('1');
      expect(presenter.formatearMonto(1500)).toContain('500');
    });

    it('deberia dar iconos correctos segun tipo de movimiento', () => {
      expect(presenter.iconoMovimiento('CARGA')).toBe('fa-arrow-down');
      expect(presenter.iconoMovimiento('COMPRA')).toBe('fa-bag-shopping');
      expect(presenter.iconoMovimiento('REEMBOLSO')).toBe('fa-rotate-left');
      expect(presenter.iconoMovimiento('TRANSFERENCIA')).toBe('fa-right-left');
      expect(presenter.iconoMovimiento('OTRO')).toBe('fa-circle-info');
    });

    it('deberia formatearMontoConSigno correctamente', () => {
       expect(presenter.formatearMontoConSigno({ direccion: 'ENTRADA', monto: 100 } as any)).toContain('+');
       expect(presenter.formatearMontoConSigno({ direccion: 'SALIDA', monto: 100 } as any)).toContain('-');
    });

    it('deberia navegar correcto en volver()', () => {
      usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
      presenter.volver();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/alumno');
      
      routerSpy.navigateByUrl.calls.reset();
      usuarioServiceSpy.esVistaAlumno.and.returnValue(false);
      presenter.volver();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
    
    it('deberia parsear fecha en formatearFechaMovimiento', () => {
      const formatted = presenter.formatearFechaMovimiento('2024-06-15T12:00:00');
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('deberia retornar string vacio al formatearFechaMovimiento con fecha invalida', () => {
      expect(presenter.formatearFechaMovimiento('')).toBe('');
      expect(presenter.formatearFechaMovimiento('FECHA_MALA')).toBe('');
    });
    
    it('deberia retornar string vacio si periodoLabel con resumen invalido', fakeAsync(() => {
       // resumen state con periodo que tiene fechas no validas o vacias
       billeteraServiceSpy.getResumen.and.returnValue(of({ ...resumenMock, periodo: { desde: '', hasta: '' } }));
       presenter.init('alumno-1');
       tick();
       expect(presenter.periodoLabel()).toBe('');
    }));
  });
});
