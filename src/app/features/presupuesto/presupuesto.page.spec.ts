import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ReglaCategoriaItemComponent } from './components/regla-categoria-item/regla-categoria-item.component';
import { Periodo, ReglaCategoria } from './models/presupuesto.model';
import { PresupuestoPresenter } from './presenter/presupuesto.presenter';
import { PresupuestoMother, ReglaCategoriaMother } from './presupuesto.mother';
import { PresupuestoPage } from './presupuesto.page';

interface PresenterFake {
  init: jasmine.Spy<(alumnoId: string) => Promise<void>>;
  setMontoGeneral: jasmine.Spy<(monto: number) => void>;
  setPeriodo: jasmine.Spy<(periodo: Periodo) => void>;
  setFechaInicio: jasmine.Spy<(fecha: string) => void>;
  agregarReglaCategoria: jasmine.Spy<(id: string) => void>;
  setPorcentajeRegla: jasmine.Spy<(id: string, porcentaje: number) => void>;
  eliminarRegla: jasmine.Spy<(id: string) => void>;
  totalPorcentaje: () => number;
  reglas: WritableSignal<ReglaCategoria[]>;
  presupuesto: WritableSignal<ReturnType<typeof PresupuestoMother.crear>>;
  cargando: WritableSignal<boolean>;
  guardando: WritableSignal<boolean>;
  alumno: WritableSignal<unknown>;
  nombreCompleto: WritableSignal<string>;
  grado: WritableSignal<string>;
  iniciales: WritableSignal<string>;
  urlFotoPerfil: WritableSignal<string | null>;
  categoriasDisponibles: WritableSignal<unknown[]>;
  categoriasUsables: WritableSignal<unknown[]>;
  puedeAgregarRegla: WritableSignal<boolean>;
  topeCompletado: WritableSignal<boolean>;
  porcentajeValido: WritableSignal<boolean>;
  prediccion: WritableSignal<unknown>;
  nivelAlerta: WritableSignal<string>;
  periodos: readonly Periodo[];
}

@Component({ selector: 'app-regla-categoria-item', template: '', standalone: true })
class ReglaCategoriaItemStub {
  @Input() regla!: ReglaCategoria;
  @Output() porcentajeChange = new EventEmitter<{ reglaId: string; porcentaje: number }>();
  @Output() eliminar = new EventEmitter<string>();
}

