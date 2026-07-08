import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitoAlertaMother } from '../../habitos.mother';
import { HabitoAlerta } from '../../models/habito-alerta.model';
import { HabitoAlertCardComponent } from './habito-alert-card.component';

describe('HabitoAlertCardComponent', () => {
  let component: HabitoAlertCardComponent;
  let fixture: ComponentFixture<HabitoAlertCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitoAlertCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitoAlertCardComponent);
    component = fixture.componentInstance;
  });

  describe('render de una alerta', () => {
    it('dado una alerta de Julian con Golosinas, cuando renderizo, deberia mostrar el nombre del alumno', () => {
      whenRenderoAlerta(HabitoAlertaMother.crear());

      expect(textoRenderizado()).toContain('Julián García');
    });

    it('dado una alerta con Golosinas, deberia mostrar la categoria', () => {
      whenRenderoAlerta(HabitoAlertaMother.crear());

      expect(textoRenderizado()).toContain('Golosinas');
    });

    it('dado un porcentaje 40, deberia mostrarlo con el sufijo %', () => {
      whenRenderoAlerta(HabitoAlertaMother.crear({ porcentajeGasto: 40 }));

      expect(textoRenderizado()).toContain('40%');
    });

    it('dado un mensaje custom, deberia mostrarlo tal cual', () => {
      whenRenderoAlerta(
        HabitoAlertaMother.crear({ mensaje: 'Tu hijo gasta 40% en golosinas' }),
      );

      expect(textoRenderizado()).toContain('Tu hijo gasta 40% en golosinas');
    });

    it('dado una sugerencia al tutor, deberia mostrarla', () => {
      whenRenderoAlerta(HabitoAlertaMother.crear());

      expect(textoRenderizado()).toContain('¿Deseas limitar este tipo de productos?');
    });

    it('dado otra alerta (Sofia + Bebidas), deberia mostrar sus datos correctamente', () => {
      whenRenderoAlerta(HabitoAlertaMother.crearParaBebidas());

      const texto = textoRenderizado();
      expect(texto).toContain('Sofía García');
      expect(texto).toContain('Bebidas');
      expect(texto).toContain('65%');
      expect(texto).toContain('¿Querés fomentar el consumo de agua?');
    });
  });

  describe('acciones', () => {
    it('dado una alerta renderizada, deberia mostrar los botones "Limitar productos" e "Ignorar"', () => {
      whenRenderoAlerta(HabitoAlertaMother.crear());

      const texto = textoRenderizado();
      expect(texto).toContain('Limitar productos');
      expect(texto).toContain('Ignorar');
    });
  });

  function whenRenderoAlerta(alerta: HabitoAlerta): void {
    component.alerta = alerta;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
