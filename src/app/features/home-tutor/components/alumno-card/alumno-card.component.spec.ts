import { Component, Input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';
import { Perfil } from '../../../../data-access/models/perfil.model';
import { AlumnoMother, PerfilMother } from '../../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { MicrocreditosService } from '../../../../data-access/services/microcreditos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CropModalComponent } from '../../../perfil-usuario/components/crop-modal/crop-modal.component';
import { MovimientosService } from '../../../movimientos/services/movimientos.service';
import { PresupuestoService } from '../../../presupuesto/services/presupuesto.service';
import { AlumnoCardComponent } from './alumno-card.component';

@Component({ selector: 'app-crop-modal', template: '', standalone: true })
class CropModalStub {
  @Input() open = false;
  @Input() fileEvent: Event | null = null;
}

describe('AlumnoCardComponent', () => {
  let component: AlumnoCardComponent;
  let fixture: ComponentFixture<AlumnoCardComponent>;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let servicioMicrocreditos: jasmine.SpyObj<MicrocreditosService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioDialog: jasmine.SpyObj<DialogService>;
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;
  let perfilSignal: WritableSignal<Perfil | null>;

  beforeEach(async () => {
    servicioMovimientos = jasmine.createSpyObj('MovimientosService', [
      'getPendientesAlumno',
      'getHistorialAlumno',
    ]);
    servicioMovimientos.getPendientesAlumno.and.returnValue(of([]));
    servicioMovimientos.getHistorialAlumno.and.returnValue(of([]));

    servicioMicrocreditos = jasmine.createSpyObj('MicrocreditosService', ['getActiveCredit']);
    servicioMicrocreditos.getActiveCredit.and.returnValue(of(null));

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['subirFotoAlumno']);
    servicioAlumnos.subirFotoAlumno.and.resolveTo(AlumnoMother.crear());

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioDialog = jasmine.createSpyObj('DialogService', ['alert', 'confirm']);
    servicioContexto = jasmine.createSpyObj(
      'AlumnoContextoService',
      ['setAlumnoId'],
      { alumnoId: signal('').asReadonly() },
    );
    servicioPresupuesto = jasmine.createSpyObj('PresupuestoService', ['getPresupuesto']);
    servicioPresupuesto.getPresupuesto.and.resolveTo(undefined);

    perfilSignal = signal<Perfil | null>(PerfilMother.crearTutor());

    await TestBed.configureTestingModule({
      imports: [AlumnoCardComponent],
      providers: [
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: MicrocreditosService, useValue: servicioMicrocreditos },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: ToastService, useValue: servicioToast },
        { provide: DialogService, useValue: servicioDialog },
        { provide: AlumnoContextoService, useValue: servicioContexto },
        {
          provide: PerfilService,
          useValue: {
            perfil: perfilSignal.asReadonly(),
            esPlanGratuito: () => {
              const plan = perfilSignal()?.plan?.toUpperCase();
              return plan !== 'INTERMEDIO' && plan !== 'AVANZADO';
            },
          },
        },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        provideRouter([]),
      ],
    })
      .overrideComponent(AlumnoCardComponent, {
        remove: { imports: [CropModalComponent] },
        add: { imports: [CropModalStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AlumnoCardComponent);
    component = fixture.componentInstance;
    component.alumno = AlumnoMother.crear({
      id: 'alumno-1',
      nombre: 'Juan',
      apellido: 'Perez',
      saldo: 1500,
    });
  });

  describe('Estado inicial', () => {
    it('dado un alumno, cuando se monta, deberia pedir pendientes y credito activo', () => {
      whenMonto();

      expect(servicioMovimientos.getPendientesAlumno).toHaveBeenCalledWith('alumno-1');
      expect(servicioMicrocreditos.getActiveCredit).toHaveBeenCalledWith('alumno-1');
    });

    it('dado que getPendientesAlumno falla, cuando se monta, no deberia romper la card', () => {
      spyOn(console, 'error');
      servicioMovimientos.getPendientesAlumno.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();

      expect(component.cantidadPendientes).toBe(0);
    });
  });

  describe('derivaciones de nombre y saldo', () => {
    it('dado un alumno Juan, nombreCompleto e iniciales deberian mostrarse en mayuscula', () => {
      expect(component.nombreCompleto).toBe('Juan Perez');
      expect(component.iniciales).toBe('J');
    });

    it('dado saldo 1500, saldoFormateado deberia incluir $ y 1.500 y no ser negativo ni bajo', () => {
      expect(component.saldoFormateado).toContain('$');
      expect(component.saldoFormateado).toContain('1.500');
      expect(component.saldoNegativo).toBeFalse();
      expect(component.saldoBajo).toBeFalse();
    });

    it('dado saldo < 500, saldoBajo deberia ser true', () => {
      component.alumno = AlumnoMother.crear({ saldo: 300 });
      expect(component.saldoBajo).toBeTrue();
    });

    it('dado saldo negativo, saldoNegativo deberia ser true', () => {
      component.alumno = AlumnoMother.crear({ saldo: -200 });
      expect(component.saldoNegativo).toBeTrue();
    });
  });

  describe('derivaciones de presupuesto', () => {
    it('dado limit 1000 y spent 450, budgetPercentage deberia ser el 55% restante', () => {
      givenPresupuesto(1000, 450);

      expect(component.budgetPercentage).toBe(55);
    });

    it('dado limit 1000 y spent 300, budgetRestanteFormateado deberia formatear 700', () => {
      givenPresupuesto(1000, 300);

      expect(component.budgetRestanteFormateado).toContain('$');
      expect(component.budgetRestanteFormateado).toContain('700');
    });

    it('dado limit 1000, budgetLimitFormateado deberia contener $ y 1.000', () => {
      givenPresupuesto(1000, 0);

      expect(component.budgetLimitFormateado).toContain('$');
      expect(component.budgetLimitFormateado).toContain('1.000');
    });

    it('dado limit 0, budgetPercentage deberia ser 0 (evita division por cero)', () => {
      givenPresupuesto(0, 100);

      expect(component.budgetPercentage).toBe(0);
    });

    it('dado spent mayor al limit, budgetRestanteFormateado deberia clampear a 0', () => {
      givenPresupuesto(1000, 1500);

      expect(component.budgetRestanteFormateado).toContain('0');
    });
  });

  describe('toggleBotones', () => {
    it('dado el estado inicial en false, cuando toggleo, deberia pasar a true', () => {
      expect(component.mostrarTodosLosBotones()).toBeFalse();

      component.toggleBotones();

      expect(component.mostrarTodosLosBotones()).toBeTrue();
    });
  });

  describe('navegar', () => {
    it('dado una ruta, cuando navego, deberia setear el contexto y llamar al router', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.navegar('/tutor/estadistica');

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
      expect(router.navigate).toHaveBeenCalledWith(['/tutor/estadistica']);
    });

    it('dado ruta /adelanto y plan AVANZADO, deberia permitir navegar', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      perfilSignal.set({ ...perfilSignal()!, plan: 'AVANZADO' });

      component.navegar('/adelanto');

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
      expect(router.navigate).toHaveBeenCalledWith(['/adelanto']);
    });

    it('dado ruta /adelanto y plan INTERMEDIO, no deberia permitir navegar', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      perfilSignal.set({ ...perfilSignal()!, plan: 'INTERMEDIO' });

      component.navegar('/adelanto');

      expect(servicioContexto.setAlumnoId).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('permisos derivados del perfil', () => {
    it('dado un perfil PADRE, esPadre deberia ser true y esPremium false por defecto', () => {
      expect(component.esPadre).toBeTrue();
      expect(component.esPremium).toBeFalse();
    });

    it('dado un perfil con plan INTERMEDIO, esPremium deberia ser true', () => {
      perfilSignal.set(PerfilMother.crearTutor());
      const tutorIntermedio = { ...perfilSignal(), plan: 'INTERMEDIO' } as Perfil;
      perfilSignal.set(tutorIntermedio);

      expect(component.esPremium).toBeTrue();
    });

    it('dado plan gratuito, navegarConPlan deberia mostrar bloqueo y no navegar', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.navegarConPlan('/prediccion-gasto', 'INTERMEDIO');

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Disponible con plan Intermedio.', 'info');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('dado plan avanzado, navegarConPlan deberia navegar a una accion avanzada', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      perfilSignal.set({ ...PerfilMother.crearTutor(), plan: 'AVANZADO' });

      component.navegarConPlan('/transferir-saldo', 'AVANZADO');

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
      expect(router.navigate).toHaveBeenCalledWith(['/transferir-saldo']);
    });

    it('dado un perfil ALUMNO, esPadre deberia ser false', () => {
      perfilSignal.set(PerfilMother.crear({ rol: 'ALUMNO' }));

      expect(component.esPadre).toBeFalse();
    });
  });

  describe('validaciones de foto', () => {
    it('dado un archivo no permitido, cuando lo selecciono, deberia mostrar toast y no setear fotoEvent', async () => {
      const input = crearInputConArchivo(new File([''], 'test.pdf', { type: 'application/pdf' }));

      await component.onFotoSeleccionada({ target: input } as unknown as Event);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Solo se permiten imágenes JPG, PNG o WEBP.',
        'error',
      );
    });

    it('dado un archivo > 5MB, cuando lo selecciono, deberia mostrar toast', async () => {
      const grande = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.jpg', { type: 'image/jpeg' });
      const input = crearInputConArchivo(grande);

      await component.onFotoSeleccionada({ target: input } as unknown as Event);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'La imagen no puede superar los 5 MB.',
        'error',
      );
    });

    it('dado un archivo valido, cuando lo selecciono, deberia no mostrar toast de error', async () => {
      const valido = new File([''], 'foto.jpg', { type: 'image/jpeg' });
      const input = crearInputConArchivo(valido);

      await component.onFotoSeleccionada({ target: input } as unknown as Event);

      expect(servicioToast.mostrar).not.toHaveBeenCalled();
    });

    it('dado un input sin files, cuando lo selecciono, no deberia mostrar ningun toast', async () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: null, writable: false });

      await component.onFotoSeleccionada({ target: input } as unknown as Event);

      expect(servicioToast.mostrar).not.toHaveBeenCalled();
    });
  });

  describe('abrirSelectorFoto', () => {
    it('cuando hago click en la foto, deberia disparar el click del input oculto', () => {
      whenMonto();
      const inputFoto = fixture.debugElement.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = spyOn(inputFoto, 'click');

      component.abrirSelectorFoto();

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('onFotoRecortada y onCancelarRecorte', () => {
    it('dado un flujo con archivo valido, cuando recorto, deberia subir la foto y mostrar toast success', async () => {
      const original = new File([''], 'foto.jpg', { type: 'image/jpeg' });
      await seleccionarArchivo(original);

      await (component as unknown as ProtectedFoto).onFotoRecortada(new Blob(['crop'], { type: 'image/webp' }));

      expect(servicioAlumnos.subirFotoAlumno).toHaveBeenCalled();
      const [alumnoIdArg, archivoArg] = servicioAlumnos.subirFotoAlumno.calls.mostRecent().args as [string, File];
      expect(alumnoIdArg).toBe('alumno-1');
      expect(archivoArg.name).toBe('foto.jpg');
      expect(archivoArg.type).toBe('image/webp');
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Foto actualizada correctamente.', 'success');
    });

    it('dado que subirFotoAlumno falla, cuando recorto, deberia mostrar toast de error', async () => {
      servicioAlumnos.subirFotoAlumno.and.rejectWith(new Error('boom'));
      await seleccionarArchivo(new File([''], 'foto.jpg', { type: 'image/jpeg' }));

      await (component as unknown as ProtectedFoto).onFotoRecortada(new Blob(['crop'], { type: 'image/webp' }));

      expect(servicioToast.mostrar).toHaveBeenCalledWith('No se pudo subir la foto. Intentá de nuevo.', 'error');
    });

    it('dado que no hubo seleccion previa, cuando se dispara onFotoRecortada, no deberia subir nada', async () => {
      await (component as unknown as ProtectedFoto).onFotoRecortada(new Blob(['crop'], { type: 'image/webp' }));

      expect(servicioAlumnos.subirFotoAlumno).not.toHaveBeenCalled();
    });

    it('dado que habia un archivo seleccionado, cuando cancelo, deberia limpiar el input y el fotoEvent', async () => {
      await seleccionarArchivo(new File([''], 'foto.jpg', { type: 'image/jpeg' }));
      const input = (component as unknown as ProtectedFoto).fotoEvent()!.target as HTMLInputElement;
      input.value = 'algo';

      (component as unknown as ProtectedFoto).onCancelarRecorte();

      expect(input.value).toBe('');
      expect((component as unknown as ProtectedFoto).fotoEvent()).toBeNull();
    });

    it('dado que no hay foto pendiente, cuando cancelo, no deberia romper', () => {
      expect(() => (component as unknown as ProtectedFoto).onCancelarRecorte()).not.toThrow();
      expect((component as unknown as ProtectedFoto).fotoEvent()).toBeNull();
    });
  });

  describe('derivaciones extra', () => {
    it('dado un alumno con urlFotoPerfil, fotoPerfil deberia devolverla; sin foto deberia devolver null', () => {
      component.alumno = AlumnoMother.crear({ urlFotoPerfil: 'https://cdn/foto.png' });
      expect(component.fotoPerfil).toBe('https://cdn/foto.png');

      component.alumno = AlumnoMother.crear({ urlFotoPerfil: undefined });
      expect(component.fotoPerfil).toBeNull();
    });

    it('dado un alumno con nombre vacio, iniciales deberia devolver string vacio', () => {
      component.alumno = AlumnoMother.crear({ nombre: '' });

      expect(component.iniciales).toBe('');
    });

    it('dado que getActiveCredit falla, creditoActivo deberia quedar en null', () => {
      servicioMicrocreditos.getActiveCredit.and.returnValue(throwError(() => new Error('sin credito')));

      whenMonto();

      expect(component.creditoActivo()).toBeNull();
    });
  });

  describe('cargarPresupuestoYConsumo con budget activo', () => {
    const presupuestoActivo = {
      id: 'b1',
      alumnoId: 'alumno-1',
      montoLimiteGeneral: 2000,
      periodo: 'SEMANAL',
      fechaInicio: '2026-01-01',
      activo: true,
      reglasCategoria: [],
    } as unknown as import('../../../presupuesto/models/presupuesto.model').Presupuesto;

    it('dado un budget activo y una compra APPROVED en el periodo, deberia calcular budgetSpent', async () => {
      servicioPresupuesto.getPresupuesto.and.resolveTo(presupuestoActivo);
      const hoy = new Date().toISOString().slice(0, 10);
      servicioMovimientos.getHistorialAlumno.and.returnValue(
        of([
          { status: 'APPROVED', totalAmount: 700, date: hoy, items: [] },
        ] as unknown as never[]),
      );

      whenMonto();
      await fixture.whenStable();

      expect(component.hasBudget()).toBeTrue();
      expect(component.budgetLimit()).toBe(2000);
      expect(component.budgetSpent()).toBe(700);
    });

    it('dado un budget activo y history null, deberia dejar budgetSpent en 0', async () => {
      servicioPresupuesto.getPresupuesto.and.resolveTo(presupuestoActivo);
      servicioMovimientos.getHistorialAlumno.and.returnValue(of(null as unknown as never[]));

      whenMonto();
      await fixture.whenStable();

      expect(component.budgetSpent()).toBe(0);
    });

    it('dado un budget activo y compras con status desconocido, deberia excluirlas del gasto', async () => {
      servicioPresupuesto.getPresupuesto.and.resolveTo(presupuestoActivo);
      const hoy = new Date().toISOString().slice(0, 10);
      servicioMovimientos.getHistorialAlumno.and.returnValue(
        of([
          { status: 'DESCONOCIDO', totalAmount: 999, date: hoy, items: [] },
        ] as unknown as never[]),
      );

      whenMonto();
      await fixture.whenStable();

      expect(component.budgetSpent()).toBe(0);
    });

    it('dado un budget activo y falla getHistorialAlumno, deberia loguear y dejar budgetSpent en 0', async () => {
      spyOn(console, 'error');
      servicioPresupuesto.getPresupuesto.and.resolveTo(presupuestoActivo);
      servicioMovimientos.getHistorialAlumno.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();
      await fixture.whenStable();

      expect(component.budgetSpent()).toBe(0);
    });
  });

  describe('planLabel y navegarConPlan con plan AVANZADO', () => {
    it('dado plan gratuito y accion que requiere AVANZADO, deberia mostrar el toast con "Avanzado"', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.navegarConPlan('/prediccion-gasto', 'AVANZADO');

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Disponible con plan Avanzado.', 'info');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('onFotoRecortada sin archivo original', () => {
    it('dado que el input pierde su files antes del recorte, no deberia subir foto ni mostrar toast', async () => {
      const original = new File([''], 'foto.jpg', { type: 'image/jpeg' });
      await seleccionarArchivo(original);
      const event = (component as unknown as ProtectedFoto).fotoEvent();
      const input = event!.target as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: null, writable: false, configurable: true });

      await (component as unknown as ProtectedFoto).onFotoRecortada(
        new Blob(['crop'], { type: 'image/webp' }),
      );

      expect(servicioAlumnos.subirFotoAlumno).not.toHaveBeenCalled();
    });
  });

  describe('isActive', () => {
    it('dado que el contexto coincide pero la url no incluye la ruta, deberia devolver false', () => {
      (servicioContexto as unknown as { alumnoId: unknown }).alumnoId = signal('alumno-1').asReadonly();

      expect(component.isActive('/otra-ruta')).toBeFalse();
    });

    it('dado que el contexto coincide y la url incluye la ruta, deberia devolver true', () => {
      Object.defineProperty(servicioContexto, 'alumnoId', {
        value: signal('alumno-1').asReadonly(),
        configurable: true,
      });

      expect(component.isActive('/')).toBeTrue();
    });

    it('dado que el currentUrl es vacio, isActive deberia devolver false por early return', () => {
      Object.defineProperty(component, 'currentUrl', {
        value: () => '',
        configurable: true,
      });

      expect(component.isActive('/algo')).toBeFalse();
    });
  });

  describe('cargarPresupuestoYConsumo con compras que tienen pickupDate', () => {
    const presupuestoActivo = {
      id: 'b1',
      alumnoId: 'alumno-1',
      montoLimiteGeneral: 2000,
      periodo: 'SEMANAL',
      fechaInicio: '2026-01-01',
      activo: true,
      reglasCategoria: [],
    } as unknown as import('../../../presupuesto/models/presupuesto.model').Presupuesto;

    it('dado un budget activo y una compra con pickupDate dentro del rango, deberia calcular budgetSpent usando pickupDate', async () => {
      servicioPresupuesto.getPresupuesto.and.resolveTo(presupuestoActivo);
      const hoy = new Date().toISOString().slice(0, 10);
      servicioMovimientos.getHistorialAlumno.and.returnValue(
        of([
          { status: 'APPROVED', totalAmount: 900, date: '', pickupDate: hoy, items: [] },
        ] as unknown as never[]),
      );

      whenMonto();
      await fixture.whenStable();

      expect(component.budgetSpent()).toBe(900);
    });
  });

  interface ProtectedFoto {
    onFotoRecortada(blob: Blob): Promise<void>;
    onCancelarRecorte(): void;
    fotoEvent(): Event | null;
  }

  async function seleccionarArchivo(archivo: File): Promise<void> {
    const input = crearInputConArchivo(archivo);
    await component.onFotoSeleccionada({ target: input } as unknown as Event);
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function givenPresupuesto(limit: number, spent: number): void {
    component.budgetLimit.set(limit);
    component.budgetSpent.set(spent);
  }

  function crearInputConArchivo(archivo: File): HTMLInputElement {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [archivo], writable: false, configurable: true });
    return input;
  }
});
