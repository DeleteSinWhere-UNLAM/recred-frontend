import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
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
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['obtenerAlumnoId', 'esPlanGratuito']);
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
    servicioPerfil.esPlanGratuito.and.returnValue(true);
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

    it('dado un studentId conocido, getNombreAlumno deberia devolver "Nombre Apellido" en vista alumno, pero solo Nombre en vista tutor', () => {
      expect(component.getNombreAlumno('alumno-1')).toBe('Julián');
    });

    it('dado un studentId desconocido, getNombreAlumno deberia devolver "Alumno"', () => {
      expect(component.getNombreAlumno('alumno-desconocido')).toBe('Alumno');
    });

    it('dado un studentId conocido, getInicialesAlumno deberia devolver las iniciales de tutor (solo nombre)', () => {
      expect(component.getInicialesAlumno('alumno-1')).toBe('J');
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

    it('dado la vista alumno sin alumnoId de perfil, cuando se monta, deberia usar el alumno actual del usuario', fakeAsync(() => {
      servicioPerfil.obtenerAlumnoId.and.returnValue(null);
      spyOn(servicioUsuario, 'getAlumnoActual').and.returnValue({ ...alumno2 });

      whenMonto();
      tick();

      expect(component.selectedAlumnoId()).toBe('alumno-2');
      expect(servicioMovimientos.getHistorialAlumno).toHaveBeenCalledWith('alumno-2');
    }));

    it('dado la vista alumno, cuando hago click en volver, deberia navegar a /alumno', fakeAsync(() => {
      whenMonto();
      tick();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/alumno');
    }));
  });

  describe('filtros extra (busqueda y fecha exacta)', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado filtroBusqueda con "tostado", deberia dejar solo los movimientos con ese producto', () => {
      component.filtroBusqueda.set('Tostado');

      expect(component.movimientosFiltrados().length).toBe(3);

      component.filtroBusqueda.set('inexistente');
      expect(component.movimientosFiltrados().length).toBe(0);
    });

    it('dado filtroFecha 2026-06-07, deberia dejar solo los movimientos de ese dia exacto', () => {
      component.filtroFecha.set('2026-06-07');

      const filtrados = component.movimientosFiltrados();
      expect(filtrados.map((m) => m.id)).toEqual(['mov-2']);
    });
  });

  describe('agrupacion de movimientos', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado criterio ALUMNO, deberia agrupar por nombre de alumno ordenado alfabeticamente', () => {
      component.criterioAgrupacion.set('ALUMNO');

      const grupos = component.movimientosAgrupados();
      expect(grupos.map((g) => g.titulo)).toEqual(['Julián', 'Sofía']);
      expect(grupos[0].movimientos.map((m) => m.id).sort()).toEqual(['mov-1', 'mov-3']);
    });

    it('dado criterio FECHA_RETIRO, deberia mostrar la fecha de retiro de las anticipadas y agrupar las presenciales bajo el fallback', () => {
      const anticipada = MovimientoMother.crearAnticipada({
        id: 'mov-ant',
        studentId: 'alumno-1',
        pickupDate: '2026-07-15',
      });
      component.rawMovimientos.set([mov1, anticipada]);
      component.criterioAgrupacion.set('FECHA_RETIRO');

      const grupos = component.movimientosAgrupados();
      expect(grupos.map((g) => g.titulo)).toEqual([
        '15 jul 2026',
        'Consumos Presenciales / Sin Retiro Programado',
      ]);
    });

    it('dado criterio FECHA_RETIRO con pickupDate mal formado, deberia usar el string tal cual como titulo', () => {
      const rara = MovimientoMother.crearAnticipada({
        id: 'mov-rara',
        studentId: 'alumno-1',
        pickupDate: '15/07/2026',
      });
      component.rawMovimientos.set([rara]);
      component.criterioAgrupacion.set('FECHA_RETIRO');

      expect(component.movimientosAgrupados()[0].titulo).toBe('15/07/2026');
    });
  });

  describe('toggleGroup e isGroupExpanded', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado un grupo expandido, cuando lo toggleo, deberia colapsarlo y luego re-expandirlo', () => {
      expect(component.isGroupExpanded('cualquiera')).toBeTrue();

      component.toggleGroup('cualquiera');
      expect(component.isGroupExpanded('cualquiera')).toBeFalse();

      component.toggleGroup('cualquiera');
      expect(component.isGroupExpanded('cualquiera')).toBeTrue();
    });
  });

  describe('activeChips y removeChip', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado filtros de alumno, estado, rango y fecha, activeChips deberia listar los 4 chips', () => {
      component.selectedAlumnoId.set('alumno-1');
      component.filtroEstado.set('PENDIENTE');
      component.filtroPrecioMin.set(100);
      component.filtroPrecioMax.set(2000);
      component.filtroFechaDesde.set('2026-06-01');
      component.filtroFechaHasta.set('2026-06-30');

      const ids = component.activeChips.map((c) => c.id);
      expect(ids).toEqual(['alumno', 'estado', 'rango', 'fecha']);
    });

    it('dado filtroEstado con codigo desconocido, el chip deberia usar el codigo como label', () => {
      component.filtroEstado.set('CODIGO_RARO');

      const chipEstado = component.activeChips.find((c) => c.id === 'estado');
      expect(chipEstado?.label).toBe('Estado: CODIGO_RARO');
    });

    it('dado solo filtroPrecioMax, el chip rango deberia mostrar "$0 - $X"', () => {
      component.filtroPrecioMax.set(5000);

      const rango = component.activeChips.find((c) => c.id === 'rango');
      expect(rango?.label).toBe('Rango: $0 - $5000');
    });

    it('dado solo filtroFechaHasta, el chip fecha deberia mostrar "Inicio a X"', () => {
      component.filtroFechaHasta.set('2026-06-30');

      const fecha = component.activeChips.find((c) => c.id === 'fecha');
      expect(fecha?.label).toBe('Fechas: Inicio a 2026-06-30');
    });

    it('dado removeChip("alumno"), deberia volver a "todos" y navegar', () => {
      component.selectedAlumnoId.set('alumno-1');

      component.removeChip('alumno');

      expect(component.selectedAlumnoId()).toBe('todos');
      expect(router.navigate).toHaveBeenCalledWith(['/movimientos']);
    });

    it('dado removeChip("estado"), deberia resetear el filtro a TODOS', () => {
      component.filtroEstado.set('PENDIENTE');

      component.removeChip('estado');

      expect(component.filtroEstado()).toBe('TODOS');
    });

    it('dado removeChip("rango"), deberia resetear min y max', () => {
      component.filtroPrecioMin.set(100);
      component.filtroPrecioMax.set(2000);

      component.removeChip('rango');

      expect(component.filtroPrecioMin()).toBeNull();
      expect(component.filtroPrecioMax()).toBeNull();
    });

    it('dado removeChip("fecha"), deberia limpiar desde y hasta', () => {
      component.filtroFechaDesde.set('2026-06-01');
      component.filtroFechaHasta.set('2026-06-30');

      component.removeChip('fecha');

      expect(component.filtroFechaDesde()).toBe('');
      expect(component.filtroFechaHasta()).toBe('');
    });
  });

  describe('helpers de UI adicionales', () => {
    beforeEach(fakeAsync(() => {
      whenMonto();
      tick();
    }));

    it('dado una compra ANTICIPADA con pickupSlotDescription, mostrarHoraOMediodia deberia devolver la descripcion del slot', () => {
      const anticipada = MovimientoMother.crearAnticipada({
        pickupSlotDescription: 'Primer recreo',
      });

      expect(component.mostrarHoraOMediodia(anticipada)).toBe('Primer recreo');
    });

    it('dado una compra ANTICIPADA con pickupDate valido, mostrarFecha deberia formatear la fecha y anexar el slot', () => {
      const anticipada = MovimientoMother.crearAnticipada({
        pickupDate: '2026-07-15',
        pickupSlotDescription: 'Primer recreo',
      });

      const texto = component.mostrarFecha(anticipada);
      expect(texto).toContain('2026');
      expect(texto).toContain('Primer recreo');
    });

    it('dado una compra ANTICIPADA con pickupDate mal formado, mostrarFecha deberia dejar el string tal cual', () => {
      const anticipada = MovimientoMother.crearAnticipada({
        pickupDate: '15/07/2026',
        pickupSlotDescription: undefined,
      });

      expect(component.mostrarFecha(anticipada)).toBe('15/07/2026');
    });

    it('dado una compra no anticipada, mostrarFecha deberia delegar a formatearFecha', () => {
      expect(component.mostrarFecha(mov1)).toBe(component.formatearFecha(mov1.date));
    });

    it('dado un string vacio, formatearFecha deberia devolver vacio', () => {
      expect(component.formatearFecha('')).toBe('');
    });

    it('dado un alumno sin nombre ni apellido, getInicialesAlumno deberia devolver vacio', () => {
      servicioAlumnos.getAlumnoById.and.returnValue(AlumnoMother.crear({ id: 'x', nombre: '', apellido: '' }));

      expect(component.getInicialesAlumno('x')).toBe('');
    });

    it('dado un alumno con foto, getFotoPerfilAlumno deberia devolver la URL', () => {
      servicioAlumnos.getAlumnoById.and.returnValue(AlumnoMother.crear({ id: 'x', urlFotoPerfil: 'https://cdn/foto.png' }));

      expect(component.getFotoPerfilAlumno('x')).toBe('https://cdn/foto.png');
    });

    it('dado un studentId desconocido, getFotoPerfilAlumno deberia devolver null', () => {
      expect(component.getFotoPerfilAlumno('inexistente')).toBeNull();
    });
  });

  describe('esPremium', () => {
    it('dado un perfil con plan INTERMEDIO, esPremium deberia ser true', fakeAsync(() => {
      servicioPerfil.esPlanGratuito.and.returnValue(false);
      whenMonto();
      tick();

      expect(component.esPremium()).toBeTrue();
    }));

    it('dado un perfil con plan GRATIS, esPremium deberia ser false', fakeAsync(() => {
      servicioPerfil.esPlanGratuito.and.returnValue(true);
      whenMonto();
      tick();

      expect(component.esPremium()).toBeFalse();
    }));
  });

  describe('cancelarPedido — error path', () => {
    it('dado que cancelarCompra falla, deberia mostrar toast de error', fakeAsync(() => {
      spyOn(console, 'error');
      servicioMovimientos.cancelarCompra.and.returnValue(throwError(() => new Error('sin conexion')));
      whenMonto();
      tick();

      component.cancelarPedido('mov-1');
      tick();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al cancelar el pedido', 'error');
    }));

    it('dado que el usuario cancela el dialogo, no deberia llamar a cancelarCompra', fakeAsync(() => {
      servicioDialog.confirm.and.resolveTo(false);
      whenMonto();
      tick();
      servicioMovimientos.cancelarCompra.calls.reset();

      component.cancelarPedido('mov-1');
      tick();

      expect(servicioMovimientos.cancelarCompra).not.toHaveBeenCalled();
    }));
  });

  describe('limpiarFiltros en vista tutor con alumno seleccionado', () => {
    it('dado un alumno seleccionado, cuando limpio filtros, deberia volver a "todos" y navegar', fakeAsync(() => {
      paramMap$.next(convertToParamMap({ alumnoId: 'alumno-1' }));
      whenMonto();
      tick();

      component.limpiarFiltros();

      expect(component.selectedAlumnoId()).toBe('todos');
      expect(router.navigate).toHaveBeenCalledWith(['/movimientos']);
    }));

    it('dado la vista tutor-movimientos anidada, removeChip("alumno") deberia navegar al prefijo tutor-movimientos', fakeAsync(() => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/tutor-movimientos');
      whenMonto();
      tick();
      component.selectedAlumnoId.set('alumno-1');

      component.removeChip('alumno');

      expect(router.navigate).toHaveBeenCalledWith(['/tutor-movimientos']);
    }));

    it('dado la vista tutor-movimientos anidada, onAlumnoChange deberia usar ese prefijo al navegar', fakeAsync(() => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/tutor-movimientos');
      whenMonto();
      tick();

      component.onAlumnoChange({ target: { value: 'alumno-1' } } as unknown as Event);

      expect(router.navigate).toHaveBeenCalledWith(['/tutor-movimientos', 'alumno-1']);
    }));

    it('dado nested + contextoService con alumnoId, cuando se monta sin param, deberia seleccionar ese alumno', fakeAsync(() => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/tutor-movimientos');
      const ctx = TestBed.inject(AlumnoContextoService);
      ctx.setAlumnoId('alumno-2');

      whenMonto();
      tick();

      expect(component.selectedAlumnoId()).toBe('alumno-2');
      ctx.limpiar();
    }));
  });

  describe('activeChips con filtros parciales', () => {
    it('dado filtroPrecioMin sin max, el chip rango deberia usar "Max" como fallback', fakeAsync(() => {
      whenMonto();
      tick();
      component.filtroPrecioMin.set(100);
      component.filtroPrecioMax.set(null);

      const chip = component.activeChips.find((c) => c.id === 'rango');
      expect(chip?.label).toContain('Max');
    }));

    it('dado filtroFechaDesde sin hasta, el chip fecha deberia usar "Fin" como fallback', fakeAsync(() => {
      whenMonto();
      tick();
      component.filtroFechaDesde.set('2026-06-01');
      component.filtroFechaHasta.set('');

      const chip = component.activeChips.find((c) => c.id === 'fecha');
      expect(chip?.label).toContain('Fin');
    }));

    it('dado filtroFechaHasta sin desde, el chip fecha deberia usar "Inicio" como fallback', fakeAsync(() => {
      whenMonto();
      tick();
      component.filtroFechaDesde.set('');
      component.filtroFechaHasta.set('2026-06-15');

      const chip = component.activeChips.find((c) => c.id === 'fecha');
      expect(chip?.label).toContain('Inicio');
    }));

    it('dado un filtroEstado no mapeado, el chip estado deberia usar el valor crudo', fakeAsync(() => {
      whenMonto();
      tick();
      component.filtroEstado.set('CUSTOM');

      const chip = component.activeChips.find((c) => c.id === 'estado');
      expect(chip?.label).toContain('CUSTOM');
    }));
  });

  describe('MovimientoMother.crearCancelado', () => {
    it('dado ningun override, deberia devolver un movimiento cancelado por defecto', () => {
      const cancelado = MovimientoMother.crearCancelado();

      expect(cancelado.status).toBe('CANCELADO');
      expect(cancelado.statusLabel).toBe('Cancelado');
    });

    it('dado un override, deberia mergearlo sobre el default', () => {
      const cancelado = MovimientoMother.crearCancelado({ id: 'mov-custom', totalAmount: 999 });

      expect(cancelado.id).toBe('mov-custom');
      expect(cancelado.totalAmount).toBe(999);
      expect(cancelado.status).toBe('CANCELADO');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
