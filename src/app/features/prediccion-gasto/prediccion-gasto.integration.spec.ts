import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { PrediccionGastoPageComponent } from './prediccion-gasto-page/prediccion-gasto-page.component';
import {
  ALUMNO_ID_TEST,
  PrediccionGastoMother,
} from './prediccion-gasto.mother';
import { PrediccionGastoService } from './services/prediccion-gasto.service';

describe('PrediccionGasto Integration', () => {
  let fixture: ComponentFixture<PrediccionGastoPageComponent>;
  let servicioPrediccion: jasmine.SpyObj<PrediccionGastoService>;

  function build(): void {
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrediccionGastoPageComponent);
  }

  beforeEach(() => {
    servicioPrediccion = jasmine.createSpyObj('PrediccionGastoService', ['getPrediction']);
  });

  it('dado el alumnoId en el contexto y una prediccion default, cuando se monta, deberia renderizar el titulo y los sub-componentes reales con datos', () => {
    servicioPrediccion.getPrediction.and.returnValue(of(PrediccionGastoMother.crear()));
    build();

    fixture.detectChanges();

    const texto = textoRenderizado();
    expect(texto).toContain('Predicción');
    expect(texto).toContain('SEMANAL');
    expect(texto).toContain('Bebidas');
    expect(texto).toContain('Estas dentro del presupuesto');
  });

  it('dado que el service falla, cuando se monta, deberia mostrar el estado de error con boton Reintentar', () => {
    spyOn(console, 'error');
    servicioPrediccion.getPrediction.and.returnValue(throwError(() => new Error('boom')));
    build();

    fixture.detectChanges();

    const texto = textoRenderizado();
    expect(texto).toContain('No se pudo cargar la prediccion');
    expect(texto).toContain('Reintentar');
  });

  it('dado el estado de error, cuando hago click en Reintentar, deberia volver a llamar al service', () => {
    spyOn(console, 'error');
    servicioPrediccion.getPrediction.and.returnValue(throwError(() => new Error('boom')));
    build();
    fixture.detectChanges();
    servicioPrediccion.getPrediction.calls.reset();
    servicioPrediccion.getPrediction.and.returnValue(of(PrediccionGastoMother.crear()));

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      '.prediction-page__reintentar',
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(servicioPrediccion.getPrediction).toHaveBeenCalledWith(ALUMNO_ID_TEST);
    expect(textoRenderizado()).toContain('SEMANAL');
  });

  it('dado una prediccion sin limite, cuando renderizo, deberia mostrar el mensaje "No hay un límite"', () => {
    servicioPrediccion.getPrediction.and.returnValue(of(PrediccionGastoMother.crearSinLimite()));
    build();

    fixture.detectChanges();

    expect(textoRenderizado()).toContain('No hay un límite de presupuesto definido');
  });

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
