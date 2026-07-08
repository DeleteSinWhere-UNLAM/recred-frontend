import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ReglaCategoria } from '../../models/presupuesto.model';
import { ReglaCategoriaMother } from '../../presupuesto.mother';
import {
  CambioPorcentaje,
  ReglaCategoriaItemComponent,
} from './regla-categoria-item.component';

describe('ReglaCategoriaItemComponent', () => {
  let fixture: ComponentFixture<ReglaCategoriaItemComponent>;
  let component: ReglaCategoriaItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReglaCategoriaItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReglaCategoriaItemComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado una regla con categoria y porcentaje, cuando renderizo, deberia mostrar descripcion y porcentaje en slider e input', () => {
      givenRegla(ReglaCategoriaMother.crear({
        descripcionCategoria: 'Bebidas e Infusiones',
        porcentajeLimite: 35,
      }));

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Bebidas e Infusiones');
      expect(texto).toContain('Hasta');
      expect(texto).toContain('en Bebidas e Infusiones');

      expect(getSlider().value).toBe('35');
      expect(getNumberInput().value).toBe('35');
    });
  });

  describe('emision de porcentajeChange', () => {
    it('dado una regla cargada, cuando cambia el slider, deberia emitir porcentajeChange con el reglaId y el porcentaje', () => {
      givenRegla(ReglaCategoriaMother.crear({ id: 'r-1' }));
      let emitido: CambioPorcentaje | undefined;
      component.porcentajeChange.subscribe((cambio) => (emitido = cambio));

      whenCambioSliderCon('60');

      expect(emitido).toEqual({ reglaId: 'r-1', porcentaje: 60 });
    });

    it('dado una regla cargada, cuando cambia el input numerico, deberia emitir porcentajeChange con el nuevo valor', () => {
      givenRegla(ReglaCategoriaMother.crear({ id: 'r-1' }));
      let emitido: CambioPorcentaje | undefined;
      component.porcentajeChange.subscribe((cambio) => (emitido = cambio));

      whenCambioInputNumericoCon('12');

      expect(emitido).toEqual({ reglaId: 'r-1', porcentaje: 12 });
    });
  });

  describe('eliminar', () => {
    it('dado una regla, cuando hago click en el boton de eliminar, deberia emitir eliminar con el id', () => {
      givenRegla(ReglaCategoriaMother.crear({ id: 'r-1' }));
      let emitido: string | undefined;
      component.eliminar.subscribe((id) => (emitido = id));

      whenHagoClickEn('.regla-item__eliminar');

      expect(emitido).toBe('r-1');
    });
  });

  describe('formatear', () => {
    it('dado un monto 1234, cuando formateo, deberia incluir $ y separador de miles sin decimales', () => {
      const resultado = component.formatear(1234);

      expect(resultado).toContain('1.234');
      expect(resultado).toContain('$');
      expect(resultado).not.toContain(',00');
    });
  });

  describe('handlers sin regla cargada', () => {
    it('dado que no hay regla cargada, cuando disparo eventos, no deberia emitir nada', () => {
      const emitirSpy = jasmine.createSpy('porcentajeChange');
      const eliminarSpy = jasmine.createSpy('eliminar');
      component.porcentajeChange.subscribe(emitirSpy);
      component.eliminar.subscribe(eliminarSpy);

      component.onSliderChange({ target: { value: '40' } } as unknown as Event);
      component.onInputChange({ target: { value: '20' } } as unknown as Event);
      component.onEliminar();

      expect(emitirSpy).not.toHaveBeenCalled();
      expect(eliminarSpy).not.toHaveBeenCalled();
    });
  });

  function givenRegla(regla: ReglaCategoria): void {
    component.regla = regla;
    fixture.detectChanges();
  }

  function whenCambioSliderCon(valor: string): void {
    const slider = getSlider();
    slider.value = valor;
    slider.dispatchEvent(new Event('input'));
  }

  function whenCambioInputNumericoCon(valor: string): void {
    const input = getNumberInput();
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function whenHagoClickEn(selector: string): void {
    (fixture.debugElement.query(By.css(selector)).nativeElement as HTMLButtonElement).click();
  }

  function getSlider(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[type="range"]')).nativeElement as HTMLInputElement;
  }

  function getNumberInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[type="number"]')).nativeElement as HTMLInputElement;
  }
});
