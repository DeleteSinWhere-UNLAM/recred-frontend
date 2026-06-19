import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AlumnoCardComponent } from './alumno-card.component';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { MicrocreditosService, SchoolCredit } from '../../../../data-access/services/microcreditos.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Perfil } from '../../../../data-access/models/perfil.model';

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const alumnoEjemplo: Alumno = {
  id: 'alumno-uuid-1',
  nombre: 'Lucas',
  apellido: 'Martínez',
  grado: '5to B',
  colegioId: 'colegio-1',
  saldo: 2500,
  urlFotoPerfil: null,
};

const alumnoSaldoNegativo: Alumno = {
  ...alumnoEjemplo,
  id: 'alumno-uuid-2',
  nombre: 'Ana',
  saldo: -100,
};

const alumnoSaldoBajo: Alumno = {
  ...alumnoEjemplo,
  id: 'alumno-uuid-3',
  nombre: 'Pedro',
  saldo: 300,
};

const perfilPadre: Perfil = {
  id: 'padre-uuid-1',
  email: 'padre@test.com',
  nombre: 'Jorge',
  apellido: 'García',
  rol: 'PADRE',
};

const creditoEjemplo: SchoolCredit = {
  id: 'credito-1',
  studentId: 'alumno-uuid-1',
  amount: 5000,
  installments: 3,
  status: 'ACTIVE',
  createdAt: '2026-06-01T00:00:00Z',
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('AlumnoCardComponent', () => {
  let componente: AlumnoCardComponent;
  let fixture: ComponentFixture<AlumnoCardComponent>;
  let perfilSignal: any;

  // ── Mocks de servicios ────────────────────────────────────────────────────
  let alumnosServiceEspia: jasmine.SpyObj<AlumnosService>;
  let movimientosServiceEspia: jasmine.SpyObj<MovimientosService>;
  let perfilServiceEspia: jasmine.SpyObj<PerfilService>;
  let microcreditosServiceEspia: jasmine.SpyObj<MicrocreditosService>;
  let toastServiceEspia: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    // Creamos la señal del perfil como PADRE
    perfilSignal = signal<Perfil | null>(perfilPadre);

    alumnosServiceEspia = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'subirFotoAlumno',
    ]);
    movimientosServiceEspia = jasmine.createSpyObj<MovimientosService>('MovimientosService', [
      'getPendientesAlumno',
    ]);
    perfilServiceEspia = jasmine.createSpyObj<PerfilService>('PerfilService', [], {
      perfil: perfilSignal,
    });
    microcreditosServiceEspia = jasmine.createSpyObj<MicrocreditosService>('MicrocreditosService', [
      'getActiveCredit',
      'getLastRecharge',
      'requestCredit',
    ]);
    toastServiceEspia = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    // Configuración por defecto de los observables
    movimientosServiceEspia.getPendientesAlumno.and.returnValue(of([]));
    microcreditosServiceEspia.getActiveCredit.and.returnValue(of(null));
    microcreditosServiceEspia.getLastRecharge.and.returnValue(of(10000));

    await TestBed.configureTestingModule({
      imports: [AlumnoCardComponent],
      providers: [
        provideRouter([]),
        { provide: AlumnosService, useValue: alumnosServiceEspia },
        { provide: MovimientosService, useValue: movimientosServiceEspia },
        { provide: PerfilService, useValue: perfilServiceEspia },
        { provide: MicrocreditosService, useValue: microcreditosServiceEspia },
        { provide: ToastService, useValue: toastServiceEspia },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlumnoCardComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('alumno', alumnoEjemplo);
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con un alumno válido, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  it('dado que ngOnInit se ejecuta con alumno.id, debe llamar a getPendientesAlumno', () => {
    expect(movimientosServiceEspia.getPendientesAlumno).toHaveBeenCalledWith('alumno-uuid-1');
  });

  it('dado que ngOnInit se ejecuta con alumno.id, debe llamar a getActiveCredit', () => {
    expect(microcreditosServiceEspia.getActiveCredit).toHaveBeenCalledWith('alumno-uuid-1');
  });

  it('dado que getPendientesAlumno falla, debe manejar el error sin romper el componente', async () => {
    movimientosServiceEspia.getPendientesAlumno.and.returnValue(throwError(() => new Error('Error de red')));
    microcreditosServiceEspia.getActiveCredit.and.returnValue(of(null));

    const nuevoFixture = TestBed.createComponent(AlumnoCardComponent);
    nuevoFixture.componentRef.setInput('alumno', alumnoEjemplo);
    nuevoFixture.detectChanges();

    expect(nuevoFixture.componentInstance).toBeTruthy();
  });

  it('dado que getActiveCredit falla, debe establecer creditoActivo en null', async () => {
    microcreditosServiceEspia.getActiveCredit.and.returnValue(throwError(() => new Error('Error')));

    const nuevoFixture = TestBed.createComponent(AlumnoCardComponent);
    nuevoFixture.componentRef.setInput('alumno', alumnoEjemplo);
    nuevoFixture.detectChanges();

    expect(nuevoFixture.componentInstance.creditoActivo()).toBeNull();
  });

  // ── get nombreCompleto ────────────────────────────────────────────────────

  it('dado que el alumno tiene nombre y apellido, nombreCompleto debe concatenarlos', () => {
    expect(componente.nombreCompleto).toBe('Lucas Martínez');
  });

  // ── get iniciales ─────────────────────────────────────────────────────────

  it('dado que el alumno tiene nombre y apellido, iniciales debe retornar las primeras letras en mayúscula', () => {
    expect(componente.iniciales).toBe('LM');
  });

  // ── get fotoPerfil ────────────────────────────────────────────────────────

  it('dado que el alumno no tiene foto, fotoPerfil debe retornar null', () => {
    expect(componente.fotoPerfil).toBeNull();
  });

  it('dado que el alumno tiene urlFotoPerfil, fotoPerfil debe retornar la URL', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, urlFotoPerfil: 'https://foto.com/img.jpg' });
    expect(componente.fotoPerfil).toBe('https://foto.com/img.jpg');
  });

  // ── get saldoFormateado ────────────────────────────────────────────────────

  it('dado un alumno con saldo 2500, saldoFormateado debe contener el símbolo de moneda', () => {
    expect(componente.saldoFormateado).toContain('$');
    expect(componente.saldoFormateado).toContain('2.500');
  });

  // ── get saldoNegativo ─────────────────────────────────────────────────────

  it('dado que el saldo es positivo, saldoNegativo debe retornar false', () => {
    expect(componente.saldoNegativo).toBeFalse();
  });

  it('dado que el saldo es negativo, saldoNegativo debe retornar true', () => {
    fixture.componentRef.setInput('alumno', alumnoSaldoNegativo);
    expect(componente.saldoNegativo).toBeTrue();
  });

  // ── get saldoBajo ─────────────────────────────────────────────────────────

  it('dado que el saldo es mayor a 500, saldoBajo debe retornar false', () => {
    expect(componente.saldoBajo).toBeFalse();
  });

  it('dado que el saldo es menor a 500, saldoBajo debe retornar true', () => {
    fixture.componentRef.setInput('alumno', alumnoSaldoBajo);
    expect(componente.saldoBajo).toBeTrue();
  });

  // ── get budgetSpent ────────────────────────────────────────────────────────

  it('dado un alumno con nombre "eugenio", budgetSpent debe retornar 450', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, nombre: 'Eugenio' });
    expect(componente.budgetSpent).toBe(450);
  });

  it('dado un alumno con nombre "emmanuel", budgetSpent debe retornar 700', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, nombre: 'Emmanuel' });
    expect(componente.budgetSpent).toBe(700);
  });

  it('dado un alumno con nombre "adrian", budgetSpent debe retornar 850', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, nombre: 'Adrian' });
    expect(componente.budgetSpent).toBe(850);
  });

  it('dado un alumno con nombre "rocio", budgetSpent debe retornar 600', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, nombre: 'Rocio' });
    expect(componente.budgetSpent).toBe(600);
  });

  it('dado un alumno con nombre genérico, budgetSpent debe retornar 500', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, nombre: 'Lucas' });
    expect(componente.budgetSpent).toBe(500);
  });

  // ── get budgetPercentage ──────────────────────────────────────────────────

  it('dado que budgetSpent es 500 y budgetLimit es 1000, budgetPercentage debe ser 50', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, nombre: 'Lucas' });
    expect(componente.budgetPercentage).toBe(50);
  });

  // ── get budgetSpentFormateado / budgetLimitFormateado ─────────────────────

  it('budgetSpentFormateado debe retornar el gasto con prefijo $', () => {
    fixture.componentRef.setInput('alumno', { ...alumnoEjemplo, nombre: 'Lucas' });
    expect(componente.budgetSpentFormateado).toBe('$500');
  });

  it('budgetLimitFormateado debe retornar el límite con prefijo $', () => {
    expect(componente.budgetLimitFormateado).toBe('$1000');
  });

  // ── get cantidadPendientes ────────────────────────────────────────────────

  it('dado que getPendientesAlumno retorna un array vacío, cantidadPendientes debe ser 0', () => {
    expect(componente.cantidadPendientes).toBe(0);
  });

  // ── get esPadre ───────────────────────────────────────────────────────────

  it('dado que el perfil tiene rol PADRE, esPadre debe retornar true', () => {
    expect(componente.esPadre).toBeTrue();
  });

  it('dado que el perfil es null, esPadre debe retornar false', () => {
    perfilSignal.set(null);
    expect(componente.esPadre).toBeFalse();
  });

  // ── get baseCalculo ───────────────────────────────────────────────────────

  it('dado que ultimaRecarga es 0, baseCalculo debe usar baseRecargaManual', () => {
    componente.ultimaRecarga.set(0);
    expect(componente.baseCalculo).toBe(componente.baseRecargaManual());
  });

  it('dado que ultimaRecarga es mayor a 0, baseCalculo debe usar ultimaRecarga', () => {
    componente.ultimaRecarga.set(8000);
    expect(componente.baseCalculo).toBe(8000);
  });

  // ── get montoCalculado ────────────────────────────────────────────────────

  it('dado tipoMonto "fijo", montoCalculado debe retornar el montoFijo', () => {
    componente.tipoMonto.set('fijo');
    componente.montoFijo.set(3000);
    expect(componente.montoCalculado).toBe(3000);
  });

  it('dado tipoMonto "porcentaje", montoCalculado debe calcular el porcentaje sobre la base', () => {
    componente.tipoMonto.set('porcentaje');
    componente.ultimaRecarga.set(10000);
    componente.porcentaje.set(50);
    expect(componente.montoCalculado).toBe(5000);
  });

  // ── setMontoRapido ────────────────────────────────────────────────────────

  it('dado que se llama a setMontoRapido(25), debe actualizar montoFijo al 25% de la base', () => {
    componente.ultimaRecarga.set(10000);
    componente.setMontoRapido(25);
    expect(componente.montoFijo()).toBe(2500);
  });

  // ── setCuotas ─────────────────────────────────────────────────────────────

  it('dado que se llama a setCuotas(6), debe actualizar la señal cuotas a 6', () => {
    componente.setCuotas(6);
    expect(componente.cuotas()).toBe(6);
  });

  // ── abrirModalMicrocredito ────────────────────────────────────────────────

  it('dado que se llama a abrirModalMicrocredito sin crédito activo, debe abrir el modal y llamar a getLastRecharge', () => {
    componente.creditoActivo.set(null);
    componente.abrirModalMicrocredito();

    expect(componente.showMicrocreditoModal()).toBeTrue();
    expect(microcreditosServiceEspia.getLastRecharge).toHaveBeenCalledWith('alumno-uuid-1');
  });

  it('dado que se llama a abrirModalMicrocredito con crédito activo, debe abrir el modal pero NO llamar a getLastRecharge nuevamente', () => {
    componente.creditoActivo.set(creditoEjemplo);
    microcreditosServiceEspia.getLastRecharge.calls.reset();
    componente.abrirModalMicrocredito();

    expect(componente.showMicrocreditoModal()).toBeTrue();
    expect(microcreditosServiceEspia.getLastRecharge).not.toHaveBeenCalled();
  });

  it('dado que getLastRecharge falla al abrir el modal, debe establecer ultimaRecarga en 0', () => {
    componente.creditoActivo.set(null);
    microcreditosServiceEspia.getLastRecharge.and.returnValue(throwError(() => new Error('Error')));

    componente.abrirModalMicrocredito();

    expect(componente.ultimaRecarga()).toBe(0);
    expect(componente.calculandoRecarga()).toBeFalse();
  });

  // ── cerrarModalMicrocredito ────────────────────────────────────────────────

  it('dado que se llama a cerrarModalMicrocredito, debe ocultar el modal', () => {
    componente.showMicrocreditoModal.set(true);
    componente.cerrarModalMicrocredito();

    expect(componente.showMicrocreditoModal()).toBeFalse();
  });

  // ── confirmarMicrocredito ─────────────────────────────────────────────────

  it('dado que confirmarMicrocredito se llama con monto positivo, debe llamar a requestCredit', () => {
    microcreditosServiceEspia.requestCredit.and.returnValue(of(creditoEjemplo));
    componente.tipoMonto.set('fijo');
    componente.montoFijo.set(2000);

    componente.confirmarMicrocredito();

    expect(microcreditosServiceEspia.requestCredit).toHaveBeenCalled();
  });

  it('dado que confirmarMicrocredito se llama con monto cero o negativo, NO debe llamar a requestCredit', () => {
    componente.tipoMonto.set('fijo');
    componente.montoFijo.set(0);

    spyOn(window, 'alert');
    componente.confirmarMicrocredito();

    expect(microcreditosServiceEspia.requestCredit).not.toHaveBeenCalled();
  });

  it('dado que el perfil es null, confirmarMicrocredito no debe hacer nada', () => {
    perfilSignal.set(null);

    componente.confirmarMicrocredito();

    expect(microcreditosServiceEspia.requestCredit).not.toHaveBeenCalled();
  });

  it('dado que requestCredit retorna 409, debe mostrar el mensaje de crédito duplicado', () => {
    spyOn(window, 'alert');
    const error409 = { status: 409, error: 'Conflict', message: 'Conflict' };
    microcreditosServiceEspia.requestCredit.and.returnValue(throwError(() => error409));
    componente.tipoMonto.set('fijo');
    componente.montoFijo.set(3000);

    componente.confirmarMicrocredito();

    expect(window.alert).toHaveBeenCalledWith('El alumno ya tiene un microcrédito activo.');
  });

  // ── onFotoSeleccionada ────────────────────────────────────────────────────

  it('dado que se selecciona un archivo sin archivos, no debe actualizar fotoEvent', async () => {
    const eventoSinArchivos = { target: { files: null } } as unknown as Event;
    await componente.onFotoSeleccionada(eventoSinArchivos);

    expect(componente['fotoEvent']()).toBeNull();
  });

  it('dado que se selecciona un archivo con tipo no permitido, debe mostrar un toast de error', async () => {
    const archivoInvalido = new File(['contenido'], 'archivo.gif', { type: 'image/gif' });
    const eventoInvalido = {
      target: { files: [archivoInvalido], value: '' },
    } as unknown as Event;

    await componente.onFotoSeleccionada(eventoInvalido);

    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith(
      'Solo se permiten imágenes JPG, PNG o WEBP.',
      'error'
    );
  });

  it('dado que se selecciona un archivo que excede 5 MB, debe mostrar un toast de error', async () => {
    const archivoGrande = new File([new ArrayBuffer(6 * 1024 * 1024)], 'grande.jpg', {
      type: 'image/jpeg',
    });
    const eventoGrande = {
      target: { files: [archivoGrande], value: '' },
    } as unknown as Event;

    await componente.onFotoSeleccionada(eventoGrande);

    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith(
      'La imagen no puede superar los 5 MB.',
      'error'
    );
  });

  it('dado que se selecciona un archivo válido, debe actualizar fotoEvent', async () => {
    const archivoValido = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
    const eventoValido = {
      target: { files: [archivoValido], value: '' },
    } as unknown as Event;

    await componente.onFotoSeleccionada(eventoValido);

    expect(componente['fotoEvent']()).toBe(eventoValido);
  });

  // ── onFotoRecortada ────────────────────────────────────────────────────────

  it('dado que fotoEvent es null, onFotoRecortada no debe hacer nada', async () => {
    componente['fotoEvent'].set(null);
    const blob = new Blob(['img'], { type: 'image/webp' });

    await (componente as any).onFotoRecortada(blob);

    expect(alumnosServiceEspia.subirFotoAlumno).not.toHaveBeenCalled();
  });

  it('dado que fotoEvent tiene evento con archivos, onFotoRecortada debe subir la foto', async () => {
    const archivoValido = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
    const eventoValido = {
      target: { files: [archivoValido], value: '' },
    } as unknown as Event;

    componente['fotoEvent'].set(eventoValido);
    alumnosServiceEspia.subirFotoAlumno.and.resolveTo({
      ...alumnoEjemplo,
      urlFotoPerfil: 'https://nueva-foto.com/img.jpg',
    } as Alumno);

    const blob = new Blob(['img'], { type: 'image/webp' });
    await (componente as any).onFotoRecortada(blob);

    expect(alumnosServiceEspia.subirFotoAlumno).toHaveBeenCalled();
    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith('Foto actualizada correctamente.', 'success');
  });

  it('dado que subirFotoAlumno falla, onFotoRecortada debe mostrar toast de error', async () => {
    const archivoValido = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
    const eventoValido = {
      target: { files: [archivoValido], value: '' },
    } as unknown as Event;

    componente['fotoEvent'].set(eventoValido);
    alumnosServiceEspia.subirFotoAlumno.and.rejectWith(new Error('Error de red'));

    const blob = new Blob(['img'], { type: 'image/webp' });
    await (componente as any).onFotoRecortada(blob);

    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith(
      'No se pudo subir la foto. Intentá de nuevo.',
      'error'
    );
  });

  // ── onCancelarRecorte ─────────────────────────────────────────────────────

  it('dado que fotoEvent tiene evento, onCancelarRecorte debe limpiar el input y fotoEvent', () => {
    const inputMock = { value: 'algo' };
    const eventoConInput = { target: inputMock } as unknown as Event;
    componente['fotoEvent'].set(eventoConInput);

    (componente as any).onCancelarRecorte();

    expect(componente['fotoEvent']()).toBeNull();
    expect(inputMock.value).toBe('');
  });

  it('dado que fotoEvent es null, onCancelarRecorte no debe lanzar error', () => {
    componente['fotoEvent'].set(null);
    expect(() => (componente as any).onCancelarRecorte()).not.toThrow();
  });

  // ── @if (esPadre) → botón de cambio de foto ───────────────────────────────

  it('dado que el perfil es PADRE, debe mostrar el botón para cambiar foto', () => {
    fixture.detectChanges();
    const botonFoto = fixture.debugElement.query(By.css('.alumno-card__avatar-editar'));
    expect(botonFoto).not.toBeNull();
  });

  // ── @if (cantidadPendientes > 0) → badge ─────────────────────────────────

  it('dado que cantidadPendientes es 0, NO debe mostrar el badge de pendientes', () => {
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.alumno-card__btn-badge'));
    expect(badge).toBeNull();
  });

  // ── @if (showMicrocreditoModal) ───────────────────────────────────────────

  it('dado que showMicrocreditoModal es false, NO debe mostrar el modal', () => {
    componente.showMicrocreditoModal.set(false);
    fixture.detectChanges();

    const modal = fixture.debugElement.query(By.css('.modal-overlay'));
    expect(modal).toBeNull();
  });

  it('dado que showMicrocreditoModal es true, debe mostrar el modal', () => {
    microcreditosServiceEspia.getLastRecharge.and.returnValue(of(10000));
    componente.creditoActivo.set(null);
    componente.calculandoRecarga.set(false);
    componente.showMicrocreditoModal.set(true);
    fixture.detectChanges();

    const modal = fixture.debugElement.query(By.css('.modal-overlay'));
    expect(modal).not.toBeNull();
  });
});
