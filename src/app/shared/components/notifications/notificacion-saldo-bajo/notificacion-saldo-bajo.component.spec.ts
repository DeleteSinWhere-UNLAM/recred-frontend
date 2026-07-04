import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';
import { NotificacionSaldoBajoComponent } from './notificacion-saldo-bajo.component';
import {
  NotificacionSaldoBajoService,
  SaldoBajoState,
} from './notificacion-saldo-bajo.service';

class SaldoBajoStateMother {
  static crearVisible(override: Partial<SaldoBajoState> = {}): SaldoBajoState {
    return { show: true, balance: 100, alumnoId: 'alumno-1', ...override };
  }

  static crearOculto(): SaldoBajoState {
    return { show: false, balance: 0, alumnoId: '' };
  }
}

describe('NotificacionSaldoBajoComponent', () => {
  let component: NotificacionSaldoBajoComponent;
  let fixture: ComponentFixture<NotificacionSaldoBajoComponent>;
  let servicioNotif: jasmine.SpyObj<NotificacionSaldoBajoService>;
  let router: jasmine.SpyObj<Router>;
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;
  let stateSignal: ReturnType<typeof signal<SaldoBajoState>>;

  beforeEach(async () => {
    stateSignal = signal<SaldoBajoState>(SaldoBajoStateMother.crearVisible());

    servicioNotif = jasmine.createSpyObj<NotificacionSaldoBajoService>(
      'NotificacionSaldoBajoService',
      ['cerrar'],
      { state$: stateSignal.asReadonly() },
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    servicioContexto = jasmine.createSpyObj<AlumnoContextoService>(
      'AlumnoContextoService',
      ['setAlumnoId'],
    );

    await TestBed.configureTestingModule({
      imports: [NotificacionSaldoBajoComponent],
      providers: [
        { provide: NotificacionSaldoBajoService, useValue: servicioNotif },
        { provide: Router, useValue: router },
        { provide: AlumnoContextoService, useValue: servicioContexto },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionSaldoBajoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('cerrar', () => {
    it('dado el componente, cuando llamo cerrar, deberia delegar al service', () => {
      component.cerrar();

      expect(servicioNotif.cerrar).toHaveBeenCalled();
    });

    it('dado el panel visible, cuando hago click en el boton X, deberia llamar cerrar', () => {
      const boton = (fixture.nativeElement as HTMLElement).querySelector(
        '.notificacion-close',
      ) as HTMLButtonElement;

      boton.click();

      expect(servicioNotif.cerrar).toHaveBeenCalled();
    });

    it('dado el panel visible, cuando hago click en "Más tarde", deberia llamar cerrar', () => {
      const boton = (fixture.nativeElement as HTMLElement).querySelector(
        '.btn-later',
      ) as HTMLButtonElement;

      boton.click();

      expect(servicioNotif.cerrar).toHaveBeenCalled();
    });
  });

  describe('comprarSaldo', () => {
    it('dado un alumnoId, cuando compro saldo, deberia cerrar, setear el contexto y navegar a /acreditar-mercado-pago', () => {
      component.comprarSaldo();

      expect(servicioNotif.cerrar).toHaveBeenCalled();
      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/acreditar-mercado-pago');
    });

    it('dado un state sin alumnoId, cuando compro saldo, deberia loguear error y no navegar ni setear contexto', () => {
      const spyConsole = spyOn(console, 'error');
      stateSignal.set(SaldoBajoStateMother.crearVisible({ alumnoId: '' }));

      component.comprarSaldo();

      expect(servicioNotif.cerrar).toHaveBeenCalled();
      expect(spyConsole).toHaveBeenCalledWith('No se pudo obtener el ID del alumno');
      expect(servicioContexto.setAlumnoId).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('dado el panel visible, cuando hago click en "Acreditar Saldo", deberia disparar comprarSaldo', () => {
      const boton = (fixture.nativeElement as HTMLElement).querySelector(
        '.btn-buy',
      ) as HTMLButtonElement;

      boton.click();

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/acreditar-mercado-pago');
    });
  });

  describe('render', () => {
    it('dado state.show true, deberia renderizar el panel con titulo y balance formateado', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('¡Saldo bajo!');
      expect(texto).toContain('100.00');
    });

    it('dado state.show false, no deberia renderizar el panel', () => {
      stateSignal.set(SaldoBajoStateMother.crearOculto());
      fixture.detectChanges();

      const panel = (fixture.nativeElement as HTMLElement).querySelector(
        '.notificacion-panel',
      );
      expect(panel).toBeNull();
    });

    it('dado un balance distinto, deberia mostrarlo formateado en el body', () => {
      stateSignal.set(SaldoBajoStateMother.crearVisible({ balance: 2500.5 }));
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('2,500.50');
    });
  });
});
