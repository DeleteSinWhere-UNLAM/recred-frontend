import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { Presupuesto } from '../../presupuesto/models/presupuesto.model';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { Movimiento } from '../../movimientos/models/movimiento.model';
import { ProductoMother } from '../compra.mother';
import { CarritoService } from './carrito.service';

describe('CarritoService', () => {
  let service: CarritoService;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;

  beforeEach(() => {
    servicioPresupuesto = jasmine.createSpyObj('PresupuestoService', ['getPresupuesto']);
    servicioMovimientos = jasmine.createSpyObj('MovimientosService', ['getHistorialAlumno']);
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);
    servicioMovimientos.getHistorialAlumno.and.returnValue(of([]));

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CarritoService,
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: AlumnosService, useValue: servicioAlumnos },
      ],
    });

    service = TestBed.inject(CarritoService);
  });

  afterEach(() => localStorage.clear());

  describe('manipulacion basica del carrito', () => {
    it('dado un producto nuevo, cuando lo agrego, deberia sumar cantidad y total', () => {
      whenAgrego(ProductoMother.crear(), 'alumno-1', 1);

      expect(service.cantidadTotal()).toBe(1);
      expect(service.totalARS()).toBe(500);
      expect(service.itemsPorAlumno().get('alumno-1')?.length).toBe(1);
    });

    it('dado el mismo producto agregado dos veces al mismo alumno, deberia consolidarlo en un item con cantidad sumada', () => {
      const producto = ProductoMother.crear({ precio: 1000 });

      whenAgrego(producto, 'alumno-1', 1);
      whenAgrego(producto, 'alumno-1', 2);

      expect(service.cantidadTotal()).toBe(3);
      expect(service.totalARS()).toBe(3000);
      expect(service.itemsPorAlumno().get('alumno-1')?.length).toBe(1);
    });

    it('dado un item existente, cuando cambio la cantidad con +1, deberia sumar uno', () => {
      whenAgrego(ProductoMother.crear(), 'alumno-1', 1);
      const itemId = primerItemDe('alumno-1');

      service.cambiarCantidad(itemId, 1);

      expect(service.cantidadTotal()).toBe(2);
    });

    it('dado un item existente, cuando lo quito, deberia dejar el carrito sin items', () => {
      whenAgrego(ProductoMother.crear(), 'alumno-1', 1);
      const itemId = primerItemDe('alumno-1');

      service.quitar(itemId);

      expect(service.cantidadTotal()).toBe(0);
    });

    it('dado dos alumnos con items, cuando limpio uno, deberia dejar solo los del otro', () => {
      whenAgrego(ProductoMother.crear(), 'alumno-1', 1);
      whenAgrego(ProductoMother.crear(), 'alumno-2', 1);

      service.limpiarAlumno('alumno-1');

      expect(service.cantidadTotal()).toBe(1);
      expect(service.itemsPorAlumno().has('alumno-1')).toBeFalse();
      expect(service.itemsPorAlumno().has('alumno-2')).toBeTrue();
    });

    it('dado items de varios alumnos, cuando limpio todo, deberia quedar el carrito vacio', () => {
      whenAgrego(ProductoMother.crear(), 'alumno-1', 1);
      whenAgrego(ProductoMother.crear(), 'alumno-2', 1);

      service.limpiar();

      expect(service.cantidadTotal()).toBe(0);
    });
  });

  describe('seleccion de retiro', () => {
    it('dado un alumno, cuando seteo su retiro, deberia poder recuperarlo por alumno', () => {
      service.setSeleccionRetiro('alumno-1', '2026-06-14', 'PRIMER_RECREO');

      const seleccion = service.getSeleccionRetiro('alumno-1');
      expect(seleccion?.fecha).toBe('2026-06-14');
      expect(seleccion?.recreo).toBe('PRIMER_RECREO');
    });

    it('dado un retiro seteado, cuando lo limpio, deberia quedar undefined', () => {
      service.setSeleccionRetiro('alumno-1', '2026-06-14', 'PRIMER_RECREO');

      service.clearSeleccionRetiro('alumno-1');

      expect(service.getSeleccionRetiro('alumno-1')).toBeUndefined();
    });
  });

  describe('validarAgregar', () => {
    it('dado un producto marcado como superaPresupuesto, cuando valido, deberia rechazar por presupuesto', () => {
      const producto = ProductoMother.crear({ superaPresupuesto: true });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeFalse();
      expect(resultado.razon).toBe('presupuesto');
    });

    it('dado un alumno sin presupuesto y saldo insuficiente, cuando valido, deberia rechazar por saldo', () => {
      givenAlumnoConSaldo('alumno-1', 800);
      const producto = ProductoMother.crear({ precio: 1000 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeFalse();
      expect(resultado.razon).toBe('saldo');
    });

    it('dado un alumno sin presupuesto y saldo suficiente, cuando valido, deberia permitirlo', () => {
      givenAlumnoConSaldo('alumno-1', 1500);
      const producto = ProductoMother.crear({ precio: 1000 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeTrue();
    });

    it('dado el carrito ya usa el saldo del alumno, cuando valido agregar otro, deberia rechazar por saldo', () => {
      givenAlumnoConSaldo('alumno-1', 1500);
      const producto = ProductoMother.crear({ precio: 1000 });
      service.agregar(producto, 'alumno-1', 1);

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeFalse();
      expect(resultado.razon).toBe('saldo');
    });

    it('dado un presupuesto por categoria excedido, cuando valido, deberia rechazar por categoria', async () => {
      await givenPresupuestoCon({
        montoLimiteGeneral: 5000,
        reglasCategoria: [
          {
            id: 'rule-1',
            categoriaId: 'comidas',
            descripcionCategoria: 'Comidas',
            porcentajeLimite: 20,
            montoLimiteCalculado: 1000,
            activo: true,
          },
        ],
      });
      const producto = ProductoMother.crear({ precio: 1200 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeFalse();
      expect(resultado.razon).toBe('categoria');
    });

    it('dado el monto excede el limite general del presupuesto, cuando valido, deberia rechazar por presupuesto', async () => {
      await givenPresupuestoCon({ montoLimiteGeneral: 5000, reglasCategoria: [] });
      const producto = ProductoMother.crear({ precio: 6000 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeFalse();
      expect(resultado.razon).toBe('presupuesto');
    });

    it('dado un presupuesto vigente, puedeAgregar deberia delegar a validarAgregar', async () => {
      await givenPresupuestoCon({ montoLimiteGeneral: 5000, reglasCategoria: [] });
      const producto = ProductoMother.crear({ precio: 200 });

      expect(service.puedeAgregar(producto, 'alumno-1', 1)).toBeTrue();
    });
  });

  describe('helpers y calculos por alumno', () => {
    it('dado un mismo producto para dos alumnos, cantidadDe deberia contar solo el de ese alumno', () => {
      const producto = ProductoMother.crear();
      service.agregar(producto, 'alumno-1', 2);
      service.agregar(producto, 'alumno-2', 5);

      expect(service.cantidadDe(producto.id, 'alumno-1')).toBe(2);
      expect(service.cantidadDe(producto.id, 'alumno-2')).toBe(5);
    });

    it('dado items de un alumno, subtotalAlumno deberia sumar solo los de ese alumno', () => {
      service.agregar(ProductoMother.crear({ precio: 500 }), 'alumno-1', 2);
      service.agregar(ProductoMother.crear({ id: 'p2', precio: 300 }), 'alumno-2', 1);

      expect(service.subtotalAlumno('alumno-1')).toBe(1000);
      expect(service.subtotalAlumno('alumno-2')).toBe(300);
    });

    it('dado un producto, cuando llamo setCantidadPorProducto sobre un item existente, deberia actualizar su cantidad', () => {
      const producto = ProductoMother.crear();
      service.agregar(producto, 'alumno-1', 1);

      service.setCantidadPorProducto(producto, 'alumno-1', 4);

      expect(service.cantidadDe(producto.id, 'alumno-1')).toBe(4);
    });

    it('dado un producto sin item previo, cuando llamo setCantidadPorProducto con cantidad > 0, deberia agregarlo', () => {
      const producto = ProductoMother.crear();

      service.setCantidadPorProducto(producto, 'alumno-1', 3);

      expect(service.cantidadDe(producto.id, 'alumno-1')).toBe(3);
    });

    it('dado un producto sin item previo, cuando llamo setCantidadPorProducto con cantidad 0, no deberia agregar nada', () => {
      const producto = ProductoMother.crear();

      service.setCantidadPorProducto(producto, 'alumno-1', 0);

      expect(service.cantidadTotal()).toBe(0);
    });

    it('dado que agrego con cantidad <= 0, no deberia agregar el producto', () => {
      service.agregar(ProductoMother.crear(), 'alumno-1', 0);

      expect(service.cantidadTotal()).toBe(0);
    });

    it('dado setCantidad con cantidad <= 0, deberia quitar el item', () => {
      const producto = ProductoMother.crear();
      service.agregar(producto, 'alumno-1', 2);
      const itemId = service.itemsPorAlumno().get('alumno-1')![0].id;

      service.setCantidad(itemId, 0);

      expect(service.cantidadTotal()).toBe(0);
    });

    it('dado cambiarCantidad sobre un itemId inexistente, no deberia romper', () => {
      expect(() => service.cambiarCantidad('inexistente', 1)).not.toThrow();
      expect(service.cantidadTotal()).toBe(0);
    });

    it('dado setCatalog, deberia guardar el catalogo (verificado indirectamente via validarAgregar)', () => {
      expect(() => service.setCatalog([ProductoMother.crear()])).not.toThrow();
    });
  });

  describe('persistencia en localStorage', () => {
    it('dado items agregados, deberia persistirlos en localStorage', () => {
      service.agregar(ProductoMother.crear(), 'alumno-1', 2);

      TestBed.tick();

      const guardado = localStorage.getItem('recred_carrito_items');
      expect(guardado).toBeTruthy();
      const items = JSON.parse(guardado!) as { cantidad: number }[];
      expect(items[0].cantidad).toBe(2);
    });

    it('dado un JSON corrupto en localStorage, cuando arranca el service, deberia loguear el error y no romper', () => {
      spyOn(console, 'error');
      localStorage.setItem('recred_carrito_items', '{ json roto ');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CarritoService,
          { provide: PresupuestoService, useValue: servicioPresupuesto },
          { provide: MovimientosService, useValue: servicioMovimientos },
          { provide: AlumnosService, useValue: servicioAlumnos },
        ],
      });
      const fresh = TestBed.inject(CarritoService);

      expect(fresh.items()).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error parseando carrito', jasmine.any(Error));
    });
  });

  describe('cargarPresupuestoYConsumo', () => {
    it('dado alumnoId vacio, no deberia consultar ni presupuesto ni movimientos', async () => {
      await service.cargarPresupuestoYConsumo('');

      expect(servicioPresupuesto.getPresupuesto).not.toHaveBeenCalled();
      expect(servicioMovimientos.getHistorialAlumno).not.toHaveBeenCalled();
    });

    it('dado que el back devuelve budget null, deberia borrarlo del mapa', async () => {
      servicioPresupuesto.getPresupuesto.and.resolveTo(null as unknown as Presupuesto);
      servicioMovimientos.getHistorialAlumno.and.returnValue(of([]));

      await service.cargarPresupuestoYConsumo('alumno-1');

      expect(service.budgets().has('alumno-1')).toBeFalse();
    });

    it('dado que el back falla, deberia loguear y no romper el signal', async () => {
      spyOn(console, 'error');
      servicioPresupuesto.getPresupuesto.and.rejectWith(new Error('backend'));

      await service.cargarPresupuestoYConsumo('alumno-1');

      expect(console.error).toHaveBeenCalled();
    });

    it('dado que el back devuelve history null, deberia borrar la entrada del mapa de purchases', async () => {
      servicioMovimientos.getHistorialAlumno.and.returnValue(of([{ id: 'm1' }] as unknown as Movimiento[]));
      servicioPresupuesto.getPresupuesto.and.resolveTo(null as unknown as Presupuesto);
      await service.cargarPresupuestoYConsumo('alumno-1');
      expect(service.purchases().has('alumno-1')).toBeTrue();

      servicioMovimientos.getHistorialAlumno.and.returnValue(of(null as unknown as Movimiento[]));
      await service.cargarPresupuestoYConsumo('alumno-1');

      expect(service.purchases().has('alumno-1')).toBeFalse();
    });
  });

  describe('agregar y setCantidad con varios items en el carrito', () => {
    it('dado dos productos distintos en el carrito, cuando agrego mas de uno, deberia dejar al otro intacto', () => {
      const chocolate = ProductoMother.crear({ id: 'p-choco', precio: 500 });
      const galleta = ProductoMother.crear({ id: 'p-galle', precio: 300 });
      service.agregar(chocolate, 'alumno-1', 1);
      service.agregar(galleta, 'alumno-1', 1);

      service.agregar(chocolate, 'alumno-1', 2);

      expect(service.cantidadDe('p-choco', 'alumno-1')).toBe(3);
      expect(service.cantidadDe('p-galle', 'alumno-1')).toBe(1);
    });

    it('dado dos items en el carrito del mismo alumno, cuando cambio la cantidad de uno, el otro deberia quedar igual', () => {
      const chocolate = ProductoMother.crear({ id: 'p-choco' });
      const galleta = ProductoMother.crear({ id: 'p-galle' });
      service.agregar(chocolate, 'alumno-1', 1);
      service.agregar(galleta, 'alumno-1', 2);
      const idGalleta = service.itemsPorAlumno().get('alumno-1')!.find((i) => i.producto.id === 'p-galle')!.id;

      service.setCantidad(idGalleta, 5);

      expect(service.cantidadDe('p-choco', 'alumno-1')).toBe(1);
      expect(service.cantidadDe('p-galle', 'alumno-1')).toBe(5);
    });
  });

  describe('validarAgregar sin alumno', () => {
    it('dado un presupuesto vigente pero sin alumno cargado, cuando valido, deberia permitirlo (limite saldo = Infinity)', async () => {
      await givenPresupuestoCon({ montoLimiteGeneral: 5000, reglasCategoria: [] });
      servicioAlumnos.getAlumnoById.and.returnValue(undefined);
      const producto = ProductoMother.crear({ precio: 100 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeTrue();
    });

    it('dado un presupuesto vigente con seleccion de retiro, cuando valido, deberia usar la fecha de la seleccion como referencia', async () => {
      await givenPresupuestoCon({ montoLimiteGeneral: 5000, reglasCategoria: [] });
      service.setSeleccionRetiro('alumno-1', '2030-07-15', 'PRIMER_RECREO');
      const producto = ProductoMother.crear({ precio: 100 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeTrue();
    });

    it('dado un presupuesto vigente con saldo insuficiente, cuando valido, deberia rechazar por saldo', async () => {
      await givenPresupuestoCon({ montoLimiteGeneral: 100000, reglasCategoria: [] });
      servicioAlumnos.getAlumnoById.and.returnValue(
        AlumnoMother.crear({ id: 'alumno-1', saldo: 100 }),
      );
      const producto = ProductoMother.crear({ precio: 500 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeFalse();
      expect(resultado.razon).toBe('saldo');
    });

    it('dado un historial con compras de status desconocido, cuando valido, deberia ignorarlas al calcular el gasto pasado', async () => {
      const budget = {
        id: 'b',
        fechaInicio: '2026-01-01',
        alumnoId: 'alumno-1',
        activo: true,
        periodo: 'SEMANAL' as const,
        montoLimiteGeneral: 5000,
        reglasCategoria: [],
      };
      servicioPresupuesto.getPresupuesto.and.resolveTo(budget);
      servicioMovimientos.getHistorialAlumno.and.returnValue(
        of([
          {
            id: 'm-desconocido',
            status: 'ESTADO_INEXISTENTE',
            totalAmount: 9999,
            date: new Date().toISOString(),
            pickupDate: null,
            items: [],
          },
        ] as unknown as Movimiento[]),
      );
      servicioAlumnos.getAlumnoById.and.returnValue(
        AlumnoMother.crear({ id: 'alumno-1', saldo: 10000 }),
      );
      await service.cargarPresupuestoYConsumo('alumno-1');
      const producto = ProductoMother.crear({ precio: 200 });

      const resultado = service.validarAgregar(producto, 'alumno-1', 1);

      expect(resultado.permitido).toBeTrue();
    });
  });

  function whenAgrego(producto: ReturnType<typeof ProductoMother.crear>, alumnoId: string, cantidad: number): void {
    service.agregar(producto, alumnoId, cantidad);
  }

  function primerItemDe(alumnoId: string): string {
    return service.itemsPorAlumno().get(alumnoId)![0].id;
  }

  function givenAlumnoConSaldo(alumnoId: string, saldo: number): void {
    servicioAlumnos.getAlumnoById.and.returnValue(
      AlumnoMother.crear({ id: alumnoId, saldo }),
    );
  }

  async function givenPresupuestoCon(datos: {
    montoLimiteGeneral: number;
    reglasCategoria: Presupuesto['reglasCategoria'];
  }): Promise<void> {
    const presupuesto: Presupuesto = {
      id: 'budget-1',
      fechaInicio: '2026-06-01',
      alumnoId: 'alumno-1',
      activo: true,
      periodo: 'SEMANAL',
      montoLimiteGeneral: datos.montoLimiteGeneral,
      reglasCategoria: datos.reglasCategoria,
    };
    servicioPresupuesto.getPresupuesto.and.resolveTo(presupuesto);
    servicioMovimientos.getHistorialAlumno.and.returnValue(of([]));
    servicioAlumnos.getAlumnoById.and.returnValue(AlumnoMother.crear({ id: 'alumno-1', saldo: 10000 }));
    await service.cargarPresupuestoYConsumo('alumno-1');
  }
});
