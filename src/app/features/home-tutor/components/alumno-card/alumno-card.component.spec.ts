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
  let perfilSignal: WritableSignal<Perfil | null>;

  beforeEach(async () => {
    servicioMovimientos = jasmine.createSpyObj('MovimientosService', ['getPendientesAlumno']);
    servicioMovimientos.getPendientesAlumno.and.returnValue(of([]));

    servicioMicrocreditos = jasmine.createSpyObj('MicrocreditosService', ['getActiveCredit']);
    servicioMicrocreditos.getActiveCredit.and.returnValue(of(null));

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['subirFotoAlumno']);
    servicioAlumnos.subirFotoAlumno.and.resolveTo(AlumnoMother.crear());

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioDialog = jasmine.createSpyObj('DialogService', ['alert', 'confirm']);
    servicioContexto = jasmine.createSpyObj('AlumnoContextoService', ['setAlumnoId']);

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
        { provide: PerfilService, useValue: { perfil: perfilSignal.asReadonly() } },
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
      expect(component.nombreCompleto).toBe('Juan');
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

  describe('budget mock', () => {
    it('dado un alumno "Eugenio", budgetSpent deberia ser 450 y el porcentaje calculado', () => {
      component.alumno = AlumnoMother.crear({ nombre: 'Eugenio' });

      expect(component.budgetSpent).toBe(450);
      expect(component.budgetPercentage).toBe(45);
      expect(component.budgetSpentFormateado).toBe('$450');
      expect(component.budgetLimitFormateado).toBe('$1000');
    });

    it('dado un alumno "Adrian", budgetSpent deberia ser 850 y porcentaje 85', () => {
      component.alumno = AlumnoMother.crear({ nombre: 'Adrian' });

      expect(component.budgetSpent).toBe(850);
      expect(component.budgetPercentage).toBe(85);
    });

    it('dado un nombre no reconocido, budgetSpent deberia caer al default 500', () => {
      component.alumno = AlumnoMother.crear({ nombre: 'DesconocidoX' });

      expect(component.budgetSpent).toBe(500);
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
  });

  describe('permisos derivados del perfil', () => {
    it('dado un perfil PADRE, esPadre deberia ser true y esPremium false por defecto', () => {
      expect(component.esPadre).toBeTrue();
      expect(component.esPremium).toBeFalse();
    });

    it('dado un perfil con plan PREMIUM, esPremium deberia ser true', () => {
      perfilSignal.set(PerfilMother.crearTutor());
      const tutorPremium = { ...perfilSignal(), plan: 'PREMIUM' } as Perfil;
      perfilSignal.set(tutorPremium);

      expect(component.esPremium).toBeTrue();
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
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function crearInputConArchivo(archivo: File): HTMLInputElement {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [archivo], writable: false });
    return input;
  }
});
