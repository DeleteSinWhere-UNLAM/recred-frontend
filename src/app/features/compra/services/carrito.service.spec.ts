import { TestBed } from '@angular/core/testing';
import { CarritoService } from './carrito.service';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { of } from 'rxjs';
import { Producto } from '../../buffet/models/producto.model';
import { Presupuesto } from '../../presupuesto/models/presupuesto.model';

describe('CarritoService', () => {
  let service: CarritoService;
  let presupuestoServiceSpy: jasmine.SpyObj<PresupuestoService>;
  let movimientosServiceSpy: jasmine.SpyObj<MovimientosService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;

  const mockProductoBase: Producto = {
    id: 'prod-123',
    nombre: 'Sándwich',
    descripcion: 'Delicioso tostado',
    precio: 1000,
    categoria: { id: 'comidas', descripcion: 'Comidas' },
    clasificacionesSalud: [],
    imagen: 'sandwich.jpg',
    estadoStock: 'DISPONIBLE',
  };

  beforeEach(() => {
    presupuestoServiceSpy = jasmine.createSpyObj('PresupuestoService', ['getPresupuesto']);
    movimientosServiceSpy = jasmine.createSpyObj('MovimientosService', ['getHistorialAlumno']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);

    TestBed.configureTestingModule({
      providers: [
        CarritoService,
        { provide: PresupuestoService, useValue: presupuestoServiceSpy },
        { provide: MovimientosService, useValue: movimientosServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
      ]
    });

    service = TestBed.inject(CarritoService);
  });

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  describe('validarAgregar', () => {
    it('debería retornar rechazado por presupuesto si el producto tiene superaPresupuesto en true', () => {
      const p = { ...mockProductoBase, superaPresupuesto: true };
      const res = service.validarAgregar(p, 'alumno-1', 1);
      expect(res.permitido).toBeFalse();
      expect(res.razon).toBe('presupuesto');
    });

    it('debería retornar rechazado por saldo si excede la billetera del alumno (sin presupuesto)', () => {
      alumnosServiceSpy.getAlumnoById.and.returnValue({
        id: 'alumno-1',
        nombre: 'Test',
        apellido: 'Test',
        grado: '4to',
        colegioId: '1',
        saldo: 800
      });

      const p = { ...mockProductoBase, precio: 1000 };
      const res = service.validarAgregar(p, 'alumno-1', 1);
      
      expect(res.permitido).toBeFalse();
      expect(res.razon).toBe('saldo');
    });

    it('debería retornar permitido si el saldo es suficiente (sin presupuesto)', () => {
      alumnosServiceSpy.getAlumnoById.and.returnValue({
        id: 'alumno-1',
        nombre: 'Test',
        apellido: 'Test',
        grado: '4to',
        colegioId: '1',
        saldo: 1500
      });

      const p = { ...mockProductoBase, precio: 1000 };
      const res = service.validarAgregar(p, 'alumno-1', 1);
      
      expect(res.permitido).toBeTrue();
    });

    it('debería calcular el total acumulado en carrito y validar saldo', () => {
      alumnosServiceSpy.getAlumnoById.and.returnValue({
        id: 'alumno-1',
        nombre: 'Test',
        apellido: 'Test',
        grado: '4to',
        colegioId: '1',
        saldo: 1500
      });

      const p = { ...mockProductoBase, precio: 1000 };
      
      service.agregar(p, 'alumno-1', 1);
      
      const res = service.validarAgregar(p, 'alumno-1', 1);
      
      expect(res.permitido).toBeFalse();
      expect(res.razon).toBe('saldo');
    });

    it('debería rechazar por categoría si excede el presupuesto específico de una categoría', async () => {
      const budget: Presupuesto = {
        id: 'budget-1',
        fechaInicio: '2026-06-01',
        alumnoId: 'alumno-1',
        activo: true,
        periodo: 'SEMANAL',
        montoLimiteGeneral: 5000,
        reglasCategoria: [
          { id: 'rule-1', categoriaId: 'comidas', descripcionCategoria: 'Comidas', porcentajeLimite: 20, montoLimiteCalculado: 1000, activo: true }
        ]
      };

      presupuestoServiceSpy.getPresupuesto.and.resolveTo(budget);
      movimientosServiceSpy.getHistorialAlumno.and.returnValue(of([]));
      alumnosServiceSpy.getAlumnoById.and.returnValue({ id: 'alumno-1', nombre: 'Test', apellido: 'Test', grado: '4to', colegioId: '1', saldo: 10000 });

      await service.cargarPresupuestoYConsumo('alumno-1');

      const p = { ...mockProductoBase, precio: 1200 };
      const res = service.validarAgregar(p, 'alumno-1', 1);
      
      expect(res.permitido).toBeFalse();
      expect(res.razon).toBe('categoria');
    });

    it('debería rechazar por presupuesto general si excede el monto limite general', async () => {
      const budget: Presupuesto = {
        id: 'budget-1',
        fechaInicio: '2026-06-01',
        alumnoId: 'alumno-1',
        activo: true,
        periodo: 'SEMANAL',
        montoLimiteGeneral: 5000,
        reglasCategoria: []
      };

      presupuestoServiceSpy.getPresupuesto.and.resolveTo(budget);
      movimientosServiceSpy.getHistorialAlumno.and.returnValue(of([]));
      alumnosServiceSpy.getAlumnoById.and.returnValue({ id: 'alumno-1', nombre: 'Test', apellido: 'Test', grado: '4to', colegioId: '1', saldo: 10000 });

      await service.cargarPresupuestoYConsumo('alumno-1');

      const p = { ...mockProductoBase, precio: 6000 };
      const res = service.validarAgregar(p, 'alumno-1', 1);
      
      expect(res.permitido).toBeFalse();
      expect(res.razon).toBe('presupuesto');
    });
  });

  describe('manipulación del carrito', () => {
    it('debería agregar un producto', () => {
      service.agregar(mockProductoBase, 'alumno-1', 1);
      expect(service.cantidadTotal()).toBe(1);
      expect(service.totalARS()).toBe(1000);
      expect(service.itemsPorAlumno().get('alumno-1')?.length).toBe(1);
    });

    it('debería agrupar el mismo producto en el carrito si se suma cantidad', () => {
      service.agregar(mockProductoBase, 'alumno-1', 1);
      service.agregar(mockProductoBase, 'alumno-1', 2);
      
      expect(service.cantidadTotal()).toBe(3);
      expect(service.totalARS()).toBe(3000);
      
      const itemsAlumno = service.itemsPorAlumno().get('alumno-1');
      expect(itemsAlumno?.length).toBe(1);
      expect(itemsAlumno![0].cantidad).toBe(3);
    });

    it('debería permitir cambiar la cantidad de un item existente', () => {
      service.agregar(mockProductoBase, 'alumno-1', 1);
      const itemsAlumno = service.itemsPorAlumno().get('alumno-1');
      const itemId = itemsAlumno![0].id;
      
      service.cambiarCantidad(itemId, 1);
      expect(service.cantidadTotal()).toBe(2);
    });

    it('debería permitir quitar un producto', () => {
      service.agregar(mockProductoBase, 'alumno-1', 1);
      const itemsAlumno = service.itemsPorAlumno().get('alumno-1');
      const itemId = itemsAlumno![0].id;
      
      service.quitar(itemId);
      expect(service.cantidadTotal()).toBe(0);
    });
    
    it('debería limpiar el carrito de un alumno específico', () => {
      service.agregar(mockProductoBase, 'alumno-1', 1);
      service.agregar(mockProductoBase, 'alumno-2', 1);
      
      service.limpiarAlumno('alumno-1');
      
      expect(service.cantidadTotal()).toBe(1);
      expect(service.itemsPorAlumno().has('alumno-1')).toBeFalse();
      expect(service.itemsPorAlumno().has('alumno-2')).toBeTrue();
    });

    it('debería limpiar todo el carrito', () => {
      service.agregar(mockProductoBase, 'alumno-1', 1);
      service.agregar(mockProductoBase, 'alumno-2', 1);
      
      service.limpiar();
      
      expect(service.cantidadTotal()).toBe(0);
    });
  });

  describe('selección de retiro', () => {
    it('debería permitir setear y obtener selección de retiro por alumno', () => {
      service.setSeleccionRetiro('alumno-1', '2026-06-14', 'PRIMER_RECREO');
      
      const seleccion = service.getSeleccionRetiro('alumno-1');
      expect(seleccion?.fecha).toBe('2026-06-14');
      expect(seleccion?.recreo).toBe('PRIMER_RECREO');
    });

    it('debería permitir limpiar selección de retiro', () => {
      service.setSeleccionRetiro('alumno-1', '2026-06-14', 'PRIMER_RECREO');
      
      service.clearSeleccionRetiro('alumno-1');
      expect(service.getSeleccionRetiro('alumno-1')).toBeUndefined();
    });
  });
});