describe('PresupuestoPage', () => {
  let component: PresupuestoPage;
  let fixture: ComponentFixture<PresupuestoPage>;
  let presenterFake: PresenterFake;
  let alumnoIdSignal: WritableSignal<string>;

  beforeEach(async () => {
    presenterFake = crearPresenterFake();
    alumnoIdSignal = signal<string>('alumno-1');

    const servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [PresupuestoPage],
      providers: [
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: alumnoIdSignal.asReadonly() },
        },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(PresupuestoPage, {
        remove: { imports: [ReglaCategoriaItemComponent] },
        add: {
          imports: [ReglaCategoriaItemStub],
          providers: [{ provide: PresupuestoPresenter, useValue: presenterFake }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PresupuestoPage);
    component = fixture.componentInstance;
  });

  describe('init desde contexto', () => {
    it('dado un alumnoId en el contexto, cuando se monta, deberia llamar a presenter.init con ese id', () => {
      whenMonto();

      expect(presenterFake.init).toHaveBeenCalledWith('alumno-1');
    });

    it('dado que cambia el alumnoId, deberia llamar init con el nuevo id', () => {
      whenMonto();
      presenterFake.init.calls.reset();

      alumnoIdSignal.set('alumno-2');
      fixture.detectChanges();

      expect(presenterFake.init).toHaveBeenCalledWith('alumno-2');
    });
  });

  describe('etiquetaPeriodo', () => {
    it('dado un periodo, deberia devolver el label en espanol', () => {
      const helper = component as unknown as { etiquetaPeriodo(p: Periodo): string };

      expect(helper.etiquetaPeriodo('DIARIO')).toBe('Diario');
      expect(helper.etiquetaPeriodo('SEMANAL')).toBe('Semanal');
      expect(helper.etiquetaPeriodo('QUINCENAL')).toBe('Quincenal');
      expect(helper.etiquetaPeriodo('MENSUAL')).toBe('Mensual');
    });
  });

  describe('handlers de eventos', () => {
    it('dado un input de monto, cuando cambia, deberia llamar a setMontoGeneral con el valor numerico', () => {
      const helper = component as unknown as { onMontoChange(e: Event): void };

      helper.onMontoChange({ target: { value: '5000' } } as unknown as Event);

      expect(presenterFake.setMontoGeneral).toHaveBeenCalledWith(5000);
    });

    it('dado un select de periodo, cuando cambia, deberia llamar a setPeriodo con el valor', () => {
      const helper = component as unknown as { onPeriodoChange(e: Event): void };

      helper.onPeriodoChange({ target: { value: 'SEMANAL' } } as unknown as Event);

      expect(presenterFake.setPeriodo).toHaveBeenCalledWith('SEMANAL');
    });

    it('dado un input de fecha, cuando cambia, deberia llamar a setFechaInicio con el valor', () => {
      const helper = component as unknown as { onFechaChange(e: Event): void };

      helper.onFechaChange({ target: { value: '2026-07-01' } } as unknown as Event);

      expect(presenterFake.setFechaInicio).toHaveBeenCalledWith('2026-07-01');
    });

    it('dado un select con value vacio en onAgregarRegla, no deberia llamar a agregarReglaCategoria', () => {
      const helper = component as unknown as { onAgregarRegla(e: Event): void };

      helper.onAgregarRegla({ target: { value: '' } } as unknown as Event);

      expect(presenterFake.agregarReglaCategoria).not.toHaveBeenCalled();
    });

    it('dado un select con categoriaId, cuando cambia, deberia llamar a agregarReglaCategoria y limpiar el valor', () => {
      const helper = component as unknown as { onAgregarRegla(e: Event): void };
      const target = { value: 'cat-bebidas' } as HTMLSelectElement;

      helper.onAgregarRegla({ target } as unknown as Event);

      expect(presenterFake.agregarReglaCategoria).toHaveBeenCalledWith('cat-bebidas');
      expect(target.value).toBe('');
    });

    it('dado un cambio de porcentaje emitido por el item, deberia delegar a setPorcentajeRegla', () => {
      const helper = component as unknown as {
        onPorcentajeChange(c: { reglaId: string; porcentaje: number }): void;
      };

      helper.onPorcentajeChange({ reglaId: 'r-1', porcentaje: 42 });

      expect(presenterFake.setPorcentajeRegla).toHaveBeenCalledWith('r-1', 42);
    });

    it('dado un id emitido por el item para eliminar, deberia delegar a eliminarRegla', () => {
      const helper = component as unknown as { onEliminarRegla(id: string): void };

      helper.onEliminarRegla('r-1');

      expect(presenterFake.eliminarRegla).toHaveBeenCalledWith('r-1');
    });
  });

  describe('totalPorcentajeAcotado', () => {
    it('dado totalPorcentaje = 60, deberia devolver 60', () => {
      presenterFake.totalPorcentaje = () => 60;

      const helper = component as unknown as { totalPorcentajeAcotado: number };
      expect(helper.totalPorcentajeAcotado).toBe(60);
    });

    it('dado totalPorcentaje > 100, deberia acotarlo a 100', () => {
      presenterFake.totalPorcentaje = () => 150;

      const helper = component as unknown as { totalPorcentajeAcotado: number };
      expect(helper.totalPorcentajeAcotado).toBe(100);
    });
  });

  describe('nombreUsuario', () => {
    it('dado un usuario en UsuarioService, deberia exponer su nombre', () => {
      expect(component.nombreUsuario).toBe('Tutor Test');
    });
  });

  function crearPresenterFake(): PresenterFake {
    const spy = jasmine.createSpyObj('PresupuestoPresenter', [
      'init',
      'setMontoGeneral',
      'setPeriodo',
      'setFechaInicio',
      'agregarReglaCategoria',
      'setPorcentajeRegla',
      'eliminarRegla',
      'guardar',
      'volver',
    ]);
    spy.init.and.resolveTo();

    return Object.assign(spy, {
      reglas: signal<ReglaCategoria[]>([ReglaCategoriaMother.crear()]),
      presupuesto: signal(PresupuestoMother.crear()),
      cargando: signal(false),
      guardando: signal(false),
      alumno: signal<unknown>(undefined),
      nombreCompleto: signal(''),
      grado: signal(''),
      iniciales: signal(''),
      urlFotoPerfil: signal<string | null>(null),
      categoriasDisponibles: signal<unknown[]>([]),
      categoriasUsables: signal<unknown[]>([]),
      puedeAgregarRegla: signal(true),
      topeCompletado: signal(false),
      porcentajeValido: signal(true),
      prediccion: signal<unknown>(undefined),
      nivelAlerta: signal('ok'),
      periodos: ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'] as const,
      totalPorcentaje: () => 0,
    }) as unknown as PresenterFake;
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
