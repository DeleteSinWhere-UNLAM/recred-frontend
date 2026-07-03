import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { PromotionService } from '../../../../data-access/services/promociones/promotion.service';
import { BuffetService } from '../../../buffet/services/buffet.service';
import { FavoritosService } from '../../../favoritos/services/favoritos.service';
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

    servicioContexto = jasmine.createSpyObj('AlumnoContextoService', ['limpiar']);

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

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function crearMovimiento(id: string): import('../../../movimientos/models/movimiento.model').Movimiento {
    return {
      id,
      studentId: 'alumno-1',
      totalAmount: 500,
      status: 'ENTREGADO',
      statusLabel: 'Entregado',
      paymentMethod: 'CREDITO',
      date: '2026-07-15T10:00:00',
      items: [{ productId: 'p-1', productName: 'Alfajor', quantity: 1, unitPrice: 500 }],
    };
  }
});
