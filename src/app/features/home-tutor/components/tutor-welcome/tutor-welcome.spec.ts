import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { Promotion, PromotionService } from '../../../../data-access/services/promociones/promotion.service';
import { Producto } from '../../../buffet/models/producto.model';
import { BuffetService } from '../../../buffet/services/buffet.service';
import { FavoritosService } from '../../../favoritos/services/favoritos.service';
import { Movimiento } from '../../../movimientos/models/movimiento.model';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { TutorWelcome } from './tutor-welcome';

describe('TutorWelcome', () => {
  let component: TutorWelcome;
  let fixture: ComponentFixture<TutorWelcome>;
  let alumnosSignal: WritableSignal<Alumno[]>;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let servicioBuffet: jasmine.SpyObj<BuffetService>;
  let servicioPromos: jasmine.SpyObj<PromotionService>;
  let servicioFavoritos: jasmine.SpyObj<FavoritosService>;
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;

  beforeEach(async () => {
    alumnosSignal = signal<Alumno[]>([]);

    servicioMovimientos = jasmine.createSpyObj('MovimientosService', [
      'getHistorialTutor',
      'getPendientesAlumno',
    ]);
    servicioMovimientos.getHistorialTutor.and.returnValue(of([]));
    servicioMovimientos.getPendientesAlumno.and.returnValue(of([]));

    servicioBuffet = jasmine.createSpyObj('BuffetService', ['obtenerBuffetDelAlumno']);
    servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(
      of({ id: 'buffet-1', nombre: 'Buffet', colegioId: 'c-1' }),
    );

    servicioPromos = jasmine.createSpyObj('PromotionService', ['getPromotions']);
    servicioPromos.getPromotions.and.returnValue(of([]));

    servicioFavoritos = jasmine.createSpyObj('FavoritosService', ['getFavoritos']);
    servicioFavoritos.getFavoritos.and.returnValue(of([]));

    servicioContexto = jasmine.createSpyObj('AlumnoContextoService', ['limpiar', 'setAlumnoId']);

    await TestBed.configureTestingModule({
      imports: [TutorWelcome],
      providers: [
        {
          provide: AlumnosService,
          useValue: { alumnos: alumnosSignal.asReadonly() },
        },
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: BuffetService, useValue: servicioBuffet },
        { provide: PromotionService, useValue: servicioPromos },
        { provide: FavoritosService, useValue: servicioFavoritos },
        { provide: AlumnoContextoService, useValue: servicioContexto },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorWelcome);
    component = fixture.componentInstance;
  });

  describe('Estado inicial', () => {
    it('dado sin alumnos, cuando se monta, deberia arrancar sin movimientos/pendientes/promociones/favoritos', () => {
      whenMonto();

      expect(component.ultimosMovimientos()).toEqual([]);
      expect(component.pedidosPendientes()).toEqual([]);
      expect(component.promociones()).toEqual([]);
      expect(component.productosFavoritos()).toEqual([]);
    });

    it('dado sin alumnos, cuando se monta, no deberia consultar favoritos', () => {
      whenMonto();

      expect(servicioFavoritos.getFavoritos).not.toHaveBeenCalled();
    });
  });

  describe('alumnosConSaldoBajo', () => {
    it('dado alumnos con saldo < 2000, deberia listarlos como saldo bajo', () => {
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1', saldo: 500 }),
        AlumnoMother.crear({ id: 'a-2', saldo: 3000 }),
        AlumnoMother.crear({ id: 'a-3', saldo: 0 }),
      ]);

      const bajos = component.alumnosConSaldoBajo();
      expect(bajos.map((a) => a.id)).toEqual(['a-1', 'a-3']);
    });
  });

  describe('cargarDatosDashboard', () => {
    it('dado un tutor con historial, cuando se monta, deberia setear los ultimos 4 movimientos', () => {
      const movimientos = Array.from({ length: 6 }, (_, i) => crearMovimiento(`m-${i}`));
      servicioMovimientos.getHistorialTutor.and.returnValue(of(movimientos));

      whenMonto();

      expect(component.ultimosMovimientos().length).toBe(4);
    });

    it('dado un movimiento cuyo studentId matchea un alumno, deberia mapear alumnoNombre desde el alumno', () => {
      alumnosSignal.set([AlumnoMother.crear({ id: 'alumno-1', nombre: 'Julián' })]);
      servicioMovimientos.getHistorialTutor.and.returnValue(
        of([crearMovimiento('m-1', { studentId: 'alumno-1' })]),
      );

      whenMonto();

      expect(component.ultimosMovimientos()[0].alumnoNombre).toBe('Julián');
    });

    it('dado un movimiento sin alumno matcheado, deberia usar studentName como fallback', () => {
      alumnosSignal.set([AlumnoMother.crear({ id: 'alumno-1', nombre: 'Julián' })]);
      servicioMovimientos.getHistorialTutor.and.returnValue(
        of([crearMovimientoConStudentName('m-1', 'no-existe', 'Nombre del back')]),
      );

      whenMonto();

      expect(component.ultimosMovimientos()[0].alumnoNombre).toBe('Nombre del back');
    });

    it('dado historial null desde el backend, deberia dejar la lista de movimientos vacia', () => {
      servicioMovimientos.getHistorialTutor.and.returnValue(of(null as unknown as Movimiento[]));

      whenMonto();

      expect(component.ultimosMovimientos()).toEqual([]);
    });

    it('dado dos alumnos con pendientes, deberia consolidarlos ordenados por fecha desc y limitar a 5', () => {
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1', nombre: 'Julián' }),
        AlumnoMother.crear({ id: 'a-2', nombre: 'Ana' }),
      ]);
      servicioMovimientos.getPendientesAlumno.and.callFake((alumnoId: string) => {
        if (alumnoId === 'a-1') {
          return of([
            crearMovimiento('p-1', { date: '2026-07-01T10:00:00' }),
            crearMovimiento('p-2', { date: '2026-07-03T10:00:00' }),
          ]);
        }
        return of([crearMovimiento('p-3', { date: '2026-07-02T10:00:00' })]);
      });

      whenMonto();

      const ids = component.pedidosPendientes().map((p) => p.id);
      expect(ids).toEqual(['p-2', 'p-3', 'p-1']);
      expect(component.pedidosPendientes()[0].alumnoNombre).toBe('Julián');
    });

    it('dado alumnos con distintos buffets, deberia consolidar promociones vigentes deduplicadas y limitar a 4', () => {
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1', nombre: 'Julián' }),
        AlumnoMother.crear({ id: 'a-2', nombre: 'Ana' }),
        AlumnoMother.crear({ id: 'a-3', nombre: 'Pedro' }),
      ]);
      servicioBuffet.obtenerBuffetDelAlumno.and.callFake((alumnoId: string) => {
        if (alumnoId === 'a-3') return of({ id: 'buffet-2', nombre: 'Otro', colegioId: 'c-2' });
        return of({ id: 'buffet-1', nombre: 'Buffet', colegioId: 'c-1' });
      });
      servicioPromos.getPromotions.and.callFake((buffetId: string) => {
        if (buffetId === 'buffet-1') {
          return of([
            crearPromo('promo-1', 'ACTIVE'),
            crearPromo('promo-2', 'EXPIRED'),
            crearPromo('promo-3', ''),
          ]);
        }
        return of([
          crearPromo('promo-4', 'ACTIVE'),
          crearPromo('promo-5', 'ACTIVE'),
          crearPromo('promo-6', 'ACTIVE'),
        ]);
      });

      whenMonto();

      expect(component.promociones().length).toBe(4);
      expect(component.promociones().map((p) => p.id)).toEqual([
        'promo-1',
        'promo-3',
        'promo-4',
        'promo-5',
      ]);
    });

    it('dado que solo un alumno tiene buffet valido, no deberia consultar promos dos veces', () => {
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1' }),
        AlumnoMother.crear({ id: 'a-2' }),
      ]);
      servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(
        of({ id: 'buffet-1', nombre: 'Buffet', colegioId: 'c-1' }),
      );

      whenMonto();

      expect(servicioPromos.getPromotions).toHaveBeenCalledTimes(1);
      expect(servicioPromos.getPromotions).toHaveBeenCalledWith('buffet-1');
    });

    it('dado un buffet sin id, no deberia consultar promociones', () => {
      alumnosSignal.set([AlumnoMother.crear({ id: 'a-1' })]);
      servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(
        of({ id: '', nombre: 'Buffet sin id', colegioId: 'c-1' }),
      );

      whenMonto();

      expect(servicioPromos.getPromotions).not.toHaveBeenCalled();
    });

    it('dado que obtenerBuffetDelAlumno falla, deberia loggear sin romper', () => {
      const spyConsole = spyOn(console, 'error');
      alumnosSignal.set([AlumnoMother.crear({ id: 'a-1' })]);
      servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();

      expect(spyConsole).toHaveBeenCalledWith(
        'Error al obtener buffet:',
        jasmine.any(Error),
      );
    });

    it('dado favoritos de distintos alumnos con producto compartido, deberia mergear alumnoNombre', () => {
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1', nombre: 'Julián García' }),
        AlumnoMother.crear({ id: 'a-2', nombre: 'Ana García' }),
      ]);
      servicioFavoritos.getFavoritos.and.callFake((alumnoId: string) => {
        if (alumnoId === 'a-1') return of([crearProducto('p-compartido'), crearProducto('p-1')]);
        return of([crearProducto('p-compartido'), crearProducto('p-2')]);
      });

      whenMonto();

      const favoritos = component.productosFavoritos();
      expect(favoritos.length).toBe(3);
      const compartido = favoritos.find((f) => f.producto.id === 'p-compartido');
      expect(compartido?.alumnoNombre).toBe('Julián, Ana');
    });

    it('dado favoritos null desde el backend, deberia tolerarlo y setearlo vacio', () => {
      alumnosSignal.set([AlumnoMother.crear({ id: 'a-1' })]);
      servicioFavoritos.getFavoritos.and.returnValue(of(null as unknown as Producto[]));

      whenMonto();

      expect(component.productosFavoritos()).toEqual([]);
    });

    it('dado que getFavoritos falla para uno de los alumnos, deberia loggear y consolidar los del otro', () => {
      const spyConsole = spyOn(console, 'error');
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1', nombre: 'Julián' }),
        AlumnoMother.crear({ id: 'a-2', nombre: 'Ana' }),
      ]);
      servicioFavoritos.getFavoritos.and.callFake((alumnoId: string) => {
        if (alumnoId === 'a-1') return of([crearProducto('p-1')]);
        return throwError(() => new Error('boom'));
      });

      whenMonto();

      expect(spyConsole).toHaveBeenCalledWith(
        'Error fetching favorites for dashboard:',
        jasmine.any(Error),
      );
      expect(component.productosFavoritos().map((f) => f.producto.id)).toEqual(['p-1']);
    });
  });

  describe('navegacion', () => {
    it('dado un alumnoId, cuando llamo irAcreditar, deberia navegar a /tutor/acreditar/{id}', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.irAcreditar('alumno-1');

      expect(router.navigate).toHaveBeenCalledWith(['/tutor/acreditar', 'alumno-1']);
    });

    it('dado un click en movimientos, deberia limpiar el contexto y navegar a /movimientos', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.irAMovimientos();

      expect(servicioContexto.limpiar).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/movimientos']);
    });
  });

  describe('helpers de formato', () => {
    it('dado un dateStr valido, formatDate deberia devolver un string con dia/mes y hora', () => {
      const salida = component.formatDate('2026-07-15T14:30:00');

      expect(salida).toContain('15');
      expect(salida).toContain('7');
      expect(salida).toContain(':30');
    });

    it('dado un dateStr vacio, formatDate deberia devolver string vacio', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('dado un monto, formatARS deberia incluir $ y el separador de miles', () => {
      const salida = component.formatARS(1500);

      expect(salida).toContain('$');
      expect(salida).toContain('1.500');
    });
  });

  describe('getStatusLabel', () => {
    it('dado PENDING, deberia devolver "A Preparar"', () => {
      expect(component.getStatusLabel('PENDING')).toBe('A Preparar');
    });

    it('dado PENDIENTE en mayusculas, deberia devolver "A Preparar"', () => {
      expect(component.getStatusLabel('PENDIENTE')).toBe('A Preparar');
    });

    it('dado EN_PREPARACION, deberia devolver "En Preparación"', () => {
      expect(component.getStatusLabel('EN_PREPARACION')).toBe('En Preparación');
    });

    it('dado LISTO, deberia devolver "Listo para retirar"', () => {
      expect(component.getStatusLabel('LISTO')).toBe('Listo para retirar');
    });

    it('dado ENTREGADO o APPROVED, deberia devolver "Entregado"', () => {
      expect(component.getStatusLabel('ENTREGADO')).toBe('Entregado');
      expect(component.getStatusLabel('APPROVED')).toBe('Entregado');
    });

    it('dado un status desconocido, deberia devolver el defaultLabel o el status crudo', () => {
      expect(component.getStatusLabel('DESCONOCIDO', 'label default')).toBe('label default');
      expect(component.getStatusLabel('DESCONOCIDO')).toBe('DESCONOCIDO');
    });
  });

  describe('getCantidadProductos', () => {
    it('dado un pedido sin items, deberia devolver 0', () => {
      const pedido = crearMovimiento('m-x', { items: undefined as unknown as [] });

      expect(component.getCantidadProductos(pedido)).toBe(0);
    });

    it('dado un pedido con items, deberia sumar las quantities', () => {
      const pedido = crearMovimiento('m-y', {
        items: [
          { productId: 'p1', productName: 'A', quantity: 2, unitPrice: 100 },
          { productId: 'p2', productName: 'B', quantity: 3, unitPrice: 200 },
        ],
      });

      expect(component.getCantidadProductos(pedido)).toBe(5);
    });
  });

  describe('verDetallePedido', () => {
    it('dado un pedido con studentId, deberia setear el contexto y navegar a /tutor-movimientos/{id}', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      const pedido = crearMovimiento('m-1', { studentId: 'alumno-x' });

      component.verDetallePedido(pedido);

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-x');
      expect(router.navigate).toHaveBeenCalledWith(
        ['/tutor-movimientos/alumno-x'],
        jasmine.objectContaining({ queryParams: { id: 'm-1' } }),
      );
    });

    it('dado un pedido sin studentId, deberia navegar a /tutor-movimientos sin contexto', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      const pedido = crearMovimiento('m-2', { studentId: undefined as unknown as string });

      component.verDetallePedido(pedido);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/tutor-movimientos'],
        jasmine.objectContaining({ queryParams: { id: 'm-2' } }),
      );
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function crearMovimiento(id: string, override: Partial<Movimiento> = {}): Movimiento {
    return {
      id,
      studentId: 'alumno-1',
      totalAmount: 500,
      status: 'ENTREGADO',
      statusLabel: 'Entregado',
      paymentMethod: 'CREDITO',
      date: '2026-07-15T10:00:00',
      items: [{ productId: 'p-1', productName: 'Alfajor', quantity: 1, unitPrice: 500 }],
      ...override,
    };
  }

  function crearMovimientoConStudentName(id: string, studentId: string, studentName: string): Movimiento {
    return {
      ...crearMovimiento(id, { studentId }),
      studentName,
    } as Movimiento & { studentName: string };
  }

  function crearPromo(id: string, status: string): Promotion {
    return {
      id,
      name: `Promo ${id}`,
      discountPercentage: 10,
      productIds: [],
      startDate: '2026-07-01',
      endDate: '2026-08-01',
      status,
    };
  }

  function crearProducto(id: string): Producto {
    return {
      id,
      nombre: `Producto ${id}`,
      descripcion: '',
      precio: 100,
      categoria: { id: 'c', descripcion: 'C' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'DISPONIBLE',
    };
  }
});
