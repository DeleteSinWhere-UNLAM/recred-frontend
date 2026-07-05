import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidoEnCursoMother, RecreoMother } from '../../home-alumno.mother';
import { PedidoEnCurso } from '../../models/pedido-en-curso.model';
import { Recreo } from '../../models/recreo.model';
import { PedidoRecreoCardComponent } from './pedido-recreo-card.component';

describe('PedidoRecreoCardComponent', () => {
  let component: PedidoRecreoCardComponent;
  let fixture: ComponentFixture<PedidoRecreoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoRecreoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PedidoRecreoCardComponent);
    component = fixture.componentInstance;
    component.estadoLabel = 'Confirmado';
    component.iconoEstado = 'fa-utensils';
  });

  describe('sin pedido', () => {
    beforeEach(() => {
      givenPedido(undefined);
    });

    it('dado sin pedido, cuando se renderiza, deberia mostrar el estado vacio con el mensaje de invitar al buffet', () => {
      expect(textoDeLaCard()).toContain('Todavía no pediste nada para hoy');
    });

    it('dado sin pedido, cuando hago click en el CTA "Ir al buffet", deberia emitir verPedido', () => {
      const spy = jasmine.createSpy('verPedido');
      component.verPedido.subscribe(spy);

      whenHagoClickEnElCTA();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('con pedido', () => {
    beforeEach(() => {
      givenPedido(PedidoEnCursoMother.crear());
    });

    it('dado un pedido, cuando se renderiza, deberia mostrar los items resumidos', () => {
      expect(textoDeLaCard()).toContain('Sándwich JyQ');
    });

    it('dado un pedido, cuando se renderiza, deberia mostrar el total formateado y el horario de retiro', () => {
      const texto = textoDeLaCard();
      expect(texto).toContain('$ 1500');
      expect(texto).toContain('Retirás 10:30');
    });

    it('dado un pedido, cuando hago click en "Ver mi pedido", deberia emitir verPedido', () => {
      const spy = jasmine.createSpy('verPedido');
      component.verPedido.subscribe(spy);

      whenHagoClickEnElCTA();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('recreo', () => {
    it('dado un recreo, cuando se renderiza, deberia mostrar el nombre y las horas', () => {
      givenRecreo(RecreoMother.crear());

      const texto = textoDeLaCard();
      expect(texto).toContain('Primer recreo');
      expect(texto).toContain('10:15');
      expect(texto).toContain('10:30');
    });

    it('dado sin recreo, cuando se renderiza, deberia mostrar "Sin recreo a la vista"', () => {
      givenRecreo(undefined);

      expect(textoDeLaCard()).toContain('Sin recreo a la vista');
    });
  });

  function givenPedido(pedido: PedidoEnCurso | undefined): void {
    component.pedido = pedido;
    fixture.detectChanges();
  }

  function givenRecreo(recreo: Recreo | undefined): void {
    component.recreo = recreo;
    fixture.detectChanges();
  }

  function whenHagoClickEnElCTA(): void {
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      '.pedido-recreo__cta',
    ) as HTMLButtonElement;
    boton.click();
  }

  function textoDeLaCard(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
