import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciasDetectadasMother } from '../../preferencias-detectadas.mother';
import { PreferenciaDetectada } from '../../models/preferencia-detectada.model';
import { PreferenciaDetectadaCardComponent } from './preferencia-detectada-card.component';

describe('PreferenciaDetectadaCardComponent', () => {
  let component: PreferenciaDetectadaCardComponent;
  let fixture: ComponentFixture<PreferenciaDetectadaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaDetectadaCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciaDetectadaCardComponent);
    component = fixture.componentInstance;
  });

  describe('Estado inicial', () => {
    it('dado el componente recien creado, expandido deberia arrancar en false', () => {
      expect(component.expandido).toBeFalse();
    });
  });

  describe('render de la preferencia', () => {
    it('dado una preferencia default, cuando renderizo, deberia mostrar el titulo y el mensaje', () => {
      whenRenderoCon(PreferenciasDetectadasMother.crearPreferencia());

      const texto = textoRenderizado();
      expect(texto).toContain('Le gustan los alfajores');
      expect(texto).toContain('Compra muchos alfajores');
    });

    it('dado el estado colapsado, deberia mostrar el boton "Ver detalle" y no la razon IA', () => {
      whenRenderoCon(PreferenciasDetectadasMother.crearPreferencia());

      const texto = textoRenderizado();
      expect(texto).toContain('Ver detalle');
      expect(texto).not.toContain('Por frecuencia');
      expect(queryUno('.card__detalle')).toBeNull();
    });

    it('dado el estado expandido, deberia mostrar el boton "Ocultar detalle" y la razon IA', () => {
      whenRenderoCon(PreferenciasDetectadasMother.crearPreferencia());
      component.expandido = true;
      fixture.detectChanges();

      const texto = textoRenderizado();
      expect(texto).toContain('Ocultar detalle');
      expect(texto).toContain('Por frecuencia');
      expect(queryUno('.card__detalle')).toBeTruthy();
    });
  });

  describe('toggleDetalle', () => {
    it('dado el estado colapsado, cuando llamo toggleDetalle, deberia expandirlo', () => {
      whenRenderoCon(PreferenciasDetectadasMother.crearPreferencia());

      component.toggleDetalle();

      expect(component.expandido).toBeTrue();
    });

    it('dado dos toggles seguidos, deberia volver a colapsarse', () => {
      whenRenderoCon(PreferenciasDetectadasMother.crearPreferencia());

      component.toggleDetalle();
      component.toggleDetalle();

      expect(component.expandido).toBeFalse();
    });

    it('dado el card renderizado, cuando hago click en el boton de detalle, deberia togglear expandido', () => {
      whenRenderoCon(PreferenciasDetectadasMother.crearPreferencia());

      (queryUno('.card__btn') as HTMLButtonElement).click();

      expect(component.expandido).toBeTrue();
    });
  });

  function whenRenderoCon(preferencia: PreferenciaDetectada): void {
    component.preferencia = preferencia;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
