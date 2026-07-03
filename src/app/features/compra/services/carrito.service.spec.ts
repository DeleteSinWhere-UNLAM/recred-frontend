import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { Presupuesto } from '../../presupuesto/models/presupuesto.model';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
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
