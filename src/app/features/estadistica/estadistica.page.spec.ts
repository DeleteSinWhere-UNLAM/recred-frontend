import { Component, Input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import {
  NivelAlerta,
  PrediccionGasto,
} from '../presupuesto/models/presupuesto.model';
import { PrediccionCardComponent } from './components/prediccion-card/prediccion-card.component';
import { EstadisticaPage } from './estadistica.page';
import { PrediccionGastoMother } from './estadistica.mother';
import { EstadisticaPresenter } from './presenter/estadistica.presenter';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MovimientosService } from '../movimientos/services/movimientos.service';
import { of } from 'rxjs';

@Component({
  selector: 'app-prediccion-card',
  template: '',
  standalone: true,
})
class PrediccionCardStub {
  @Input() prediccion: PrediccionGasto | undefined;
  @Input() nivel: NivelAlerta = 'ok';
  @Input() alumnoId!: string;
}

interface PresenterFake {
  init: jasmine.Spy<(alumnoId: string) => void>;
  volver: jasmine.Spy<() => void>;
  alumno: WritableSignal<unknown>;
  prediccion: WritableSignal<PrediccionGasto | undefined>;
  nombreCompleto: WritableSignal<string>;
  grado: WritableSignal<string>;
  urlFotoPerfil: WritableSignal<string | null>;
  iniciales: WritableSignal<string>;
  nivelAlerta: WritableSignal<NivelAlerta>;
  historial: WritableSignal<unknown[]>;
  categoriasMasConsumidas: WritableSignal<unknown[]>;
  analisisIa: WritableSignal<unknown>;
}

describe('EstadisticaPage', () => {
  let component: EstadisticaPage;
  let fixture: ComponentFixture<EstadisticaPage>;
  let presenterFake: PresenterFake;
  let alumnoIdSignal: WritableSignal<string>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;

  beforeEach(async () => {
    presenterFake = crearPresenterFake();
    alumnoIdSignal = signal<string>('alumno-1');

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    servicioMovimientos = jasmine.createSpyObj('MovimientosService', ['getHistorialAlumno']);
    servicioMovimientos.getHistorialAlumno.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [EstadisticaPage],
      providers: [
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: alumnoIdSignal.asReadonly() },
        },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: MovimientosService, useValue: servicioMovimientos },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideCharts(withDefaultRegisterables()),
      ],
    })
      .overrideComponent(EstadisticaPage, {
        remove: { imports: [PrediccionCardComponent] },
        add: {
          imports: [PrediccionCardStub],
          providers: [{ provide: EstadisticaPresenter, useValue: presenterFake }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EstadisticaPage);
    component = fixture.componentInstance;
  });

  describe('init desde el contexto', () => {
    it('dado un alumnoId en el contexto, cuando se monta la page, deberia llamar a presenter.init con ese id', () => {
      whenMonto();

      expect(presenterFake.init).toHaveBeenCalledWith('alumno-1');
    });

    it('dado que cambia el alumnoId del contexto, deberia llamar a presenter.init con el nuevo id', () => {
      whenMonto();
      presenterFake.init.calls.reset();

      alumnoIdSignal.set('alumno-2');
      fixture.detectChanges();

      expect(presenterFake.init).toHaveBeenCalledWith('alumno-2');
    });
  });

  describe('render', () => {

    it('dado una prediccion en curso, deberia propagarla al PrediccionCard con el nivel', () => {
      presenterFake.prediccion.set(PrediccionGastoMother.crear());
      presenterFake.nivelAlerta.set('ok');

      whenMonto();

      const card = fixture.debugElement.query(
        (d) => d.componentInstance instanceof PrediccionCardStub,
      )?.componentInstance as PrediccionCardStub;
      expect(card.prediccion?.gastoActual).toBe(3000);
      expect(card.nivel).toBe('ok');
    });
  });

  describe('nombreUsuario', () => {
    it('dado un usuario en UsuarioService, deberia exponer su nombre', () => {
      expect(component.nombreUsuario).toBe('Tutor Test');
    });
  });

  function crearPresenterFake(): PresenterFake {
    const spy = jasmine.createSpyObj('EstadisticaPresenter', ['init', 'volver']);
    return Object.assign(spy, {
      alumno: signal<unknown>(undefined),
      prediccion: signal<PrediccionGasto | undefined>(undefined),
      nombreCompleto: signal(''),
      grado: signal(''),
      urlFotoPerfil: signal<string | null>(null),
      iniciales: signal(''),
      nivelAlerta: signal<NivelAlerta>('ok'),
      historial: signal([]),
      categoriasMasConsumidas: signal([]),
      analisisIa: signal(null),
    }) as unknown as PresenterFake;
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
