import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MovimientosPendientesPage } from './movimientos-pendientes.page';
import { MovimientosService } from '../movimientos/services/movimientos.service';
import { Movimiento } from '../movimientos/models/movimiento.model';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';

describe('MovimientosPendientesPage', () => {
  let component: MovimientosPendientesPage;
  let fixture: ComponentFixture<MovimientosPendientesPage>;
  let movimientosService: jasmine.SpyObj<MovimientosService>;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let router: Router;
  let toastService: jasmine.SpyObj<ToastService>;

  const movimientos: Movimiento[] = [
    {
      id: 'pend-1',
      studentId: '123',
      totalAmount: 1500,
      status: 'PENDIENTE',
      statusLabel: 'A Preparar',
      paymentMethod: 'DEBIT',
      date: '2026-06-18T09:10:00',
      items: [
        {
          productId: 'prod-1',
          productName: 'Alfajor',
          quantity: 1,
          unitPrice: 1500,
        },
      ],
      tipo: 'PRESENCIAL',
    },
    {
      id: 'listo-1',
      studentId: '123',
      totalAmount: 2500,
      status: 'LISTO',
      statusLabel: 'Listo',
      paymentMethod: 'DEBIT',
      date: '2026-06-19T10:30:00',
      items: [
        {
          productId: 'prod-2',
          productName: 'Tostado',
          quantity: 1,
          unitPrice: 2500,
        },
      ],
      tipo: 'ANTICIPADA',
      withdrawalCode: 'ABC123',
      pickupDate: '2026-06-20',
      pickupSlotDescription: 'Primer recreo',
    },
    {
      id: 'prep-1',
      studentId: 'sin-alumno',
      totalAmount: 900,
      status: 'EN_PREPARACION',
      statusLabel: 'En preparacion',
      paymentMethod: 'DEBIT',
      date: '2026-06-17T08:00:00',
      items: [
        {
          productId: 'prod-3',
          productName: 'Jugo',
          quantity: 1,
          unitPrice: 900,
        },
      ],
      tipo: 'PRESENCIAL',
    },
  ];

  beforeEach(async () => {
    movimientosService = jasmine.createSpyObj<MovimientosService>(
      'MovimientosService',
      ['getPendientesAlumno', 'cancelarCompra'],
    );
    alumnosService = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', [
      'mostrar',
    ]);

    movimientosService.getPendientesAlumno.and.returnValue(of(movimientos));
    movimientosService.cancelarCompra.and.returnValue(of(undefined));
    alumnosService.asegurarCargados.and.returnValue(Promise.resolve([]));
    alumnosService.getAlumnoById.and.callFake((id: string) =>
      id === 'sin-alumno'
        ? undefined
        : {
            id,
            nombre: 'Juan',
            apellido: 'Perez',
            grado: '1A',
            colegioId: 'colegio-1',
            saldo: 0,
            urlFotoPerfil: id === '123' ? 'foto.jpg' : null,
          },
    );

    await TestBed.configureTestingModule({
      imports: [MovimientosPendientesPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { paramMap: of({ get: () => '123' }) } 
        },
        { provide: MovimientosService, useValue: movimientosService },
        { provide: AlumnosService, useValue: alumnosService },
        { 
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  nombreNavbar: signal('Test') , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        },
        { provide: PerfilService, useValue: {} },
        { provide: ToastService, useValue: toastService },
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(MovimientosPendientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('deberia cargar alumno y movimientos pendientes ordenados al iniciar', fakeAsync(() => {
    tick();

    expect(component.alumnoId()).toBe('123');
    expect(component.nombreAlumno()).toBe('Juan Perez');
    expect(component.cargando()).toBeFalse();
    expect(component.rawMovimientos().map((mov) => mov.id)).toEqual([
      'listo-1',
      'pend-1',
      'prep-1',
    ]);
  }));

  it('deberia filtrar por busqueda, fecha, estado y rango de precio', () => {
    component.rawMovimientos.set(movimientos);

    component.filtroBusqueda.set('tos');
    expect(component.movimientosFiltrados().map((mov) => mov.id)).toEqual([
      'listo-1',
    ]);

    component.filtroBusqueda.set('');
    component.filtroFecha.set('2026-06-18');
    expect(component.movimientosFiltrados().map((mov) => mov.id)).toEqual([
      'pend-1',
    ]);

    component.filtroFecha.set('');
    component.filtroEstado.set('EN_PREPARACION');
    component.filtroFechaDesde.set('2026-06-17');
    component.filtroFechaHasta.set('2026-06-17');
    component.filtroPrecioMin.set(800);
    component.filtroPrecioMax.set(1000);

    expect(component.movimientosFiltrados().map((mov) => mov.id)).toEqual([
      'prep-1',
    ]);

    component.filtroPrecioMax.set(850);
    expect(component.movimientosFiltrados()).toEqual([]);
  });

  it('deberia agrupar movimientos filtrados por dia', () => {
    component.rawMovimientos.set(movimientos);

    const grupos = component.movimientosAgrupadosPorDia();

    expect(grupos.length).toBe(3);
    expect(grupos[0].fechaStr).toContain('18 jun 2026');
    expect(grupos[0].movimientos[0].id).toBe('pend-1');
  });

  it('deberia exponer y remover chips activos', () => {
    component.filtroEstado.set('PENDIENTE');
    component.filtroPrecioMin.set(500);
    component.filtroFechaHasta.set('2026-06-20');

    expect(component.activeChips.map((chip) => chip.label)).toEqual([
      'Estado: A Preparar',
      'Rango: $500 - Max',
      'Fechas: Inicio a 2026-06-20',
    ]);

    component.removeChip('estado');
    component.removeChip('rango');
    component.removeChip('fecha');

    expect(component.filtroEstado()).toBe('TODOS');
    expect(component.filtroPrecioMin()).toBeNull();
    expect(component.filtroPrecioMax()).toBeNull();
    expect(component.filtroFechaDesde()).toBe('');
    expect(component.filtroFechaHasta()).toBe('');
  });

  it('deberia limpiar todos los filtros', () => {
    component.filtroBusqueda.set('alfajor');
    component.filtroFecha.set('2026-06-18');
    component.filtroEstado.set('LISTO');
    component.filtroFechaDesde.set('2026-06-17');
    component.filtroFechaHasta.set('2026-06-19');
    component.filtroPrecioMin.set(100);
    component.filtroPrecioMax.set(3000);

    component.limpiarFiltros();

    expect(component.filtroBusqueda()).toBe('');
    expect(component.filtroFecha()).toBe('');
    expect(component.filtroEstado()).toBe('TODOS');
    expect(component.filtroFechaDesde()).toBe('');
    expect(component.filtroFechaHasta()).toBe('');
    expect(component.filtroPrecioMin()).toBeNull();
    expect(component.filtroPrecioMax()).toBeNull();
  });

  it('deberia formatear fecha, hora, precio e identidad del alumno', () => {
    expect(component.mostrarHoraOMediodia(movimientos[1])).toBe('Primer recreo');
    expect(component.mostrarHoraOMediodia(movimientos[0])).toBe('09:10 hs');
    expect(component.mostrarFecha(movimientos[1])).toContain('Primer recreo');
    expect(component.mostrarFecha(movimientos[0])).toContain('2026');
    expect(component.formatearFecha('')).toBe('');
    expect(component.formatearPrecio(1500)).toContain('1.500');
    expect(component.getInicialesAlumno('123')).toBe('JP');
    expect(component.getInicialesAlumno('sin-alumno')).toBe('AL');
    expect(component.getFotoPerfilAlumno('123')).toBe('foto.jpg');
    expect(component.getFotoPerfilAlumno('sin-alumno')).toBeNull();
  });

  it('deberia abrir y cerrar el detalle', () => {
    component.abrirDetalle(movimientos[0]);
    expect(component.modalMovimiento()).toBe(movimientos[0]);

    component.cerrarDetalle();
    expect(component.modalMovimiento()).toBeNull();
  });

  it('deberia navegar al panel tutor al volver', () => {
    component.volver();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
  });

  it('deberia cancelar pedido confirmado y quitarlo de la lista', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.rawMovimientos.set(movimientos);
    component.abrirDetalle(movimientos[0]);

    component.cancelarPedido('pend-1');

    expect(movimientosService.cancelarCompra).toHaveBeenCalledWith('pend-1');
    expect(toastService.mostrar).toHaveBeenCalledWith(
      'Pedido cancelado y saldo reembolsado',
      'success',
    );
    expect(component.rawMovimientos().map((mov) => mov.id)).not.toContain(
      'pend-1',
    );
    expect(component.modalMovimiento()).toBeNull();
  });

  it('no deberia cancelar pedido si el usuario no confirma', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.cancelarPedido('pend-1');

    expect(movimientosService.cancelarCompra).not.toHaveBeenCalled();
  });

  it('deberia mostrar error si falla la cancelacion', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    movimientosService.cancelarCompra.and.returnValue(
      throwError(() => new Error('error')),
    );

    component.cancelarPedido('pend-1');

    expect(toastService.mostrar).toHaveBeenCalledWith(
      'Error al cancelar el pedido',
      'error',
    );
  });

  it('deberia mostrar error si falla la carga de pendientes', () => {
    movimientosService.getPendientesAlumno.and.returnValue(
      throwError(() => new Error('error')),
    );
    component.alumnoId.set('123');

    component.cargarHistorial();

    expect(component.cargando()).toBeFalse();
    expect(component.errorMsg()).toContain('No se pudieron obtener');
  });
});
