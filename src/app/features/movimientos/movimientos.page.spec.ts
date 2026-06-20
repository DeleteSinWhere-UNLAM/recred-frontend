import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';

import { MovimientosPage } from './movimientos.page';
import { MovimientosService } from './services/movimientos.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { Movimiento } from './models/movimiento.model';
import { Alumno } from '../../data-access/models/alumno.model';

describe('MovimientosPage', () => {
  let component: MovimientosPage;
  let fixture: ComponentFixture<MovimientosPage>;
  let router: Router;

  let movimientosServiceSpy: jasmine.SpyObj<MovimientosService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  let paramMapSubject: BehaviorSubject<ParamMap>;

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
      'cancelarCompra',
    ]);
    alumnosServiceSpy = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    perfilServiceSpy = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'obtenerAlumnoId',
    ]);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', [
      'mostrar',
    ]);

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

    perfilServiceSpy.obtenerAlumnoId.and.returnValue('alumno-1');

    movimientosServiceSpy.getHistorialTutor.and.returnValue(of(mockMovimientosList));
    movimientosServiceSpy.getHistorialAlumno.and.returnValue(of([mockMovimiento1, mockMovimiento3]));
    movimientosServiceSpy.cancelarCompra.and.returnValue(of(undefined));

    paramMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [MovimientosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MovimientosService, useValue: movimientosServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        UsuarioService,
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

    it('debería manejar fallback de obtenerAlumnoId nulo y cargar alumno correctamente si existe', fakeAsync(() => {
      // Setup as vista alumno
      const usuarioService = TestBed.inject(UsuarioService);
      usuarioService.setHomeUrl('/alumno');
      
      perfilServiceSpy.obtenerAlumnoId.and.returnValue(null as any);
      spyOn(usuarioService, 'getAlumnoActual').and.returnValue({ id: 'alumno-2' } as any);
      
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();

      expect(component.selectedAlumnoId()).toBe('alumno-2');
      expect(component.nombreAlumno()).toBe('Sofía García');
      
      usuarioService.setHomeUrl('/tutor');
    }));

    it('debería setear nombre si el alumno existe con id en parametro', fakeAsync(() => {
      alumnosServiceSpy.getAlumnoById.and.callFake((id) => id === 'alumno-1' ? mockAlumno1 : undefined);
      paramMapSubject.next(convertToParamMap({ alumnoId: 'alumno-1' }));
      fixture.detectChanges();
      tick();
      expect(component.nombreAlumno()).toBe('Julián García');
    }));

    it('no debería setear nombre si el alumno NO existe con id en parametro', fakeAsync(() => {
      alumnosServiceSpy.getAlumnoById.and.returnValue(undefined);
      paramMapSubject.next(convertToParamMap({ alumnoId: 'alumno-99' }));
      fixture.detectChanges();
      tick();
      expect(component.nombreAlumno()).toBe(''); // Initially empty, wasn't changed
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

    it('debería filtrar por texto de búsqueda en items', () => {
      component.filtroBusqueda.set('tostado');
      expect(component.movimientosFiltrados().length).toBe(1);
      expect(component.movimientosFiltrados()[0].id).toBe('mov-1');
    });

    it('debería filtrar por fecha exacta si está seleccionada', () => {
      component.filtroFecha.set('2026-06-05');
      expect(component.movimientosFiltrados().length).toBe(1);
      expect(component.movimientosFiltrados()[0].id).toBe('mov-1');
    });

    it('debería filtrar por fecha desde/hasta limitando fuera de rango', () => {
      component.filtroFechaDesde.set('2026-06-06');
      expect(component.movimientosFiltrados().length).toBe(2);

      component.filtroFechaHasta.set('2026-06-06');
      expect(component.movimientosFiltrados().length).toBe(1);
    });

    it('debería excluir movimientos anteriores a desde', () => {
      component.filtroFechaDesde.set('2026-06-07');
      const res = component.movimientosFiltrados();
      expect(res.length).toBe(1); // Only mov-2
      expect(res[0].id).toBe('mov-2');
    });

    it('debería excluir movimientos posteriores a hasta', () => {
      component.filtroFechaHasta.set('2026-06-05');
      const res = component.movimientosFiltrados();
      expect(res.length).toBe(1); // Only mov-1
    });

    it('debería filtrar por rango de precios limitando min y max', () => {
      component.filtroPrecioMin.set(1000);
      expect(component.movimientosFiltrados().length).toBe(2);

      component.filtroPrecioMax.set(2000);
      expect(component.movimientosFiltrados().length).toBe(1);
    });

    it('debería excluir si es menor a minPrice', () => {
      component.filtroPrecioMin.set(2000);
      expect(component.movimientosFiltrados().length).toBe(1); // Solo mov-3 (2500)
    });

    it('debería excluir si es mayor a maxPrice', () => {
      component.filtroPrecioMax.set(1000);
      expect(component.movimientosFiltrados().length).toBe(1); // Solo mov-2 (800)
    });

    it('movimientosAgrupadosPorDia debería agrupar por string de fecha', () => {
      const groups = component.movimientosAgrupadosPorDia();
      expect(groups.length).toBe(3); // 5, 6 and 7 of Jun
      expect(groups[0].fechaStr).toContain('jun');
      expect(groups[0].movimientos.length).toBe(1);
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

  describe('Chips (Filtros Activos)', () => {
    beforeEach(fakeAsync(() => {
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();
    }));

    it('debería generar los activeChips correctamente', () => {
      component.selectedAlumnoId.set('alumno-1');
      component.esVistaIndividual.set(false);
      component.filtroEstado.set('PENDIENTE');
      component.filtroPrecioMin.set(100);
      component.filtroPrecioMax.set(1000);
      component.filtroFechaDesde.set('2026-01-01');
      component.filtroFechaHasta.set('2026-12-31');

      const chips = component.activeChips;
      expect(chips.length).toBe(4);
      expect(chips.find(c => c.id === 'alumno')).toBeDefined();
      expect(chips.find(c => c.id === 'estado')).toBeDefined();
      expect(chips.find(c => c.id === 'rango')).toBeDefined();
      expect(chips.find(c => c.id === 'fecha')).toBeDefined();
    });

    it('debería generar fallback de texto para chips', () => {
      component.filtroEstado.set('DESCONOCIDO');
      component.filtroPrecioMin.set(100); // trigger the chip
      component.filtroPrecioMax.set(null); // probamos fallback de Max
      component.filtroFechaDesde.set(''); // probamos fallback de Inicio
      component.filtroFechaHasta.set('2026-12-31');

      const chips = component.activeChips;
      expect(chips.find(c => c.id === 'estado')?.label).toContain('DESCONOCIDO');
      expect(chips.find(c => c.id === 'rango')?.label).toContain('Max');
      expect(chips.find(c => c.id === 'fecha')?.label).toContain('Inicio');
    });

    it('debería eliminar el chip seleccionado por id', () => {
      component.removeChip('alumno');
      expect(component.selectedAlumnoId()).toBe('todos');
      expect(router.navigate).toHaveBeenCalledWith(['/movimientos']);

      component.filtroEstado.set('PENDIENTE');
      component.removeChip('estado');
      expect(component.filtroEstado()).toBe('TODOS');

      component.filtroPrecioMin.set(10);
      component.removeChip('rango');
      expect(component.filtroPrecioMin()).toBeNull();

      component.filtroFechaDesde.set('2020');
      component.removeChip('fecha');
      expect(component.filtroFechaDesde()).toBe('');
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

    it('debería cancelar el pedido y actualizar el estado a CANCELADO', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.rawMovimientos.set([mockMovimiento2]);
      component.modalMovimiento.set(mockMovimiento2);
      
      component.cancelarPedido('mov-2');
      
      expect(movimientosServiceSpy.cancelarCompra).toHaveBeenCalledWith('mov-2');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Pedido cancelado y saldo reembolsado', 'success');
      expect(component.modalMovimiento()?.status).toBe('CANCELADO');
      expect(component.rawMovimientos()[0].status).toBe('CANCELADO');
    });

    it('no debería cancelar si se rechaza el confirm', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.cancelarPedido('mov-2');
      expect(movimientosServiceSpy.cancelarCompra).not.toHaveBeenCalled();
    });

    it('debería mostrar toast de error si cancelarCompra falla', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      movimientosServiceSpy.cancelarCompra.and.returnValue(throwError(() => new Error('error')));
      spyOn(console, 'error');
      
      component.cancelarPedido('mov-2');
      
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al cancelar el pedido', 'error');
      expect(console.error).toHaveBeenCalled();
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

    it('debería retornar la foto del perfil del alumno si existe', () => {
      alumnosServiceSpy.getAlumnoById.and.callFake((id: string) => {
        if (id === 'alumno-1') return { ...mockAlumno1, urlFotoPerfil: 'url.jpg' };
        return undefined;
      });
      expect(component.getFotoPerfilAlumno('alumno-1')).toBe('url.jpg');
      expect(component.getFotoPerfilAlumno('alumno-desconocido')).toBeNull();
    });

    it('debería formatear precio correctamente', () => {
      expect(component.formatearPrecio(1500)).toContain('1.500'); // Dependiendo del locale
    });

    it('debería formatear fecha correctamente', () => {
      const fecha = component.formatearFecha('2026-06-07T12:00:00Z');
      expect(fecha).toBeTruthy();
      expect(component.formatearFecha('')).toBe(''); // Caso vacío
    });

    it('debería mostrarHoraOMediodia usando pickupSlotDescription si es ANTICIPADA', () => {
      const mov: any = { tipo: 'ANTICIPADA', pickupSlotDescription: 'Almuerzo' };
      expect(component.mostrarHoraOMediodia(mov)).toBe('Almuerzo');
    });

    it('debería mostrarHoraOMediodia parseando fecha normal', () => {
      const mov: any = { tipo: 'NORMAL', date: '2026-06-07T08:30:00Z' };
      const res = component.mostrarHoraOMediodia(mov);
      expect(res).toContain(':'); // Ej: 05:30 hs dependiendo de TimeZone
    });

    it('debería mostrarFecha especial para ANTICIPADA con pickupDate', () => {
      const mov: any = { tipo: 'ANTICIPADA', pickupDate: '2026-06-07', pickupSlotDescription: 'Recreo 1' };
      const res = component.mostrarFecha(mov);
      expect(res).toContain('7 jun 2026'); // Dependiendo del locale, contiene día/mes/año
      expect(res).toContain('Recreo 1');
    });

    it('debería mostrarFecha normal si no es ANTICIPADA o si no tiene pickupDate', () => {
      const mov: any = { tipo: 'NORMAL', date: '2026-06-07T12:00:00Z' };
      const res = component.mostrarFecha(mov);
      expect(res).toBeTruthy();
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

  describe('Vista Alumno', () => {
    let usuarioService: UsuarioService;

    beforeEach(() => {
      usuarioService = TestBed.inject(UsuarioService);
      usuarioService.setHomeUrl('/alumno');
    });

    afterEach(() => {
      usuarioService.setHomeUrl('/tutor');
    });

    it('debería forzar el id del alumno logueado al inicializar', fakeAsync(() => {
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();

      expect(component.selectedAlumnoId()).toBe('alumno-1');
      expect(movimientosServiceSpy.getHistorialAlumno).toHaveBeenCalledWith('alumno-1');
    }));

    it('debería navegar a la home de alumno al presionar volver', fakeAsync(() => {
      paramMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();
      tick();

      component.volver();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/alumno');
    }));
  });
});
