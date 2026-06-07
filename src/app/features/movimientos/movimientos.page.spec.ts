import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';

import { MovimientosPage } from './movimientos.page';
import { MovimientosService } from './services/movimientos.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { Movimiento } from './models/movimiento.model';
import { Alumno } from '../../data-access/models/alumno.model';

describe('MovimientosPage', () => {
  let component: MovimientosPage;
  let fixture: ComponentFixture<MovimientosPage>;
  let router: Router;

  let movimientosServiceSpy: jasmine.SpyObj<MovimientosService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;

  let paramMapSubject: BehaviorSubject<any>;

  const mockAlumno1: Alumno = {
    id: 'alumno-1',
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: '1',
    saldo: 2000
  };

  const mockAlumno2: Alumno = {
    id: 'alumno-2',
    nombre: 'Sofía',
    apellido: 'García',
    grado: '2do Año B',
    colegioId: '1',
    saldo: 1500
  };

  const mockMovimiento1: Movimiento = {
    id: 'mov-1',
    studentId: 'alumno-1',
    totalAmount: 1500,
    status: 'APPROVED',
    statusLabel: 'Aprobado',
    paymentMethod: 'CREDIT',
    date: '2026-06-05T10:00:00Z',
    items: [{ productId: 'prod-1', productName: 'Tostado', quantity: 1, unitPrice: 1500 }]
  };

  const mockMovimiento2: Movimiento = {
    id: 'mov-2',
    studentId: 'alumno-2',
    totalAmount: 800,
    status: 'PENDING',
    statusLabel: 'Pendiente',
    paymentMethod: 'DEBIT',
    date: '2026-06-07T12:00:00Z',
    items: [{ productId: 'prod-2', productName: 'Jugo', quantity: 1, unitPrice: 800 }]
  };

  const mockMovimiento3: Movimiento = {
    id: 'mov-3',
    studentId: 'alumno-1',
    totalAmount: 2500,
    status: 'REJECTED',
    statusLabel: 'Rechazado',
    paymentMethod: 'CREDIT',
    date: '2026-06-06T15:00:00Z',
    items: [{ productId: 'prod-3', productName: 'Pizza', quantity: 1, unitPrice: 2500 }]
  };

  const mockMovimientosList = [mockMovimiento1, mockMovimiento2, mockMovimiento3];

  beforeEach(async () => {
    movimientosServiceSpy = jasmine.createSpyObj<MovimientosService>('MovimientosService', [
      'getHistorialAlumno',
      'getHistorialTutor',
    ]);
    alumnosServiceSpy = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);

    // Configurar Mocks
    alumnosServiceSpy.asegurarCargados.and.resolveTo([mockAlumno1, mockAlumno2]);
    Object.defineProperty(alumnosServiceSpy, 'alumnos', {
      value: signal([mockAlumno1, mockAlumno2]),
      writable: true,
    });

    alumnosServiceSpy.getAlumnoById.and.callFake((id: string) => {
      if (id === 'alumno-1') return mockAlumno1;
      if (id === 'alumno-2') return mockAlumno2;
      return undefined;
    });

    movimientosServiceSpy.getHistorialTutor.and.returnValue(of(mockMovimientosList));
    movimientosServiceSpy.getHistorialAlumno.and.returnValue(of([mockMovimiento1, mockMovimiento3]));

    paramMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [MovimientosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MovimientosService, useValue: movimientosServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        UsuarioService, // Usar UsuarioService real para resolver señales y métodos de manera correcta en el Navbar
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(MovimientosPage);
    component = fixture.componentInstance;
  });

  it('debería crear la página', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component).toBeTruthy();
    expect(alumnosServiceSpy.asegurarCargados).toHaveBeenCalled();
  }));

  describe('Carga de historial', () => {
    it('debería cargar el historial de todos los alumnos si alumnoId param no está presente', fakeAsync(() => {
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();

      expect(component.selectedAlumnoId()).toBe('todos');
      expect(movimientosServiceSpy.getHistorialTutor).toHaveBeenCalled();
      expect(component.cargando()).toBeFalse();
      // Debería ordenar los movimientos descendentemente por fecha
      // Fechas: mov-2 (07-06), mov-3 (06-06), mov-1 (05-06)
      expect(component.rawMovimientos()[0].id).toBe('mov-2');
      expect(component.rawMovimientos()[1].id).toBe('mov-3');
      expect(component.rawMovimientos()[2].id).toBe('mov-1');
    }));

    it('debería cargar el historial de un alumno específico si alumnoId param está presente', fakeAsync(() => {
      paramMapSubject.next(convertToParamMap({ alumnoId: 'alumno-1' }));
      fixture.detectChanges();
      tick();

      expect(component.selectedAlumnoId()).toBe('alumno-1');
      expect(movimientosServiceSpy.getHistorialAlumno).toHaveBeenCalledWith('alumno-1');
      expect(component.cargando()).toBeFalse();
      expect(component.rawMovimientos().length).toBe(2);
      // Ordenamiento descendente: mov-3 (06-06) antes que mov-1 (05-06)
      expect(component.rawMovimientos()[0].id).toBe('mov-3');
    }));

    it('debería manejar error al cargar historial', fakeAsync(() => {
      spyOn(console, 'error');
      movimientosServiceSpy.getHistorialTutor.and.returnValue(throwError(() => new Error('Error de red')));
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();

      expect(component.cargando()).toBeFalse();
      expect(component.errorMsg()).toBe('No se pudieron obtener los movimientos de la base de datos.');
      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('Filtros', () => {
    beforeEach(fakeAsync(() => {
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();
    }));

    it('debería retornar todos los movimientos por defecto', () => {
      expect(component.movimientosFiltrados().length).toBe(3);
    });

    it('debería filtrar por estado', () => {
      component.filtroEstado.set('PENDING');
      expect(component.movimientosFiltrados().length).toBe(1);
      expect(component.movimientosFiltrados()[0].id).toBe('mov-2');
    });

    it('debería filtrar por fecha desde/hasta', () => {
      // Movimientos fechas:
      // mov-1: 2026-06-05
      // mov-2: 2026-06-07
      // mov-3: 2026-06-06

      component.filtroFechaDesde.set('2026-06-06');
      expect(component.movimientosFiltrados().length).toBe(2); // mov-2 y mov-3

      component.filtroFechaHasta.set('2026-06-06');
      expect(component.movimientosFiltrados().length).toBe(1); // solo mov-3
    });

    it('debería filtrar por rango de precios', () => {
      // Precios:
      // mov-1: 1500
      // mov-2: 800
      // mov-3: 2500

      component.filtroPrecioMin.set(1000);
      expect(component.movimientosFiltrados().length).toBe(2); // mov-1 y mov-3

      component.filtroPrecioMax.set(2000);
      expect(component.movimientosFiltrados().length).toBe(1); // solo mov-1 (1500)
    });

    it('debería limpiar filtros correctamente', () => {
      component.filtroEstado.set('APPROVED');
      component.filtroFechaDesde.set('2026-06-01');
      component.filtroPrecioMin.set(100);

      component.limpiarFiltros();

      expect(component.filtroEstado()).toBe('TODOS');
      expect(component.filtroFechaDesde()).toBe('');
      expect(component.filtroPrecioMin()).toBeNull();
      expect(component.movimientosFiltrados().length).toBe(3);
    });
  });

  describe('Modal de detalle', () => {
    it('debería abrir y cerrar el modal de detalle del movimiento', () => {
      expect(component.modalMovimiento()).toBeNull();

      component.abrirDetalle(mockMovimiento1);
      expect(component.modalMovimiento()).toEqual(mockMovimiento1);

      component.cerrarDetalle();
      expect(component.modalMovimiento()).toBeNull();
    });
  });

  describe('Formateadores y selectores de UI', () => {
    beforeEach(fakeAsync(() => {
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();
    }));

    it('debería retornar el nombre del alumno correctamente', () => {
      expect(component.getNombreAlumno('alumno-1')).toBe('Julián García');
      expect(component.getNombreAlumno('alumno-desconocido')).toBe('Alumno');
    });

    it('debería retornar las iniciales del alumno correctamente', () => {
      expect(component.getInicialesAlumno('alumno-1')).toBe('JG');
      expect(component.getInicialesAlumno('alumno-desconocido')).toBe('AL');
    });

    it('debería formatear fecha correctamente', () => {
      const fecha = component.formatearFecha('2026-06-07T12:00:00Z');
      expect(fecha).toBeTruthy();
    });

    it('debería navegar a la ruta correspondiente al cambiar de alumno en el select', () => {
      const mockEventTodos = { target: { value: 'todos' } } as unknown as Event;
      component.onAlumnoChange(mockEventTodos);
      expect(router.navigate).toHaveBeenCalledWith(['/movimientos']);

      const mockEventAlumno = { target: { value: 'alumno-1' } } as unknown as Event;
      component.onAlumnoChange(mockEventAlumno);
      expect(router.navigate).toHaveBeenCalledWith(['/movimientos', 'alumno-1']);
    });

    it('debería navegar a la home de tutor al presionar volver', () => {
      component.volver();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });
});
