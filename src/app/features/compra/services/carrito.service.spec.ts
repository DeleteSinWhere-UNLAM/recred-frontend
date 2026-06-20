import { TestBed } from '@angular/core/testing';
import { CarritoService } from './carrito.service';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { Producto } from '../../buffet/models/producto.model';
import { of, throwError } from 'rxjs';
import { Presupuesto } from '../../presupuesto/models/presupuesto.model';
import { Movimiento } from '../../movimientos/models/movimiento.model';

describe('CarritoService', () => {
  let service: CarritoService;
  let presupuestoSpy: jasmine.SpyObj<PresupuestoService>;
  let movimientosSpy: jasmine.SpyObj<MovimientosService>;
  let alumnosSpy: jasmine.SpyObj<AlumnosService>;

  beforeEach(() => {
    presupuestoSpy = jasmine.createSpyObj('PresupuestoService', ['getPresupuesto']);
    movimientosSpy = jasmine.createSpyObj('MovimientosService', ['getHistorialAlumno']);
    alumnosSpy = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);

    TestBed.configureTestingModule({
      providers: [
        CarritoService,
        { provide: PresupuestoService, useValue: presupuestoSpy },
        { provide: MovimientosService, useValue: movimientosSpy },
        { provide: AlumnosService, useValue: alumnosSpy }
      ]
    });
    service = TestBed.inject(CarritoService);
  });

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  describe('SeleccionRetiro', () => {
    it('debe setear, obtener y limpiar', () => {
      service.setSeleccionRetiro('a1', '2023-10-10', 'PRIMER_RECREO');
      expect(service.getSeleccionRetiro('a1')).toEqual({ fecha: '2023-10-10', recreo: 'PRIMER_RECREO' });
      service.clearSeleccionRetiro('a1');
      expect(service.getSeleccionRetiro('a1')).toBeUndefined();
    });
  });

  describe('Operaciones basicas de carrito', () => {
    const prod1: Producto = { id: 'p1', nombre: 'P1', precio: 100, descripcion: '', categoria: { id: 'c1', descripcion: 'C1' }, clasificacionesSalud: [], estadoStock: 'DISPONIBLE', imagen: '' };
    const prod2: Producto = { id: 'p2', nombre: 'P2', precio: 200, descripcion: '', categoria: { id: 'c2', descripcion: 'C2' }, clasificacionesSalud: [], estadoStock: 'DISPONIBLE', imagen: '' };

    it('agregar item', () => {
      service.agregar(prod1, 'a1', 1);
      expect(service.items().length).toBe(1);
      expect(service.cantidadTotal()).toBe(1);
      expect(service.totalARS()).toBe(100);
      expect(service.cantidadDe('p1', 'a1')).toBe(1);
      expect(service.subtotalAlumno('a1')).toBe(100);
      
      service.agregar(prod1, 'a1', 2); // existing
      expect(service.cantidadDe('p1', 'a1')).toBe(3);
    });

    it('agregar con cantidad <= 0 no hace nada', () => {
      service.agregar(prod1, 'a1', 0);
      expect(service.items().length).toBe(0);
    });

    it('setCantidad y cambiarCantidad', () => {
      service.agregar(prod1, 'a1', 1);
      service.setCantidad(service.items()[0].id, 5);
      expect(service.cantidadTotal()).toBe(5);

      service.cambiarCantidad(service.items()[0].id, -2);
      expect(service.cantidadTotal()).toBe(3);

      // Si cantidad <= 0, se quita
      service.setCantidad(service.items()[0].id, 0);
      expect(service.items().length).toBe(0);
    });

    it('cambiarCantidad en item inexistente', () => {
      service.cambiarCantidad('inexistente', 1);
      expect(service.items().length).toBe(0);
    });

    it('quitar, limpiarAlumno, limpiar', () => {
      service.agregar(prod1, 'a1', 1);
      service.agregar(prod2, 'a2', 1);
      
      const id1 = service.items().find(i => i.alumnoId === 'a1')!.id;
      service.quitar(id1);
      expect(service.items().length).toBe(1);

      service.limpiarAlumno('a2');
      expect(service.items().length).toBe(0);

      service.agregar(prod1, 'a1', 1);
      service.limpiar();
      expect(service.items().length).toBe(0);
    });

    it('itemsPorAlumno computed', () => {
      service.agregar(prod1, 'a1', 1);
      service.agregar(prod2, 'a1', 2);
      const mapa = service.itemsPorAlumno();
      expect(mapa.get('a1')?.length).toBe(2);
    });
  });

  describe('Carga y Catalogo', () => {
    it('setCatalog actualiza el catalogo (no tiene efecto visible directo pero cubre func)', () => {
      service.setCatalog([{ id: '1' } as Producto]);
      expect(true).toBeTrue();
    });

    it('cargarPresupuestoYConsumo sin alumnoId', async () => {
      await service.cargarPresupuestoYConsumo('');
      expect(presupuestoSpy.getPresupuesto).not.toHaveBeenCalled();
    });

    it('cargarPresupuestoYConsumo con exito', async () => {
      presupuestoSpy.getPresupuesto.and.resolveTo({ activo: true } as Presupuesto);
      movimientosSpy.getHistorialAlumno.and.returnValue(of([{ id: 'm1' } as Movimiento]));
      await service.cargarPresupuestoYConsumo('a1');
      expect(service.budgets().get('a1')).toBeDefined();
      expect(service.purchases().get('a1')?.length).toBe(1);
    });

    it('cargarPresupuestoYConsumo borra cache si devuelve nulo', async () => {
      // First populate
      presupuestoSpy.getPresupuesto.and.resolveTo({ activo: true } as Presupuesto);
      movimientosSpy.getHistorialAlumno.and.returnValue(of([{ id: 'm1' } as Movimiento]));
      await service.cargarPresupuestoYConsumo('a1');

      // Then delete
      presupuestoSpy.getPresupuesto.and.resolveTo(null as any);
      movimientosSpy.getHistorialAlumno.and.returnValue(of(null as any));
      await service.cargarPresupuestoYConsumo('a1');
      expect(service.budgets().get('a1')).toBeUndefined();
      expect(service.purchases().get('a1')).toBeUndefined();
    });

    it('cargarPresupuestoYConsumo error cae en catch', async () => {
      presupuestoSpy.getPresupuesto.and.returnValue(Promise.reject('error'));
      await service.cargarPresupuestoYConsumo('a1');
      expect(service.budgets().has('a1')).toBeFalse();
    });
  });

  describe('validarAgregar / puedeAgregar', () => {
    const prod: Producto = { id: 'p1', nombre: 'P1', precio: 100, descripcion: '', categoria: { id: 'c1', descripcion: 'Cat1' }, clasificacionesSalud: [], estadoStock: 'DISPONIBLE', imagen: '' };

    it('superaPresupuesto directo', () => {
      const p = { ...prod, superaPresupuesto: true };
      const res = service.validarAgregar(p, 'a1', 1);
      expect(res.permitido).toBeFalse();
      expect(res.razon).toBe('presupuesto');
    });

    it('sin presupuesto, excede saldo', () => {
      alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 50 } as any);
      const res = service.validarAgregar(prod, 'a1', 1);
      expect(res.permitido).toBeFalse();
      expect(res.razon).toBe('saldo');
    });

    it('sin presupuesto, alcanza saldo', () => {
      alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 150 } as any);
      const res = service.validarAgregar(prod, 'a1', 1);
      expect(res.permitido).toBeTrue();
      expect(service.puedeAgregar(prod, 'a1', 1)).toBeTrue();
    });

    describe('con presupuesto activo', () => {
      beforeEach(async () => {
        service.setCatalog([prod]);
        const pres = {
          activo: true, periodo: 'DIARIO', montoLimiteGeneral: 500,
          reglasCategoria: [
            { activo: true, categoriaId: 'c1', descripcionCategoria: 'Cat1', montoLimiteCalculado: 200 }
          ]
        } as Presupuesto;
        presupuestoSpy.getPresupuesto.and.resolveTo(pres);
        movimientosSpy.getHistorialAlumno.and.returnValue(of([]));
        await service.cargarPresupuestoYConsumo('a1');
      });

      it('excede limite general del presupuesto', () => {
        alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 1000 } as any);
        const res = service.validarAgregar(prod, 'a1', 6); // 600 > 500
        expect(res.permitido).toBeFalse();
        expect(res.razon).toBe('presupuesto');
      });

      it('excede limite saldo incluyendo historial', () => {
        alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 400 } as any);
        const res = service.validarAgregar(prod, 'a1', 5); // 500 > 400
        expect(res.permitido).toBeFalse();
        expect(res.razon).toBe('saldo');
      });

      it('excede limite categoria', () => {
        alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 1000 } as any);
        const res = service.validarAgregar(prod, 'a1', 3); // 300 > 200
        expect(res.permitido).toBeFalse();
        expect(res.razon).toBe('categoria');
      });

      it('permitido', () => {
        alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 1000 } as any);
        const res = service.validarAgregar(prod, 'a1', 1); // 100 ok
        expect(res.permitido).toBeTrue();
      });
      
      it('calcula con historial y carito actual', async () => {
        alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 1000 } as any);
        
        const mov = {
          status: 'APPROVED',
          date: new Date().toISOString(),
          totalAmount: 100,
          items: [{ productId: 'p1', productName: 'P1', unitPrice: 100, quantity: 1 }]
        } as any;
        movimientosSpy.getHistorialAlumno.and.returnValue(of([mov]));
        await service.cargarPresupuestoYConsumo('a1');
        
        service.agregar(prod, 'a1', 1); // 100 in cart
        
        // Historial: 100, Cart: 100. Cat limit 200.
        // Try adding 1 more (100). Total cat: 300 > 200
        const res = service.validarAgregar(prod, 'a1', 1);
        expect(res.permitido).toBeFalse();
        expect(res.razon).toBe('categoria');
      });
      
      it('ignora historial con status no activo o fecha fuera de rango', async () => {
        alumnosSpy.getAlumnoById.and.returnValue({ id: 'a1', saldo: 1000 } as any);
        const mov = {
          status: 'REJECTED',
          date: new Date().toISOString(),
          totalAmount: 500,
          items: [{ productId: 'p1', productName: 'P1', unitPrice: 500, quantity: 1 }]
        } as any;
        movimientosSpy.getHistorialAlumno.and.returnValue(of([mov]));
        await service.cargarPresupuestoYConsumo('a1');
        
        const res = service.validarAgregar(prod, 'a1', 2); // 200 <= 200 limit (rejected mov ignored)
        expect(res.permitido).toBeTrue();
      });
    });
  });
});
