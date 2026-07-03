import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { MovimientoDetalleModalComponent } from './components/movimiento-detalle-modal/movimiento-detalle-modal.component';
import { Movimiento } from './models/movimiento.model';
import { MovimientoMother } from './movimientos.mother';
import { MovimientosPage } from './movimientos.page';
import { MovimientosService } from './services/movimientos.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-movimiento-detalle-modal', template: '', standalone: true })
class MovimientoDetalleModalStub {
  @Input() movimiento: Movimiento | undefined;
  @Input() nombreAlumno = '';
  @Input() esVistaAlumno = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<string>();
}

describe('MovimientosPage', () => {
  let component: MovimientosPage;
  let fixture: ComponentFixture<MovimientosPage>;
  let router: Router;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioDialog: jasmine.SpyObj<DialogService>;
  let paramMap$: BehaviorSubject<ParamMap>;

  const alumno1 = AlumnoMother.crear({ id: 'alumno-1', nombre: 'Julián', apellido: 'García', saldo: 2000 });
  const alumno2 = AlumnoMother.crear({ id: 'alumno-2', nombre: 'Sofía', apellido: 'García', saldo: 1500 });

  const mov1 = MovimientoMother.crear({ id: 'mov-1', studentId: 'alumno-1', totalAmount: 1500 });
  const mov2 = MovimientoMother.crear({
    id: 'mov-2',
    studentId: 'alumno-2',
    status: 'PENDING',
    statusLabel: 'Pendiente',
    totalAmount: 800,
    date: '2026-06-07T12:00:00Z',
  });
  const mov3 = MovimientoMother.crear({
    id: 'mov-3',
    studentId: 'alumno-1',
    status: 'REJECTED',
    statusLabel: 'Rechazado',
    totalAmount: 2500,
    date: '2026-06-06T15:00:00Z',
  });
  const movimientos = [mov1, mov2, mov3];

  beforeEach(async () => {
    localStorage.removeItem('recreopago_homeUrl');
    localStorage.removeItem('recreopago_nombreNavbar');

    servicioMovimientos = jasmine.createSpyObj<MovimientosService>('MovimientosService', [
      'getHistorialAlumno',
      'getHistorialTutor',
      'cancelarCompra',
    ]);
    servicioAlumnos = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['obtenerAlumnoId']);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    servicioDialog = jasmine.createSpyObj<DialogService>('DialogService', ['confirm', 'alert']);
    servicioDialog.confirm.and.resolveTo(true);

    servicioAlumnos.asegurarCargados.and.resolveTo([alumno1, alumno2]);
    Object.defineProperty(servicioAlumnos, 'alumnos', {
      value: signal([alumno1, alumno2]),
      writable: true,
    });
    servicioAlumnos.getAlumnoById.and.callFake((id: string) => {
      if (id === 'alumno-1') return alumno1;
      if (id === 'alumno-2') return alumno2;
      return undefined;
    });

    servicioPerfil.obtenerAlumnoId.and.returnValue('alumno-1');
    servicioMovimientos.getHistorialTutor.and.returnValue(of(movimientos));
    servicioMovimientos.getHistorialAlumno.and.returnValue(of([mov1, mov3]));
    servicioMovimientos.cancelarCompra.and.returnValue(of(undefined));

    paramMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [MovimientosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: ToastService, useValue: servicioToast },
        { provide: DialogService, useValue: servicioDialog },
        UsuarioService,
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
      ],
    })
      .overrideComponent(MovimientosPage, {
        remove: { imports: [NavbarComponent, MovimientoDetalleModalComponent] },
        add: { imports: [NavbarStub, MovimientoDetalleModalStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(MovimientosPage);
    component = fixture.componentInstance;
  });

  describe('carga del historial', () => {
    it('dado sin alumnoId en el paramMap, cuando se monta, deberia cargar el historial del tutor y ordenarlo por fecha desc', fakeAsync(() => {
      whenMonto();
      tick();

      expect(component.selectedAlumnoId()).toBe('todos');
      expect(servicioMovimientos.getHistorialTutor).toHaveBeenCalled();
      expect(component.cargando()).toBeFalse();
      expect(component.rawMovimientos().map((m) => m.id)).toEqual(['mov-2', 'mov-3', 'mov-1']);
    }));

    it('dado un alumnoId en el paramMap, cuando se monta, deberia cargar solo el historial de ese alumno', fakeAsync(() => {
      paramMap$.next(convertToParamMap({ alumnoId: 'alumno-1' }));

      whenMonto();
      tick();

      expect(component.selectedAlumnoId()).toBe('alumno-1');
      expect(servicioMovimientos.getHistorialAlumno).toHaveBeenCalledWith('alumno-1');
      expect(component.rawMovimientos().length).toBe(2);
    }));

    it('dado que la carga falla, cuando se monta, deberia setear el mensaje de error y dejar cargando en false', fakeAsync(() => {
      spyOn(console, 'error');
      servicioMovimientos.getHistorialTutor.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();
      tick();

      expect(component.cargando()).toBeFalse();
      expect(component.errorMsg()).toContain('No se pudieron obtener los movimientos');
    }));
  });

  describe('filtros', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado sin filtros aplicados, movimientosFiltrados deberia devolver los 3 movimientos', () => {
      expect(component.movimientosFiltrados().length).toBe(3);
    });

    it('dado filtroEstado en PENDING, deberia dejar solo mov-2', () => {
      component.filtroEstado.set('PENDING');

      const filtrados = component.movimientosFiltrados();
      expect(filtrados.length).toBe(1);
      expect(filtrados[0].id).toBe('mov-2');
    });

    it('dado filtroFechaDesde 2026-06-06, deberia dejar solo movimientos posteriores', () => {
      component.filtroFechaDesde.set('2026-06-06');

      expect(component.movimientosFiltrados().length).toBe(2);

      component.filtroFechaHasta.set('2026-06-06');
      expect(component.movimientosFiltrados().length).toBe(1);
    });

    it('dado filtroPrecioMin/Max, deberia filtrar por rango de precio', () => {
      component.filtroPrecioMin.set(1000);
      expect(component.movimientosFiltrados().length).toBe(2);

      component.filtroPrecioMax.set(2000);
      expect(component.movimientosFiltrados().length).toBe(1);
    });

    it('dado filtros aplicados, cuando llamo limpiarFiltros, deberia resetear todos', () => {
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

  describe('modal de detalle', () => {
    it('dado sin modal abierto, cuando abro detalle de un movimiento, deberia setearlo en modalMovimiento', () => {
      expect(component.modalMovimiento()).toBeNull();

      component.abrirDetalle(mov1);

      expect(component.modalMovimiento()).toEqual(mov1);
    });

    it('dado el modal abierto, cuando cierro, deberia limpiar modalMovimiento', () => {
      component.abrirDetalle(mov1);

      component.cerrarDetalle();

      expect(component.modalMovimiento()).toBeNull();
    });

    it('dado un pedido en el modal, cuando cancelo y el usuario confirma, deberia actualizar el estado a CANCELADO', fakeAsync(() => {
      component.modalMovimiento.set(mov2);

      component.cancelarPedido('mov-2');
      tick();

      expect(servicioDialog.confirm).toHaveBeenCalled();
      expect(servicioMovimientos.cancelarCompra).toHaveBeenCalledWith('mov-2');
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Pedido cancelado y saldo reembolsado',
        'success',
      );
      expect(component.modalMovimiento()?.status).toBe('CANCELADO');
    }));
  });

  describe('helpers de UI', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado un studentId conocido, getNombreAlumno deberia devolver "Nombre Apellido"', () => {
      expect(component.getNombreAlumno('alumno-1')).toBe('Julián García');
    });

    it('dado un studentId desconocido, getNombreAlumno deberia devolver "Alumno"', () => {
      expect(component.getNombreAlumno('alumno-desconocido')).toBe('Alumno');
    });

    it('dado un studentId conocido, getInicialesAlumno deberia devolver las iniciales en mayuscula', () => {
      expect(component.getInicialesAlumno('alumno-1')).toBe('JG');
    });

    it('dado un studentId desconocido, getInicialesAlumno deberia devolver "AL"', () => {
      expect(component.getInicialesAlumno('alumno-desconocido')).toBe('AL');
    });

    it('dado una fecha valida, formatearFecha deberia devolver un string no vacio', () => {
      expect(component.formatearFecha('2026-06-07T12:00:00Z')).toBeTruthy();
    });

    it('dado un cambio de select a "todos", deberia navegar a /movimientos', () => {
      component.onAlumnoChange({ target: { value: 'todos' } } as unknown as Event);

      expect(router.navigate).toHaveBeenCalledWith(['/movimientos']);
    });

    it('dado un cambio de select a un alumno, deberia navegar a /movimientos/{id}', () => {
      component.onAlumnoChange({ target: { value: 'alumno-1' } } as unknown as Event);

      expect(router.navigate).toHaveBeenCalledWith(['/movimientos', 'alumno-1']);
    });

    it('dado la vista tutor, cuando hago click en volver, deberia navegar a /tutor', () => {
      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  describe('vista alumno', () => {
    let servicioUsuario: UsuarioService;

    beforeEach(() => {
      servicioUsuario = TestBed.inject(UsuarioService);
      servicioUsuario.setHomeUrl('/alumno');
    });

    afterEach(() => servicioUsuario.setHomeUrl('/tutor'));

    it('dado la vista alumno, cuando se monta, deberia forzar el alumnoId del perfil', fakeAsync(() => {
      whenMonto();
      tick();

      expect(component.selectedAlumnoId()).toBe('alumno-1');
      expect(servicioMovimientos.getHistorialAlumno).toHaveBeenCalledWith('alumno-1');
    }));

    it('dado la vista alumno, cuando hago click en volver, deberia navegar a /alumno', fakeAsync(() => {
      whenMonto();
      tick();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/alumno');
    }));
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
