import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ReglaCategoria } from '../../models/presupuesto.model';
import {
  CambioPorcentaje,
  ReglaCategoriaItemComponent,
} from './regla-categoria-item.component';

describe('ReglaCategoriaItemComponent', () => {
  const reglaMock: ReglaCategoria = {
    id: 'r-1',
    categoriaId: 'cat-bebidas',
    descripcionCategoria: 'Bebidas e Infusiones',
    porcentajeLimite: 35,
    montoLimiteCalculado: 350,
    activo: true,
  };

  let fixture: ComponentFixture<ReglaCategoriaItemComponent>;
  let component: ReglaCategoriaItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReglaCategoriaItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReglaCategoriaItemComponent);
    component = fixture.componentInstance;
    component.regla = reglaMock;
    fixture.detectChanges();
  });

  it('renderiza descripción, porcentaje y monto', () => {
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Bebidas e Infusiones');
    expect(html).toContain('Hasta');
    expect(html).toContain('en Bebidas e Infusiones');

    const slider = fixture.debugElement.query(By.css('input[type="range"]'))
      .nativeElement as HTMLInputElement;
    expect(slider.value).toBe('35');

    const numberInput = fixture.debugElement.query(
      By.css('input[type="number"]'),
    ).nativeElement as HTMLInputElement;
    expect(numberInput.value).toBe('35');
  });

  it('emite porcentajeChange cuando el slider cambia', () => {
    let emitido: CambioPorcentaje | undefined;
    component.porcentajeChange.subscribe((cambio) => (emitido = cambio));

    const slider = fixture.debugElement.query(By.css('input[type="range"]'))
      .nativeElement as HTMLInputElement;
    slider.value = '60';
    slider.dispatchEvent(new Event('input'));

    expect(emitido).toEqual({ reglaId: 'r-1', porcentaje: 60 });
  });

  it('emite porcentajeChange cuando el input numérico cambia', () => {
    let emitido: CambioPorcentaje | undefined;
    component.porcentajeChange.subscribe((cambio) => (emitido = cambio));

    const numberInput = fixture.debugElement.query(
      By.css('input[type="number"]'),
    ).nativeElement as HTMLInputElement;
    numberInput.value = '12';
    numberInput.dispatchEvent(new Event('input'));

    expect(emitido).toEqual({ reglaId: 'r-1', porcentaje: 12 });
  });

  it('emite eliminar con el id de la regla al tocar el botón', () => {
    let emitido: string | undefined;
    component.eliminar.subscribe((id) => (emitido = id));

    const boton = fixture.debugElement.query(By.css('.regla-item__eliminar'))
      .nativeElement as HTMLButtonElement;
    boton.click();

    expect(emitido).toBe('r-1');
  });

  it('formatear devuelve el monto en ARS sin decimales', () => {
    const resultado = component.formatear(1234);
    expect(resultado).toContain('1.234');
    expect(resultado).toContain('$');
    expect(resultado).not.toContain(',00');
  });

  it('no emite nada si llega un evento sin regla cargada', () => {
    fixture = TestBed.createComponent(ReglaCategoriaItemComponent);
    component = fixture.componentInstance;

    const spy = jasmine.createSpy('porcentajeChange');
    component.porcentajeChange.subscribe(spy);
    const spyEliminar = jasmine.createSpy('eliminar');
    component.eliminar.subscribe(spyEliminar);

    component.onSliderChange({
      target: { value: '40' },
    } as unknown as Event);
    component.onInputChange({ target: { value: '20' } } as unknown as Event);
    component.onEliminar();

    expect(spy).not.toHaveBeenCalled();
    expect(spyEliminar).not.toHaveBeenCalled();
  });
});
