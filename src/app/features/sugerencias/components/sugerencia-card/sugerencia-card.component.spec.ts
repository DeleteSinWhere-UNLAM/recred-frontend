import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  EstadisticasVentaMother,
  SugerenciaProductoMother,
} from '../../sugerencias.mother';
import { SugerenciaCardComponent } from './sugerencia-card.component';

describe('SugerenciaCardComponent', () => {
  let component: SugerenciaCardComponent;
  let fixture: ComponentFixture<SugerenciaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciaCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciaCardComponent);
    component = fixture.componentInstance;
    component.sugerencia = SugerenciaProductoMother.crear();
  });

  describe('render', () => {
    it('dada una sugerencia, cuando renderizo, deberia mostrar el nombre y la cantidad de dias sin venta', () => {
      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('Producto Base');
      expect(texto).toContain('5 días');
    });

    it('dado seleccionada=true, cuando renderizo, deberia agregar la clase sugerencia-card--selected', () => {
      component.seleccionada = true;

      whenMonto();

      const article = (fixture.nativeElement as HTMLElement).querySelector('article');
      expect(article?.classList.contains('sugerencia-card--selected')).toBeTrue();
    });

    it('dado diasSinVenta >= 15, cuando renderizo, deberia marcar el status como critical', () => {
      component.sugerencia = SugerenciaProductoMother.crear({
        estadisticasVenta: EstadisticasVentaMother.crear({ diasSinVenta: 20 }),
      });

      whenMonto();

      const status = (fixture.nativeElement as HTMLElement).querySelector('.sugerencia-card__status');
      expect(status?.classList.contains('sugerencia-card__status--critical')).toBeTrue();
    });
  });

  describe('eventos', () => {
    it('cuando hago click en la card, deberia emitir seleccionar con la sugerencia', () => {
      spyOn(component.seleccionar, 'emit');
      whenMonto();

      component.onSeleccionar();

      expect(component.seleccionar.emit).toHaveBeenCalledWith(component.sugerencia);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
