import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Preferencia } from '../../models/preferencia.model';
import { PreferenciaMother } from '../../preferencias.mother';
import { PreferenciaCardComponent } from './preferencia-card.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PreferenciaCardComponent', () => {
  let component: PreferenciaCardComponent;
  let fixture: ComponentFixture<PreferenciaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciaCardComponent);
    component = fixture.componentInstance;
  });

  describe('render con una preferencia', () => {
    it('dado una preferencia default, cuando renderizo, deberia mostrar el titulo', () => {
      whenRenderoCon(PreferenciaMother.crear());

      expect(textoRenderizado()).toContain('Alfajor de chocolate');
    });

    it('dado una preferencia default, cuando renderizo, deberia mostrar el mensaje', () => {
      whenRenderoCon(PreferenciaMother.crear());

      expect(textoRenderizado()).toContain('Es el producto que mas consume en el buffet');
    });

    it('dado una preferencia default, cuando renderizo, deberia mostrar el bloque Motivo con la razon IA', () => {
      whenRenderoCon(PreferenciaMother.crear());

      const texto = textoRenderizado();
      expect(texto).toContain('Motivo');
      expect(texto).toContain('Compra recurrente los lunes y miercoles');
    });

    it('dado otra preferencia (jugo de naranja), cuando renderizo, deberia mostrar sus datos', () => {
      whenRenderoCon(PreferenciaMother.crearJugo());

      const texto = textoRenderizado();
      expect(texto).toContain('Jugo de naranja');
      expect(texto).toContain('Complementa sus meriendas');
      expect(texto).toContain('Aparece en el 80% de sus compras del recreo');
    });
  });

  function whenRenderoCon(preferencia: Preferencia): void {
    component.preferencia = preferencia;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
