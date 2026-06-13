import { TestBed } from '@angular/core/testing';
import { CarritoPresenter } from './carrito.presenter';
import { Router } from '@angular/router';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { BuffetService } from '../../../buffet/services/buffet.service';
import { SugerenciasCarritoService } from '../../services/sugerencias-carrito.service';
import { CarritoService } from '../../services/carrito.service';
import { CompraService } from '../../services/compra.service';
import { PresupuestoService } from '../../../presupuesto/services/presupuesto.service';
import { RestriccionesHorariasService } from '../../../restricciones-horarias/services/restricciones-horarias.service';
import { FranjasHorariasService } from '../../../restricciones-horarias/services/franjas-horarias.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('CarritoPresenter', () => {
  let presenter: CarritoPresenter;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let compraServiceSpy: jasmine.SpyObj<CompraService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    carritoServiceSpy = jasmine.createSpyObj('CarritoService', [
      'itemsPorAlumno', 'seleccionRetiro', 'cargarPresupuestoYConsumo',
      'setCatalog', 'agregar', 'cambiarCantidad', 'quitar'
    ]);
    
    carritoServiceSpy.itemsPorAlumno.and.returnValue(new Map());
    carritoServiceSpy.seleccionRetiro.and.returnValue({});
    
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    alumnosServiceSpy.asegurarCargados.and.resolveTo([]);
    
    compraServiceSpy = jasmine.createSpyObj('CompraService', ['iniciarOrden']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    
    const usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['esVistaAlumno', 'homeUrl']);
    usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
    
    const perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['rol', 'obtenerAlumnoId']);
    perfilServiceSpy.rol.and.returnValue(signal('ALUMNO'));
    perfilServiceSpy.obtenerAlumnoId.and.returnValue('alumno-1');
    
    const buffetServiceSpy = jasmine.createSpyObj('BuffetService', ['obtenerBuffetDelAlumno', 'getBuffetDelAlumno', 'getProductosDelBuffet']);
    const sugerenciasCarritoSpy = jasmine.createSpyObj('SugerenciasCarritoService', ['obtenerSugerencias']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    
    const restriccionesSpy = jasmine.createSpyObj('RestriccionesHorariasService', ['getRestriccionesPorAlumno']);
    restriccionesSpy.getRestriccionesPorAlumno.and.resolveTo([]);
    
    const franjasSpy = jasmine.createSpyObj('FranjasHorariasService', ['getFranjasHorarias']);
    franjasSpy.getFranjasHorarias.and.resolveTo([]);
    
    const presupuestoSpy = jasmine.createSpyObj('PresupuestoService', ['checkBudgetDates']);
    presupuestoSpy.checkBudgetDates.and.resolveTo([]);

    TestBed.configureTestingModule({
      providers: [
        CarritoPresenter,
        { provide: CarritoService, useValue: carritoServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: CompraService, useValue: compraServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: BuffetService, useValue: buffetServiceSpy },
        { provide: SugerenciasCarritoService, useValue: sugerenciasCarritoSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: RestriccionesHorariasService, useValue: restriccionesSpy },
        { provide: FranjasHorariasService, useValue: franjasSpy },
        { provide: PresupuestoService, useValue: presupuestoSpy },
      ]
    });

    presenter = TestBed.inject(CarritoPresenter);
  });

  it('debería crearse', () => {
    expect(presenter).toBeTruthy();
  });

  describe('comportamiento inicial', () => {
    it('debería tener carritoVacio en true si no hay items', () => {
      expect(presenter.carritoVacio()).toBeTrue();
      expect(presenter.grupos().length).toBe(0);
    });

    it('avanzarPosible debería ser false inicialmente si está vacío', () => {
      expect(presenter.avanzarPosible()).toBeFalse();
    });
  });

  describe('validaciones de avance', () => {
    it('debería calcular grupos correctamente y permitir avanzar si todo está OK', () => {
      const mapa = new Map<string, any[]>();
      mapa.set('alumno-1', [
        {
          producto: { precio: 1000 },
          cantidad: 1,
          alumnoId: 'alumno-1'
        }
      ]);
      carritoServiceSpy.itemsPorAlumno.and.returnValue(mapa);
      
      alumnosServiceSpy.getAlumnoById.and.returnValue({
        id: 'alumno-1', nombre: 'Test', saldo: 2000, apellido: '', grado: '', colegioId: ''
      });
      
      // Simulamos que seleccionRetiro ya tiene fecha válida
      carritoServiceSpy.seleccionRetiro.and.returnValue({
        'alumno-1': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' } // 2050-01-03 es lunes
      });

      expect(presenter.grupos().length).toBe(1);
      expect(presenter.totalSeleccionado()).toBe(1000);
      expect(presenter.avanzarPosible()).toBeTrue();
    });

    it('no debería permitir avanzar si el saldo es insuficiente', () => {
      const mapa = new Map<string, any[]>();
      mapa.set('alumno-1', [
        {
          producto: { precio: 5000 },
          cantidad: 1,
          alumnoId: 'alumno-1'
        }
      ]);
      carritoServiceSpy.itemsPorAlumno.and.returnValue(mapa);
      
      alumnosServiceSpy.getAlumnoById.and.returnValue({
        id: 'alumno-1', nombre: 'Test', saldo: 1000, apellido: '', grado: '', colegioId: ''
      });
      
      carritoServiceSpy.seleccionRetiro.and.returnValue({
        'alumno-1': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' }
      });

      expect(presenter.advertencia()).toContain('saldo de Test no alcanza');
    });
  });

  describe('acciones', () => {
    it('debería llamar a iniciarOrden y navegar al avanzar', () => {
      const mapa = new Map<string, any[]>();
      mapa.set('alumno-1', [
        {
          producto: { precio: 1000 },
          cantidad: 1,
          alumnoId: 'alumno-1'
        }
      ]);
      carritoServiceSpy.itemsPorAlumno.and.returnValue(mapa);
      
      alumnosServiceSpy.getAlumnoById.and.returnValue({
        id: 'alumno-1', nombre: 'Test', saldo: 2000, apellido: '', grado: '', colegioId: ''
      });
      
      carritoServiceSpy.seleccionRetiro.and.returnValue({
        'alumno-1': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' }
      });

      presenter.avanzar();
      
      expect(compraServiceSpy.iniciarOrden).toHaveBeenCalled();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/compra/confirmar');
    });
  });
});
