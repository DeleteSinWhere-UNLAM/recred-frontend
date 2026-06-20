import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AnalisisPrediccionComponent } from './analisis-prediccion.component';
import { AnalisisIa } from '../../models/analisis-ia.model';

describe('AnalisisPrediccionComponent', () => {
  let componente: AnalisisPrediccionComponent;
  let fixture: ComponentFixture<AnalisisPrediccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalisisPrediccionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalisisPrediccionComponent);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  describe('comportamiento de categorias', () => {
    it('dado que categorias esta vacio, debe mostrar mensaje de vacio', () => {
      componente.categoriasMasConsumidas = [];
      fixture.detectChanges();

      const vacio = fixture.debugElement.query(By.css('.analisis-prediccion__vacio'));
      expect(vacio).not.toBeNull();
      expect(vacio.nativeElement.textContent).toContain('No hay suficientes datos de categorías');
    });

    it('dado que tiene categorias, debe renderizarlas en tags', () => {
      componente.categoriasMasConsumidas = [
        { descripcion: 'Dulces', montoTotal: 500 },
        { descripcion: 'Bebidas', montoTotal: 300 }
      ];
      fixture.detectChanges();

      const tags = fixture.debugElement.queryAll(By.css('.analisis-prediccion__tag'));
      expect(tags.length).toBe(2);
      expect(tags[0].nativeElement.textContent).toContain('Dulces');
    });
  });

  describe('comportamiento de analisis IA', () => {
    it('dado que no hay analisis IA, debe mostrar el bloque vacio', () => {
      componente.analisisIa = null;
      fixture.detectChanges();

      const vacio = fixture.debugElement.query(By.css('.analisis-prediccion__vacio--bloque'));
      expect(vacio).not.toBeNull();
      expect(vacio.nativeElement.textContent).toContain('No hay un análisis disponible');
    });

    it('dado que hay analisis basico, debe mostrar modelo y resumen', () => {
      componente.analisisIa = {
        modelo: 'GPT-4',
        resumen: 'Analisis perfecto',
        alertas: [],
        recomendaciones: []
      } as AnalisisIa;
      fixture.detectChanges();

      const modelo = fixture.debugElement.query(By.css('.analisis-prediccion__modelo')).nativeElement;
      expect(modelo.textContent).toContain('GPT-4');

      const resumen = fixture.debugElement.query(By.css('.analisis-prediccion__resumen')).nativeElement;
      expect(resumen.textContent).toContain('Analisis perfecto');
    });

    it('dado que hay alertas, debe renderizar la lista de alertas', () => {
      componente.analisisIa = {
        modelo: 'GPT-4',
        resumen: '',
        alertas: ['Gasto excesivo', 'Ojo con el jueves'],
        recomendaciones: []
      } as AnalisisIa;
      fixture.detectChanges();

      const alertas = fixture.debugElement.queryAll(By.css('.analisis-prediccion__lista--alerta li'));
      expect(alertas.length).toBe(2);
      expect(alertas[0].nativeElement.textContent).toContain('Gasto excesivo');
    });

    it('dado que hay recomendaciones, debe renderizar la lista de recomendaciones', () => {
      componente.analisisIa = {
        modelo: 'GPT-4',
        resumen: '',
        alertas: [],
        recomendaciones: ['Llevar vianda']
      } as AnalisisIa;
      fixture.detectChanges();

      const recomendaciones = fixture.debugElement.queryAll(By.css('.analisis-prediccion__lista--reco li'));
      expect(recomendaciones.length).toBe(1);
      expect(recomendaciones[0].nativeElement.textContent).toContain('Llevar vianda');
    });
  });
});
