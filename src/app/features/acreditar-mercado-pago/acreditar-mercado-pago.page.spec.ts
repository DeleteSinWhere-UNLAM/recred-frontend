import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Alumno } from '../../data-access/models/alumno.model';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { RecargaVMMother } from './acreditar-mercado-pago.mother';
import { AcreditarMercadoPagoPage } from './acreditar-mercado-pago.page';
import {
  AcreditarMercadoPagoPresenter,
  RecargaVM,
} from './presenter/acreditar-mercado-pago.presenter';

interface PresenterFake {
  init: jasmine.Spy<(alumnoId: string) => Promise<void>>;
  acreditar: jasmine.Spy<(monto: number) => Promise<void>>;
  volver: jasmine.Spy<() => void>;
  cargando: WritableSignal<boolean>;
  alumno: WritableSignal<Alumno | undefined>;
  nombreCompleto: WritableSignal<string>;
  grado: WritableSignal<string>;
  iniciales: WritableSignal<string>;
  urlFotoPerfil: WritableSignal<string | null>;
  historialRecargas: WritableSignal<RecargaVM[]>;
}

describe('AcreditarMercadoPagoPage', () => {
  let component: AcreditarMercadoPagoPage;
  let fixture: ComponentFixture<AcreditarMercadoPagoPage>;
  let presenterFake: PresenterFake;
  let alumnoIdSignal: WritableSignal<string>;

  beforeEach(async () => {
    presenterFake = crearPresenterFake();
    alumnoIdSignal = signal<string>('alumno-1');
    const contextoFake = { alumnoId: alumnoIdSignal.asReadonly() };

    await TestBed.configureTestingModule({
      imports: [AcreditarMercadoPagoPage],
      providers: [
        { provide: AlumnoContextoService, useValue: contextoFake },
      ],
    })
      .overrideComponent(AcreditarMercadoPagoPage, {
        set: {
          providers: [
            { provide: AcreditarMercadoPagoPresenter, useValue: presenterFake },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AcreditarMercadoPagoPage);
    component = fixture.componentInstance;
  });

  describe('init desde el contexto', () => {
    it('dado un alumnoId en el contexto, cuando se monta la page, deberia llamar a presenter.init con ese id', () => {
      whenMonto();

      expect(presenterFake.init).toHaveBeenCalledWith('alumno-1');
    });

    it('dado el contexto sin alumnoId, cuando se monta la page, deberia llamar a presenter.init con string vacio', () => {
      alumnoIdSignal.set('');

      whenMonto();

      expect(presenterFake.init).toHaveBeenCalledWith('');
    });
  });

  describe('input de monto', () => {
    it('dado un input numerico, cuando cambia, deberia actualizar montoIngresado', () => {
      whenMonto();

      whenElInputCambiaA('500');

      expect(component.montoIngresado).toBe(500);
    });

    it('dado un preset de monto, cuando lo selecciono, deberia setear montoIngresado', () => {
      whenMonto();

      (component as unknown as { selectMonto(m: number): void }).selectMonto(2500);

      expect(component.montoIngresado).toBe(2500);
    });

    it('dado el input de monto, deberia definir los minimos y steps nativos de recarga', () => {
      whenMonto();

      const input = queryElemento('#monto') as HTMLInputElement;

      expect(input.getAttribute('min')).toBe('100');
      expect(input.hasAttribute('max')).toBeFalse();
      expect(input.getAttribute('step')).toBe('100');
    });
  });

  describe('submit del formulario', () => {
    it('dado un monto ingresado, cuando hago submit, deberia prevenir el default y llamar a presenter.acreditar', () => {
      whenMonto();
      component.montoIngresado = 1000;
      const evento = new Event('submit');
      spyOn(evento, 'preventDefault');

      (component as unknown as { onSubmit(e: Event): void }).onSubmit(evento);

      expect(evento.preventDefault).toHaveBeenCalled();
      expect(presenterFake.acreditar).toHaveBeenCalledWith(1000);
    });
  });

  describe('render', () => {
    it('dado que el presenter esta cargando y sin alumno, deberia mostrar el loader', () => {
      presenterFake.cargando.set(true);
      presenterFake.alumno.set(undefined);

      whenMonto();

      thenElLoaderEstaVisible();
    });

    it('dado un alumno cargado, deberia mostrar el nombre en el titulo del formulario', () => {
      presenterFake.alumno.set(
        AlumnoMother.crear({ nombre: 'Juan', apellido: 'Perez', saldo: 3000 }),
      );
      presenterFake.nombreCompleto.set('Juan Perez');

      whenMonto();

      const titulo = queryHTMLTexto('.acreditar-page__form-section h3');
      expect(titulo).toContain('Juan');
    });

    it('dado un historial vacio, deberia mostrar el estado vacio del historial', () => {
      presenterFake.alumno.set(AlumnoMother.crearHijoDelTutor());
      presenterFake.historialRecargas.set([]);

      whenMonto();

      expect(queryElemento('.acreditar-page__history-empty')).toBeTruthy();
      expect(queryElemento('.acreditar-page__history-list')).toBeFalsy();
    });

    it('dado recargas en el historial, deberia renderizar una por item', () => {
      presenterFake.alumno.set(AlumnoMother.crearHijoDelTutor());
      presenterFake.historialRecargas.set([
        RecargaVMMother.crear({ id: 'r-1', montoFormateado: '$1.500', fechaFormateada: '29 jun' }),
        RecargaVMMother.crear({ id: 'r-2', montoFormateado: '$2.500', fechaFormateada: '30 jun' }),
      ]);

      whenMonto();

      const items = fixture.nativeElement.querySelectorAll('.acreditar-page__history-item');
      expect(items.length).toBe(2);
    });
  });

  describe('saldoFormateado', () => {
    it('dado un alumno con saldo, deberia formatearlo en ARS', () => {
      presenterFake.alumno.set(AlumnoMother.crear({ saldo: 2500 }));
      whenMonto();

      const salida = (component as unknown as { saldoFormateado: string }).saldoFormateado;

      expect(salida).toContain('2');
      expect(salida).toContain('500');
    });

    it('dado sin alumno, deberia formatear 0', () => {
      presenterFake.alumno.set(undefined);
      whenMonto();

      const salida = (component as unknown as { saldoFormateado: string }).saldoFormateado;

      expect(salida).toContain('0');
    });

    it('dado un alumno sin saldo definido, deberia usar 0 como fallback', () => {
      presenterFake.alumno.set(AlumnoMother.crear({ saldo: undefined as unknown as number }));
      whenMonto();

      const salida = (component as unknown as { saldoFormateado: string }).saldoFormateado;

      expect(salida).toContain('0');
    });
  });

  function crearPresenterFake(): PresenterFake {
    const spy = jasmine.createSpyObj('AcreditarMercadoPagoPresenter', [
      'init',
      'acreditar',
      'volver',
    ]);
    spy.init.and.resolveTo();
    spy.acreditar.and.resolveTo();
    return Object.assign(spy, {
      cargando: signal(false),
      alumno: signal<Alumno | undefined>(undefined),
      nombreCompleto: signal(''),
      grado: signal(''),
      iniciales: signal(''),
      urlFotoPerfil: signal<string | null>(null),
      historialRecargas: signal<RecargaVM[]>([]),
    }) as unknown as PresenterFake;
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function whenElInputCambiaA(valor: string): void {
    const evento = { target: { value: valor } } as unknown as Event;
    (component as unknown as { onMontoChange(e: Event): void }).onMontoChange(evento);
  }

  function queryElemento(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }

  function queryHTMLTexto(selector: string): string {
    return queryElemento(selector)?.textContent?.trim() ?? '';
  }

  function thenElLoaderEstaVisible(): void {
    expect(queryElemento('.acreditar-page__loading')).toBeTruthy();
  }
});
