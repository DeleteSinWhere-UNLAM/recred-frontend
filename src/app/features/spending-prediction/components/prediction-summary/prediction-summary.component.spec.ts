import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PredictionSummaryComponent } from './prediction-summary.component';

describe('PredictionSummaryComponent', () => {
  let componente: PredictionSummaryComponent;
  let fixture: ComponentFixture<PredictionSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionSummaryComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PredictionSummaryComponent);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa con valores por defecto, debe crearse correctamente', () => {
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  describe('comportamiento del bloque limite', () => {
    it('dado que no hay montoLimite, debe mostrar el mensaje de vacío', () => {
      componente.montoLimite = null;
      fixture.detectChanges();

      const msjVacio = fixture.debugElement.query(By.css('.prediction-summary__vacio'));
      expect(msjVacio).not.toBeNull();
      expect(msjVacio.nativeElement.textContent).toContain('No hay un límite de presupuesto definido');
    });

    it('dado que hay montoLimite, debe renderizar la barra y el limite', () => {
      componente.montoLimite = 10000;
      componente.porcentajePresupuesto = 0.5; // 50%
      fixture.detectChanges();

      const limiteBlock = fixture.debugElement.query(By.css('.prediction-summary__limite'));
      expect(limiteBlock).not.toBeNull();

      const barraFill = fixture.debugElement.query(By.css('.prediction-summary__barra-fill')).nativeElement as HTMLElement;
      expect(barraFill.style.width).toBe('50%');
    });

    it('dado que el porcentaje sobrepasa 1, el limite maximo visual de la barra debe ser 100%', () => {
      componente.montoLimite = 10000;
      componente.porcentajePresupuesto = 1.2; // 120%
      fixture.detectChanges();

      const barraFill = fixture.debugElement.query(By.css('.prediction-summary__barra-fill')).nativeElement as HTMLElement;
      expect(barraFill.style.width).toBe('100%');
    });

    it('dado que el porcentaje sobrepasa 0.8, debe aplicar la clase danger', () => {
      componente.montoLimite = 10000;
      componente.porcentajePresupuesto = 0.85; // 85%
      fixture.detectChanges();

      const limiteBlock = fixture.debugElement.query(By.css('.prediction-summary__limite')).nativeElement as HTMLElement;
      expect(limiteBlock.classList.contains('prediction-summary__limite--danger')).toBeTrue();
    });
  });

  describe('comportamiento del renderizado general y pipes', () => {
    it('dado que recibe datos validos, debe mostrarlos formateados', () => {
      componente.periodo = 'Abril 2024';
      componente.gastoActual = 1500.5;
      componente.confianza = 0.89; // 89%
      componente.diasHistoricosUsados = 30;
      componente.diasRestantes = 5;
      fixture.detectChanges();

      const titulo = fixture.debugElement.query(By.css('.prediction-summary__titulo')).nativeElement;
      expect(titulo.textContent).toContain('Abril 2024');

      // gastoActual format
      const gastos = fixture.debugElement.queryAll(By.css('.prediction-summary__card-valor'));
      expect(gastos[0].nativeElement.textContent).toContain('1,500.5'); // DecimalPipe local (depends on locale, default usually comma/dot)
      
      const stats = fixture.debugElement.queryAll(By.css('.prediction-summary__stat-valor'));
      // confianza
      expect(stats[0].nativeElement.textContent).toContain('89%');
      // dias
      expect(stats[1].nativeElement.textContent).toContain('30');
      expect(stats[2].nativeElement.textContent).toContain('5');
    });
  });
});
