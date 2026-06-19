import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { ColegioSectionComponent } from './colegio-section.component';
import { Colegio } from '../../../../data-access/models/colegio.model';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { MicrocreditosService } from '../../../../data-access/services/microcreditos.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Perfil } from '../../../../data-access/models/perfil.model';

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const colegioEjemplo: Colegio = {
  id: 'colegio-1',
  nombre: 'Colegio Nacional Buenos Aires',
};

const alumnoUno: Alumno = {
  id: 'alumno-1',
  nombre: 'Lucas',
  apellido: 'Martínez',
  grado: '5to B',
  colegioId: 'colegio-1',
  saldo: 2000,
};

const alumnoDos: Alumno = {
  id: 'alumno-2',
  nombre: 'Ana',
  apellido: 'García',
  grado: '6to A',
  colegioId: 'colegio-1',
  saldo: 1500,
};

const perfilPadre: Perfil = {
  id: 'padre-1',
  email: 'padre@test.com',
  nombre: 'Jorge',
  apellido: 'Sánchez',
  rol: 'PADRE',
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('ColegioSectionComponent', () => {
  let componente: ColegioSectionComponent;
  let fixture: ComponentFixture<ColegioSectionComponent>;

  beforeEach(async () => {
    const perfilSignal = signal<Perfil | null>(perfilPadre);

    const alumnosServiceEspia = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'subirFotoAlumno',
    ]);
    const movimientosServiceEspia = jasmine.createSpyObj<MovimientosService>('MovimientosService', [
      'getPendientesAlumno',
    ]);
    const perfilServiceEspia = jasmine.createSpyObj<PerfilService>('PerfilService', [], {
      perfil: perfilSignal,
    });
    const microcreditosServiceEspia = jasmine.createSpyObj<MicrocreditosService>('MicrocreditosService', [
      'getActiveCredit',
      'getLastRecharge',
      'requestCredit',
    ]);
    const toastServiceEspia = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    movimientosServiceEspia.getPendientesAlumno.and.returnValue(of([]));
    microcreditosServiceEspia.getActiveCredit.and.returnValue(of(null));
    microcreditosServiceEspia.getLastRecharge.and.returnValue(of(0));

    await TestBed.configureTestingModule({
      imports: [ColegioSectionComponent],
      providers: [
        provideRouter([]),
        { provide: AlumnosService, useValue: alumnosServiceEspia },
        { provide: MovimientosService, useValue: movimientosServiceEspia },
        { provide: PerfilService, useValue: perfilServiceEspia },
        { provide: MicrocreditosService, useValue: microcreditosServiceEspia },
        { provide: ToastService, useValue: toastServiceEspia },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColegioSectionComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('colegio', colegioEjemplo);
    fixture.componentRef.setInput('alumnos', [alumnoUno, alumnoDos]);
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con colegio y alumnos válidos, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── Estado inicial: expandido = true ──────────────────────────────────────

  it('dado que se inicializa, expandido debe ser true por defecto', () => {
    expect(componente.expandido()).toBeTrue();
  });

  // ── toggle ────────────────────────────────────────────────────────────────

  it('dado que expandido es true, toggle debe cambiar a false', () => {
    componente.toggle();
    expect(componente.expandido()).toBeFalse();
  });

  it('dado que expandido es false, toggle debe cambiar a true', () => {
    componente.toggle();
    componente.toggle();
    expect(componente.expandido()).toBeTrue();
  });

  it('dado que se hace click en el botón del header, debe llamar a toggle', () => {
    const boton = fixture.debugElement.query(By.css('.colegio-section__sidebar-header'));
    boton.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(componente.expandido()).toBeFalse();
  });

  // ── get totalSaldo ────────────────────────────────────────────────────────

  it('dado dos alumnos con saldo 2000 y 1500, totalSaldo debe retornar 3500', () => {
    expect(componente.totalSaldo).toBe(3500);
  });

  it('dado un arreglo vacío de alumnos, totalSaldo debe retornar 0', () => {
    fixture.componentRef.setInput('alumnos', []);
    expect(componente.totalSaldo).toBe(0);
  });

  // ── get totalSaldoFormateado ───────────────────────────────────────────────

  it('dado dos alumnos con saldo 2000 y 1500, totalSaldoFormateado debe contener el símbolo de moneda', () => {
    expect(componente.totalSaldoFormateado).toContain('$');
    expect(componente.totalSaldoFormateado).toContain('3.500');
  });

  // ── @if (expandido) → sidebar-body ────────────────────────────────────────

  it('dado que expandido es true, debe mostrar el sidebar con info de alumnos', () => {
    const sidebarBody = fixture.debugElement.query(By.css('.colegio-section__sidebar-body'));
    expect(sidebarBody).not.toBeNull();
  });

  it('dado que expandido es false, NO debe mostrar el sidebar-body', () => {
    componente.toggle();
    fixture.detectChanges();

    const sidebarBody = fixture.debugElement.query(By.css('.colegio-section__sidebar-body'));
    expect(sidebarBody).toBeNull();
  });

  // ── Texto de cantidad de alumnos ──────────────────────────────────────────

  it('dado dos alumnos, debe mostrar "2 alumnos" en el sidebar', () => {
    const infoRow = fixture.debugElement.query(By.css('.colegio-section__info-row span'));
    expect(infoRow.nativeElement.textContent).toContain('2 alumnos');
  });

  it('dado un solo alumno, debe mostrar "1 alumno" en singular', () => {
    fixture.componentRef.setInput('alumnos', [alumnoUno]);
    fixture.detectChanges();

    const infoRow = fixture.debugElement.query(By.css('.colegio-section__info-row span'));
    expect(infoRow.nativeElement.textContent).toContain('1 alumno');
  });

  // ── @if (expandido) → content con alumno-cards ───────────────────────────

  it('dado que expandido es true, debe renderizar un app-alumno-card por cada alumno', () => {
    const cards = fixture.debugElement.queryAll(By.css('app-alumno-card'));
    expect(cards.length).toBe(2);
  });

  it('dado que expandido es false, NO debe renderizar ningún app-alumno-card', () => {
    componente.toggle();
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('app-alumno-card'));
    expect(cards.length).toBe(0);
  });

  // ── aria-expanded en el botón ─────────────────────────────────────────────

  it('dado que expandido es true, el botón debe tener aria-expanded="true"', () => {
    const boton = fixture.debugElement.query(By.css('.colegio-section__sidebar-header'));
    expect(boton.nativeElement.getAttribute('aria-expanded')).toBe('true');
  });

  it('dado que expandido es false, el botón debe tener aria-expanded="false"', () => {
    componente.toggle();
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('.colegio-section__sidebar-header'));
    expect(boton.nativeElement.getAttribute('aria-expanded')).toBe('false');
  });

  // ── @Input: colegio ───────────────────────────────────────────────────────

  it('dado que recibe un colegio, debe mostrar su nombre en el encabezado', () => {
    const nombreEl = fixture.debugElement.query(By.css('.colegio-section__nombre'));
    expect(nombreEl.nativeElement.textContent).toContain('Colegio Nacional Buenos Aires');
  });

  it('dado que recibe un colegio, el aria-label de la sección debe corresponder al nombre del colegio', () => {
    const seccion = fixture.debugElement.query(By.css('.colegio-section'));
    expect(seccion.nativeElement.getAttribute('aria-label')).toBe('Colegio Nacional Buenos Aires');
  });
});
