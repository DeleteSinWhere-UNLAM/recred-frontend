import { Component, EventEmitter, Input, Output, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { MovimientoDetalleModalComponent } from '../movimientos/components/movimiento-detalle-modal/movimiento-detalle-modal.component';
import { Movimiento } from '../movimientos/models/movimiento.model';
import { MovimientoMother } from '../movimientos/movimientos.mother';
import { MovimientosService } from '../movimientos/services/movimientos.service';
import { MovimientosPendientesPage } from './movimientos-pendientes.page';

@Component({ selector: 'app-movimiento-detalle-modal', template: '', standalone: true })
class MovimientoDetalleModalStub {
  @Input() movimiento: Movimiento | undefined;
  @Input() nombreAlumno = '';
  @Input() esVistaAlumno = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<string>();
}

describe('MovimientosPendientesPage', () => {
  let component: MovimientosPendientesPage;
  let fixture: ComponentFixture<MovimientosPendientesPage>;
  let router: Router;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioDialog: jasmine.SpyObj<DialogService>;
  let alumnoIdSignal: WritableSignal<string>;

  const alumno = AlumnoMother.crear({
    id: 'alumno-1',
    nombre: 'Julián',
    apellido: 'García',
  });

  const movPendiente = MovimientoMother.crearPendiente({
    id: 'mov-1',
    studentId: 'alumno-1',
    totalAmount: 1500,
    date: '2026-06-07T10:00:00Z',
    status: 'PENDIENTE',
  });
  const movListo = MovimientoMother.crear({
    id: 'mov-2',
    studentId: 'alumno-1',
    status: 'LISTO',
    statusLabel: 'Listo',
    totalAmount: 2500,
    date: '2026-06-08T12:00:00Z',
  });

  beforeEach(async () => {
    alumnoIdSignal = signal<string>('alumno-1');

    servicioMovimientos = jasmine.createSpyObj<MovimientosService>('MovimientosService', [
      'getPendientesAlumno',
      'cancelarCompra',
    ]);
    servicioAlumnos = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['perfil', 'esPlanGratuito']);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    servicioDialog = jasmine.createSpyObj<DialogService>('DialogService', ['confirm']);

    servicioAlumnos.asegurarCargados.and.resolveTo([alumno]);
    servicioAlumnos.getAlumnoById.and.callFake((id: string) =>
      id === 'alumno-1' ? alumno : undefined,
    );
    servicioPerfil.perfil.and.returnValue(null);
    servicioPerfil.esPlanGratuito.and.returnValue(true);
    servicioMovimientos.getPendientesAlumno.and.returnValue(of([movPendiente, movListo]));
    servicioMovimientos.cancelarCompra.and.returnValue(of(undefined));
    servicioDialog.confirm.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [MovimientosPendientesPage],
      providers: [
        provideRouter([]),
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: ToastService, useValue: servicioToast },
        { provide: DialogService, useValue: servicioDialog },
        UsuarioService,
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: alumnoIdSignal.asReadonly() },
        },
      ],
    })
      .overrideComponent(MovimientosPendientesPage, {
        remove: { imports: [MovimientoDetalleModalComponent] },
        add: { imports: [MovimientoDetalleModalStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(MovimientosPendientesPage);
    component = fixture.componentInstance;
  });

  describe('carga inicial', () => {
    it('dado un alumnoId en el contexto, cuando se monta, deberia cargar los pendientes y ordenarlos por fecha desc', fakeAsync(() => {
      whenMonto();
      tick();

      expect(servicioAlumnos.asegurarCargados).toHaveBeenCalled();
      expect(servicioMovimientos.getPendientesAlumno).toHaveBeenCalledWith('alumno-1');
      expect(component.cargando()).toBeFalse();
      expect(component.rawMovimientos().map((m) => m.id)).toEqual(['mov-2', 'mov-1']);
    }));

    it('dado un alumno del contexto, cuando se monta, deberia setear su primer nombre', fakeAsync(() => {
      whenMonto();
      tick();

      expect(component.nombreAlumno()).toBe('Julián');
    }));

    it('dado un alumnoId que no matchea ningun alumno, cuando se monta, deberia mostrar "Alumno" como nombre', fakeAsync(() => {
      servicioAlumnos.getAlumnoById.and.returnValue(undefined);

      whenMonto();
      tick();

      expect(component.nombreAlumno()).toBe('Alumno');
    }));

    it('dado sin alumnoId en el contexto, cuando se monta, no deberia pedir pendientes', fakeAsync(() => {
      alumnoIdSignal.set('');

      whenMonto();
      tick();

      expect(servicioMovimientos.getPendientesAlumno).not.toHaveBeenCalled();
    }));

    it('dado que la carga falla, cuando se monta, deberia setear el mensaje de error', fakeAsync(() => {
      spyOn(console, 'error');
      servicioMovimientos.getPendientesAlumno.and.returnValue(
        throwError(() => new Error('boom')),
      );

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

    it('dado sin filtros, movimientosFiltrados deberia devolver los 2 pendientes', () => {
      expect(component.movimientosFiltrados().length).toBe(2);
    });

    it('dado filtroEstado LISTO, deberia dejar solo el listo', () => {
      component.filtroEstado.set('LISTO');

      const filtrados = component.movimientosFiltrados();
      expect(filtrados.length).toBe(1);
      expect(filtrados[0].id).toBe('mov-2');
    });

    it('dado filtroBusqueda por nombre de producto, deberia filtrar por items', () => {
      component.filtroBusqueda.set('tostado');

      expect(component.movimientosFiltrados().length).toBe(2);

      component.filtroBusqueda.set('no-existe');
      expect(component.movimientosFiltrados().length).toBe(0);
    });

    it('dado filtroFecha exacta, deberia dejar solo movimientos de ese dia', () => {
      component.filtroFecha.set('2026-06-07');

      const filtrados = component.movimientosFiltrados();
      expect(filtrados.length).toBe(1);
      expect(filtrados[0].id).toBe('mov-1');
    });

    it('dado filtroPrecioMin/Max, deberia filtrar por rango', () => {
      component.filtroPrecioMin.set(2000);
      expect(component.movimientosFiltrados().length).toBe(1);

      component.filtroPrecioMin.set(null);
      component.filtroPrecioMax.set(2000);
      expect(component.movimientosFiltrados().length).toBe(1);
    });

    it('dado filtros aplicados, cuando llamo limpiarFiltros, deberia resetear todos', () => {
      component.filtroEstado.set('LISTO');
      component.filtroFechaDesde.set('2026-06-01');
      component.filtroPrecioMin.set(100);
      component.filtroBusqueda.set('algo');

      component.limpiarFiltros();

      expect(component.filtroEstado()).toBe('TODOS');
      expect(component.filtroFechaDesde()).toBe('');
      expect(component.filtroPrecioMin()).toBeNull();
      expect(component.filtroBusqueda()).toBe('');
    });
  });

  describe('chips activos', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado sin filtros, activeChips deberia estar vacio', () => {
      expect(component.activeChips.length).toBe(0);
    });

    it('dado filtroEstado PENDIENTE, activeChips deberia mostrar "Estado: A Preparar"', () => {
      component.filtroEstado.set('PENDIENTE');

      expect(component.activeChips.find((c) => c.id === 'estado')?.label).toBe(
        'Estado: A Preparar',
      );
    });

    it('dado precio min y max, activeChips deberia mostrar el rango', () => {
      component.filtroPrecioMin.set(1000);
      component.filtroPrecioMax.set(3000);

      expect(component.activeChips.find((c) => c.id === 'rango')?.label).toContain('$1000');
    });

    it('dado un chip de estado, cuando llamo removeChip, deberia limpiarlo', () => {
      component.filtroEstado.set('LISTO');

      component.removeChip('estado');

      expect(component.filtroEstado()).toBe('TODOS');
    });

    it('dado un chip de fecha, cuando llamo removeChip, deberia limpiar desde y hasta', () => {
      component.filtroFechaDesde.set('2026-06-01');
      component.filtroFechaHasta.set('2026-06-30');

      component.removeChip('fecha');

      expect(component.filtroFechaDesde()).toBe('');
      expect(component.filtroFechaHasta()).toBe('');
    });
  });

  describe('modal de detalle', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado sin modal abierto, cuando abro detalle, deberia setear modalMovimiento', () => {
      component.abrirDetalle(movPendiente);

      expect(component.modalMovimiento()).toEqual(movPendiente);
    });

    it('dado el modal abierto, cuando cierro, deberia limpiar modalMovimiento', () => {
      component.abrirDetalle(movPendiente);

      component.cerrarDetalle();

      expect(component.modalMovimiento()).toBeNull();
    });

    it('dado un pedido pendiente, cuando cancelo y el usuario confirma, deberia sacarlo de la lista y cerrar el modal', fakeAsync(() => {
      component.abrirDetalle(movPendiente);

      component.cancelarPedido('mov-1');
      tick();

      expect(servicioDialog.confirm).toHaveBeenCalled();
      expect(servicioMovimientos.cancelarCompra).toHaveBeenCalledWith('mov-1');
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Pedido cancelado y saldo reembolsado',
        'success',
      );
      expect(component.rawMovimientos().find((m) => m.id === 'mov-1')).toBeUndefined();
      expect(component.modalMovimiento()).toBeNull();
    }));

    it('dado un pedido pendiente, cuando cancelo y el usuario cancela el dialog, no deberia hacer nada', fakeAsync(() => {
      servicioDialog.confirm.and.resolveTo(false);

      component.cancelarPedido('mov-1');
      tick();

      expect(servicioMovimientos.cancelarCompra).not.toHaveBeenCalled();
    }));

    it('dado que la cancelacion falla, deberia mostrar el toast de error', fakeAsync(() => {
      spyOn(console, 'error');
      servicioMovimientos.cancelarCompra.and.returnValue(
        throwError(() => new Error('boom')),
      );

      component.cancelarPedido('mov-1');
      tick();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cancelar el pedido',
        'error',
      );
    }));
  });

  describe('helpers de UI', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado un studentId conocido, getInicialesAlumno deberia devolver JG', () => {
      expect(component.getInicialesAlumno('alumno-1')).toBe('JG');
    });

    it('dado un studentId desconocido, getInicialesAlumno deberia devolver AL', () => {
      expect(component.getInicialesAlumno('no-existe')).toBe('AL');
    });

    it('dado un alumno sin foto, getFotoPerfilAlumno deberia devolver null', () => {
      expect(component.getFotoPerfilAlumno('alumno-1')).toBeNull();
    });

    it('dado un movimiento presencial, mostrarHoraOMediodia deberia devolver hora:min hs', () => {
      const mov = MovimientoMother.crear({ date: '2026-06-07T14:30:00Z' });

      expect(component.mostrarHoraOMediodia(mov)).toMatch(/\d{2}:\d{2} hs/);
    });

    it('dado un movimiento anticipado con slot, mostrarHoraOMediodia deberia devolver la descripcion del slot', () => {
      const mov = MovimientoMother.crearAnticipada();

      expect(component.mostrarHoraOMediodia(mov)).toBe('Primer recreo');
    });

    it('dado un movimiento anticipado con fecha de retiro, mostrarFecha deberia incluir la fecha y el slot', () => {
      const mov = MovimientoMother.crearAnticipada();

      const texto = component.mostrarFecha(mov);
      expect(texto).toContain('Primer recreo');
    });

    it('dado un precio, formatearPrecio deberia devolver un string en pesos argentinos', () => {
      const precio = component.formatearPrecio(1500);
      expect(precio).toContain('1');
      expect(precio).toContain('500');
    });

    it('dado sin fecha, formatearFecha deberia devolver string vacio', () => {
      expect(component.formatearFecha('')).toBe('');
    });
  });

  describe('agrupamiento por dia', () => {
    it('dado movimientos de distintos dias, deberia agruparlos por fecha', fakeAsync(() => {
      whenMonto();
      tick();

      const grupos = component.movimientosAgrupadosPorDia();
      expect(grupos.length).toBe(2);
      expect(grupos[0].movimientos.length).toBe(1);
    }));
  });

  describe('navegacion', () => {
    it('dado el componente montado, cuando llamo volver, deberia navegar a /tutor', fakeAsync(() => {
      whenMonto();
      tick();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    }));
  });

  describe('esPremium segun plan', () => {
    it('dado un perfil INTERMEDIO, esPremium deberia ser true', fakeAsync(() => {
      servicioPerfil.esPlanGratuito.and.returnValue(false);

      whenMonto();
      tick();

      expect(component.esPremium()).toBeTrue();
    }));

    it('dado un perfil basico, esPremium deberia ser false', fakeAsync(() => {
      servicioPerfil.esPlanGratuito.and.returnValue(true);

      whenMonto();
      tick();

      expect(component.esPremium()).toBeFalse();
    }));
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
