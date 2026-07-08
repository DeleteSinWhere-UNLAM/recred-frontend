import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
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

describe('Movimientos Integration', () => {
  let fixture: ComponentFixture<MovimientosPage>;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioDialog: jasmine.SpyObj<DialogService>;

  const alumno = AlumnoMother.crear({ id: 'alumno-1', nombre: 'Julián', apellido: 'García' });
  const movimientos = [
    MovimientoMother.crear({ id: 'mov-1' }),
    MovimientoMother.crear({ id: 'mov-2', date: '2026-06-07T12:00:00Z', status: 'PENDING' }),
  ];

  beforeEach(async () => {
    servicioMovimientos = jasmine.createSpyObj('MovimientosService', [
      'getHistorialAlumno',
      'getHistorialTutor',
      'cancelarCompra',
    ]);
    servicioMovimientos.getHistorialTutor.and.returnValue(of(movimientos));
    servicioMovimientos.getHistorialAlumno.and.returnValue(of(movimientos));
    servicioMovimientos.cancelarCompra.and.returnValue(of(undefined));

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    servicioAlumnos.asegurarCargados.and.resolveTo([alumno]);
    Object.defineProperty(servicioAlumnos, 'alumnos', {
      value: signal([alumno]),
      writable: true,
    });
    servicioAlumnos.getAlumnoById.and.returnValue(alumno);

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId', 'perfil', 'esPlanGratuito']);
    servicioPerfil.obtenerAlumnoId.and.returnValue('alumno-1');
    servicioPerfil.esPlanGratuito.and.returnValue(false);

    servicioDialog = jasmine.createSpyObj('DialogService', ['confirm']);
    servicioDialog.confirm.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [MovimientosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['mostrar']) },
        { provide: DialogService, useValue: servicioDialog },
        UsuarioService,
        {
          provide: ActivatedRoute,
          useValue: { paramMap: new BehaviorSubject(convertToParamMap({})).asObservable() },
        },
      ],
    })
      .overrideComponent(MovimientosPage, {
        remove: { imports: [NavbarComponent, MovimientoDetalleModalComponent] },
        add: { imports: [NavbarStub, MovimientoDetalleModalStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MovimientosPage);
  });

  it('dado el tutor logueado, cuando se monta la page, deberia pedir el historial del tutor y cargar los movimientos', fakeAsync(() => {
    whenMonto();
    tick();

    expect(servicioMovimientos.getHistorialTutor).toHaveBeenCalled();
    expect(fixture.componentInstance.rawMovimientos().length).toBe(2);
  }));

  it('dado un movimiento sin modal abierto, cuando lo abro, deberia setearlo y propagarlo al stub del modal', fakeAsync(() => {
    whenMonto();
    tick();

    fixture.componentInstance.abrirDetalle(movimientos[0]);
    fixture.detectChanges();

    const modal = obtenerModal();
    expect(modal.movimiento?.id).toBe('mov-1');
  }));

  it('dado el modal abierto, cuando emite cancelar y el user confirma, deberia llamar al service y marcar como CANCELADO', fakeAsync(() => {
    whenMonto();
    tick();
    fixture.componentInstance.abrirDetalle(movimientos[0]);
    fixture.detectChanges();

    obtenerModal().cancelar.emit('mov-1');
    tick();

    expect(servicioMovimientos.cancelarCompra).toHaveBeenCalledWith('mov-1');
    expect(fixture.componentInstance.modalMovimiento()?.status).toBe('CANCELADO');
  }));

  it('dado el tutor con historial cargado, cuando hago click en volver, deberia navegar a /tutor', fakeAsync(() => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    whenMonto();
    tick();

    fixture.componentInstance.volver();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
  }));

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function obtenerModal(): MovimientoDetalleModalStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof MovimientoDetalleModalStub)
      ?.componentInstance as MovimientoDetalleModalStub;
  }
});
