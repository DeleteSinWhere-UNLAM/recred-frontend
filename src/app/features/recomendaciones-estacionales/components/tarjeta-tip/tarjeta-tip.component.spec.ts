import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaTipComponent } from './tarjeta-tip.component';

describe('TarjetaTipComponent', () => {
  let component: TarjetaTipComponent;
  let fixture: ComponentFixture<TarjetaTipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaTipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaTipComponent);
    component = fixture.componentInstance;
    component.tipPromocional = 'Prueba de tip promocional';
  });

  describe('render', () => {
    it('dado un tipPromocional, cuando renderizo, deberia mostrarlo en el texto de la card', () => {
      fixture.detectChanges();

      expect(queryUno('.tip-card__texto')?.textContent).toContain('Prueba de tip promocional');
    });

    it('dado hasAction en true, cuando renderizo, deberia mostrar un boton clickeable', () => {
      component.hasAction = true;
      component.actionText = 'Crear promocion';

      fixture.detectChanges();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('button');
      expect(boton).toBeTruthy();
      expect(boton?.textContent).toContain('Crear promocion');
    });
  });

  describe('eventos', () => {
    it('dado hasAction en true, cuando hago click en el boton de accion, deberia emitir actionClick', () => {
      component.hasAction = true;
      component.actionText = 'Crear promocion';
      fixture.detectChanges();
      spyOn(component.actionClick, 'emit');

      (queryUno('button') as HTMLButtonElement).click();

      expect(component.actionClick.emit).toHaveBeenCalled();
    });

    it('dado el metodo onActionClick, cuando lo llamo, deberia emitir actionClick', () => {
      spyOn(component.actionClick, 'emit');

      component.onActionClick();

      expect(component.actionClick.emit).toHaveBeenCalled();
    });
  });

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
