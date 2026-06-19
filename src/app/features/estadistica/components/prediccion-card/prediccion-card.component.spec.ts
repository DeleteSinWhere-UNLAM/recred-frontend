import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PrediccionCardComponent } from './prediccion-card.component';
import { NivelAlerta, PrediccionGasto } from '../../../presupuesto/models/presupuesto.model';

describe('PrediccionCardComponent', () => {
  let componente: PrediccionCardComponent;
  let fixture: ComponentFixture<PrediccionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrediccionCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PrediccionCardComponent);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    // Defaults: prediccion = undefined, nivel = 'ok'
    fixture.componentRef.setInput('prediccion', undefined);
    fixture.componentRef.setInput('nivel', 'ok');
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  describe('comportamiento sin datos', () => {
    it('dado que no hay prediccion, debe mostrar el mensaje de vacío', () => {
      fixture.componentRef.setInput('prediccion', undefined);
      fixture.componentRef.setInput('nivel', 'ok');
      fixture.detectChanges();

      const vacio = fixture.debugElement.query(By.css('.prediccion-card--vacio'));
      expect(vacio).not.toBeNull();
      expect(vacio.nativeElement.textContent).toContain('Todavía no hay datos suficientes');
    });

    it('dado que no hay prediccion, el porcentaje redondeado debe ser 0', () => {
      fixture.componentRef.setInput('prediccion', undefined);
      expect(componente.porcentajeRedondeado()).toBe(0);
    });
  });

  describe('comportamiento con datos completos', () => {
    const mockPrediccion = {
      gastoActual: 1500,
      gastoPredicho: 2000,
      montoLimite: 5000,
      promedioGastoDiario: 100,
      porcentajePresupuesto: 40.6,
      resumenIa: 'Todo en orden',
      alertas: ['Alerta 1'],
      recomendaciones: ['Reco 1', 'Reco 2'],
      categoriasMasConsumidas: [
        { descripcion: 'Comida', montoTotal: 1000 }
      ]
    } as unknown as PrediccionGasto;

    beforeEach(() => {
      fixture.componentRef.setInput('prediccion', mockPrediccion);
      fixture.componentRef.setInput('nivel', 'ok');
      fixture.detectChanges();
    });

    it('dado que recibe una prediccion, debe calcular el porcentaje redondeado', () => {
      expect(componente.porcentajeRedondeado()).toBe(41);
    });

    it('dado que recibe una prediccion, debe calcular el dashArray para el SVG', () => {
      // 41% de 326.72...
      const esperado = (41 / 100) * componente.circumferencia;
      expect(componente.dashArray()).toContain(esperado.toString());
    });

    it('dado que el nivel es excedido, debe devolver la etiqueta y clase correctas', () => {
      fixture.componentRef.setInput('nivel', 'excedido');
      fixture.detectChanges();

      expect(componente.nivelLabel()).toBe('Excede el presupuesto');
      const card = fixture.debugElement.query(By.css('.prediccion-card')).nativeElement as HTMLElement;
      expect(card.classList.contains('prediccion-card--excedido')).toBeTrue();
    });

    it('dado que el nivel es warning, debe devolver la etiqueta y clase correctas', () => {
      fixture.componentRef.setInput('nivel', 'warning');
      fixture.detectChanges();

      expect(componente.nivelLabel()).toBe('Cerca del límite');
      const card = fixture.debugElement.query(By.css('.prediccion-card')).nativeElement as HTMLElement;
      expect(card.classList.contains('prediccion-card--warning')).toBeTrue();
    });

    it('dado que el nivel es ok, debe devolver la etiqueta predeterminada', () => {
      fixture.componentRef.setInput('nivel', 'ok');
      fixture.detectChanges();

      expect(componente.nivelLabel()).toBe('En curso');
      const card = fixture.debugElement.query(By.css('.prediccion-card')).nativeElement as HTMLElement;
      expect(card.classList.contains('prediccion-card--ok')).toBeTrue();
    });

    it('dado que invoca formatear, debe devolver el numero en pesos', () => {
      expect(componente.formatear(1500)).toContain('1.500');
    });

    it('dado que invoca formatear con undefined, debe devolver cero formateado', () => {
      expect(componente.formatear(undefined)).toContain('0');
    });

    it('dado que hay categorias, alertas y recomendaciones, deben renderizarse en el HTML', () => {
      const categorias = fixture.debugElement.queryAll(By.css('.prediccion-card__categoria-nombre'));
      expect(categorias.length).toBe(1);
      expect(categorias[0].nativeElement.textContent).toContain('Comida');

      const alertas = fixture.debugElement.queryAll(By.css('.prediccion-card__badges--alerta li'));
      expect(alertas.length).toBe(1);
      expect(alertas[0].nativeElement.textContent).toContain('Alerta 1');

      const recomendaciones = fixture.debugElement.queryAll(By.css('.prediccion-card__badges--recomendacion li'));
      expect(recomendaciones.length).toBe(2);
      expect(recomendaciones[0].nativeElement.textContent).toContain('Reco 1');
    });
  });
});
