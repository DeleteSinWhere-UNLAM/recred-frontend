import { Component, Input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
import { AnalisisIa } from '../models/analisis-ia.interface';
import {
  CategoriaMasConsumida,
  PrediccionGasto,
} from '../models/prediccion-gasto.interface';
import { AnalisisPrediccionComponent } from '../components/analisis-prediccion/analisis-prediccion.component';
import { ResumenPrediccionComponent } from '../components/resumen-prediccion/resumen-prediccion.component';
import { ALUMNO_ID_TEST, PrediccionGastoMother } from '../prediccion-gasto.mother';
import { PrediccionGastoService } from '../services/prediccion-gasto.service';
import { PrediccionGastoPageComponent } from './prediccion-gasto-page.component';

@Component({
  selector: 'app-prediction-summary',
  template: '',
  standalone: true,
})
class ResumenPrediccionStub {
  @Input() periodo = '';
  @Input() fechaCalculo = '';
  @Input() fechaInicio = '';
  @Input() fechaFin = '';
  @Input() gastoActual = 0;
  @Input() gastoPredicho = 0;
  @Input() promedioGastoDiario = 0;
  @Input() montoLimite: number | null = null;
  @Input() porcentajePresupuesto: number | null = null;
  @Input() diasHistoricosUsados = 0;
  @Input() diasRestantes = 0;
}

@Component({
  selector: 'app-prediction-analysis',
  template: '',
  standalone: true,
})
class AnalisisPrediccionStub {
  @Input() analisisIa: AnalisisIa | null = null;
  @Input() categoriasMasConsumidas: CategoriaMasConsumida[] = [];
}

describe('PrediccionGastoPageComponent', () => {
  let component: PrediccionGastoPageComponent;
  let fixture: ComponentFixture<PrediccionGastoPageComponent>;
  let servicioPrediccion: jasmine.SpyObj<PrediccionGastoService>;
  let alumnoIdSignal: WritableSignal<string>;
  let router: Router;

  function crearFixture(routeParam: string | null = null): void {
    const activatedRouteFake = {
      snapshot: { paramMap: { get: () => routeParam } },
    };

    TestBed.configureTestingModule({
      imports: [PrediccionGastoPageComponent],
      providers: [
        { provide: PrediccionGastoService, useValue: servicioPrediccion },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: alumnoIdSignal.asReadonly() },
        },
        { provide: ActivatedRoute, useValue: activatedRouteFake },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigateByUrl']) },
      ],
    })
      .overrideComponent(PrediccionGastoPageComponent, {
        remove: {
          imports: [ResumenPrediccionComponent, AnalisisPrediccionComponent],
        },
        add: { imports: [ResumenPrediccionStub, AnalisisPrediccionStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PrediccionGastoPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  }

  beforeEach(() => {
    servicioPrediccion = jasmine.createSpyObj('PrediccionGastoService', ['getPrediction']);
    servicioPrediccion.getPrediction.and.returnValue(of(PrediccionGastoMother.crear()));
    alumnoIdSignal = signal<string>('');
  });

  describe('inicializacion desde contexto y ruta', () => {
    it('dado el alumnoId en el contexto, cuando se monta, deberia pedir la prediccion con ese id', () => {
      alumnoIdSignal.set(ALUMNO_ID_TEST);
      crearFixture();

      whenMonto();

      expect(servicioPrediccion.getPrediction).toHaveBeenCalledWith(ALUMNO_ID_TEST);
      expect(component.predictionData).toBeTruthy();
      expect(component.isLoading).toBeFalse();
    });

    it('dado un alumnoId en el paramMap, cuando se monta, deberia priorizarlo sobre el contexto', () => {
      alumnoIdSignal.set('desde-contexto');
      crearFixture('desde-ruta');

      whenMonto();

      expect(servicioPrediccion.getPrediction).toHaveBeenCalledWith('desde-ruta');
    });

    it('dado sin alumnoId (ni en contexto ni en ruta), cuando se monta, deberia setear errorMessage sin llamar al service', () => {
      alumnoIdSignal.set('');
      crearFixture(null);

      whenMonto();

      expect(servicioPrediccion.getPrediction).not.toHaveBeenCalled();
      expect(component.errorMessage).toContain('No se encontro el alumno');
    });

    it('dado que el service falla, cuando se monta, deberia setear el mensaje de error y no loading', () => {
      spyOn(console, 'error');
      servicioPrediccion.getPrediction.and.returnValue(throwError(() => new Error('boom')));
      alumnoIdSignal.set(ALUMNO_ID_TEST);
      crearFixture();

      whenMonto();

      expect(component.errorMessage).toContain('No se pudo cargar la predicción');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('volver', () => {
    it('dado el presenter montado, cuando llamo volver, deberia navegar a /tutor', () => {
      alumnoIdSignal.set(ALUMNO_ID_TEST);
      crearFixture();
      whenMonto();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  describe('recargar', () => {
    it('dado el ultimo alumnoId conocido, cuando recargo, deberia volver a llamar al service', () => {
      alumnoIdSignal.set(ALUMNO_ID_TEST);
      crearFixture();
      whenMonto();
      servicioPrediccion.getPrediction.calls.reset();

      component.recargar();

      expect(servicioPrediccion.getPrediction).toHaveBeenCalledWith(ALUMNO_ID_TEST);
    });

    it('dado que no hay alumnoId, cuando recargo, deberia setear el error y no llamar al service', () => {
      alumnoIdSignal.set('');
      crearFixture(null);
      whenMonto();
      servicioPrediccion.getPrediction.calls.reset();

      component.recargar();

      expect(servicioPrediccion.getPrediction).not.toHaveBeenCalled();
      expect(component.errorMessage).toContain('No se encontro el alumno');
    });
  });

  describe('propagacion al render', () => {
    it('dado predictionData cargada, cuando renderizo, deberia pasar los inputs al ResumenPrediccion', () => {
      const prediccion: PrediccionGasto = PrediccionGastoMother.crear({ periodo: 'MENSUAL' });
      servicioPrediccion.getPrediction.and.returnValue(of(prediccion));
      alumnoIdSignal.set(ALUMNO_ID_TEST);
      crearFixture();

      whenMonto();

      const resumen = fixture.debugElement.query(
        (d) => d.componentInstance instanceof ResumenPrediccionStub,
      )?.componentInstance as ResumenPrediccionStub;
      expect(resumen.periodo).toBe('MENSUAL');
      expect(resumen.gastoActual).toBe(prediccion.gastoActual);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
