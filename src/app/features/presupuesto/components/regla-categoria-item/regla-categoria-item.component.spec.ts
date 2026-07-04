import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
    it('dado una regla, cuando renderizo, deberia mostrar la descripcion de la categoria y el porcentaje en slider e input numerico', () => {
      component.regla = ReglaCategoriaMother.crear({
        descripcionCategoria: 'Bebidas e Infusiones',
        porcentajeLimite: 35,
      });
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Bebidas e Infusiones');
      expect(texto).toContain('Hasta');
      expect(texto).toContain('en Bebidas e Infusiones');

      expect(getSlider().value).toBe('35');
      expect(getNumberInput().value).toBe('35');
    });
  });

  describe('emision de porcentajeChange', () => {
    it('dado que el slider cambia, deberia emitir porcentajeChange con el reglaId y el porcentaje', () => {
      component.regla = ReglaCategoriaMother.crear({ id: 'r-1' });
      fixture.detectChanges();
      let emitido: CambioPorcentaje | undefined;
      component.porcentajeChange.subscribe((cambio) => (emitido = cambio));

      const slider = getSlider();
      slider.value = '60';
      slider.dispatchEvent(new Event('input'));

      expect(emitido).toEqual({ reglaId: 'r-1', porcentaje: 60 });
    });

    it('dado que el input numerico cambia, deberia emitir porcentajeChange con el nuevo valor', () => {
      component.regla = ReglaCategoriaMother.crear({ id: 'r-1' });
      fixture.detectChanges();
      let emitido: CambioPorcentaje | undefined;
      component.porcentajeChange.subscribe((cambio) => (emitido = cambio));

      const input = getNumberInput();
      input.value = '12';
      input.dispatchEvent(new Event('input'));

      expect(emitido).toEqual({ reglaId: 'r-1', porcentaje: 12 });
    });
  });

  describe('eliminar', () => {
    it('dado una regla, cuando hago click en el boton de eliminar, deberia emitir eliminar con el id', () => {
      component.regla = ReglaCategoriaMother.crear({ id: 'r-1' });
      fixture.detectChanges();
      let emitido: string | undefined;
      component.eliminar.subscribe((id) => (emitido = id));

      (fixture.debugElement.query(By.css('.regla-item__eliminar'))
        .nativeElement as HTMLButtonElement).click();

      expect(emitido).toBe('r-1');
    });
  });

  describe('formatear', () => {
    it('dado un monto, formatear deberia incluir el simbolo $ y separador de miles sin decimales', () => {
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

  function getSlider(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[type="range"]')).nativeElement as HTMLInputElement;
  }

  function getNumberInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[type="number"]')).nativeElement as HTMLInputElement;
  }
});
