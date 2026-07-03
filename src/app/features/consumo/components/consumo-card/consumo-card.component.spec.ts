import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsumoAprendizajeMother } from '../../consumo.mother';
import { ConsumoAprendizaje } from '../../models/consumo-aprendizaje.model';
import { ConsumoCardComponent } from './consumo-card.component';

describe('ConsumoCardComponent', () => {
  let component: ConsumoCardComponent;
  let fixture: ComponentFixture<ConsumoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsumoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsumoCardComponent);
    component = fixture.componentInstance;
  });

  describe('render de un aprendizaje', () => {
    it('dado un consumo con Jugo, cuando renderizo la card, deberia mostrar el nombre del alumno', () => {
      whenRenderoConsumo(ConsumoAprendizajeMother.crear());

      expect(textoRenderizado()).toContain('Julián García');
    });

    it('dado un consumo con Jugo, cuando renderizo la card, deberia mostrar el producto frecuente', () => {
      whenRenderoConsumo(ConsumoAprendizajeMother.crear());

      expect(textoRenderizado()).toContain('Jugo');
    });

    it('dado un consumo con Jugo, cuando renderizo la card, deberia mostrar la frecuencia', () => {
      whenRenderoConsumo(ConsumoAprendizajeMother.crear());

      expect(textoRenderizado()).toContain('4 veces por semana');
    });

    it('dado un consumo con Jugo, cuando renderizo la card, deberia mostrar la recomendacion', () => {
      whenRenderoConsumo(ConsumoAprendizajeMother.crear());

      expect(textoRenderizado()).toContain('Ofrecer jugos sin azúcar');
    });

    it('dado otro consumo (Sofia + Tostado), cuando renderizo la card, deberia mostrar sus datos', () => {
      whenRenderoConsumo(ConsumoAprendizajeMother.crearParaTostado());

      const texto = textoRenderizado();
      expect(texto).toContain('Sofía García');
      expect(texto).toContain('Tostado');
      expect(texto).toContain('3 veces por semana');
      expect(texto).toContain('Agregar combos saludables');
    });
  });

  function whenRenderoConsumo(consumo: ConsumoAprendizaje): void {
    component.consumo = consumo;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
