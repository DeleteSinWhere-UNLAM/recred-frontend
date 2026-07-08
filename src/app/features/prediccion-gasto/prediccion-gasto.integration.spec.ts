import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { PrediccionGastoPageComponent } from './prediccion-gasto-page/prediccion-gasto-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
  ALUMNO_ID_TEST,
  PrediccionGastoMother,
} from './prediccion-gasto.mother';
import { PrediccionGastoService } from './services/prediccion-gasto.service';

describe('PrediccionGasto Integration', () => {
  let fixture: ComponentFixture<PrediccionGastoPageComponent>;
  let servicioPrediccion: jasmine.SpyObj<PrediccionGastoService>;

  beforeEach(() => {
    servicioPrediccion = jasmine.createSpyObj('PrediccionGastoService', ['getPrediction']);
  });

  it('dado el alumnoId en el contexto y una prediccion default, cuando se monta, deberia renderizar el titulo y los sub-componentes', () => {
    givenPrediccionDelBack(PrediccionGastoMother.crear());
    whenMonto();

    const texto = textoRenderizado();
    expect(texto).toContain('Predicción');
    expect(texto).toContain('SEMANAL');
    expect(texto).toContain('Bebidas');
    expect(texto).toContain('Estas dentro del presupuesto');
  });

  it('dado que el service falla, cuando se monta, deberia mostrar el estado de error con boton Reintentar', () => {
    spyOn(console, 'error');
    givenPredictionServiceFalla();

    whenMonto();

    const texto = textoRenderizado();
    expect(texto).toContain('No se pudo cargar la prediccion');
    expect(texto).toContain('Reintentar');
  });

  it('dado el estado de error, cuando hago click en Reintentar, deberia volver a llamar al service', () => {
    spyOn(console, 'error');
    givenPredictionServiceFalla();
    whenMonto();
    servicioPrediccion.getPrediction.calls.reset();
    givenPrediccionDelBack(PrediccionGastoMother.crear());

    whenHagoClickEnReintentar();

    expect(servicioPrediccion.getPrediction).toHaveBeenCalledWith(ALUMNO_ID_TEST);
    expect(textoRenderizado()).toContain('SEMANAL');
  });

  it('dado una prediccion sin limite, cuando se monta, deberia mostrar el mensaje "No hay un límite"', () => {
    givenPrediccionDelBack(PrediccionGastoMother.crearSinLimite());

    whenMonto();

    expect(textoRenderizado()).toContain('No hay un límite de presupuesto definido');
  });

  function givenPrediccionDelBack(prediccion: ReturnType<typeof PrediccionGastoMother.crear>): void {
    servicioPrediccion.getPrediction.and.returnValue(of(prediccion));
  }

  function givenPredictionServiceFalla(): void {
    servicioPrediccion.getPrediction.and.returnValue(throwError(() => new Error('boom')));
  }

  function whenMonto(): void {
    TestBed.configureTestingModule({
      imports: [PrediccionGastoPageComponent],
      providers: [
        { provide: PrediccionGastoService, useValue: servicioPrediccion },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: signal(ALUMNO_ID_TEST).asReadonly() },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideCharts(withDefaultRegisterables()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrediccionGastoPageComponent);
    fixture.detectChanges();
  }

  function whenHagoClickEnReintentar(): void {
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.prediction-page__reintentar',
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
