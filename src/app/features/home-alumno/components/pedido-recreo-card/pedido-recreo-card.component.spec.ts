import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidoEnCursoMother, RecreoMother } from '../../home-alumno.mother';
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
      component.pedido = undefined;
      fixture.detectChanges();
    });

    it('dado sin pedido, deberia mostrar el estado vacio con el mensaje de invitar al buffet', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Todavía no pediste nada para hoy');
    });

    it('dado sin pedido, cuando hago click en el CTA "Ir al buffet", deberia emitir verPedido', () => {
      const spy = jasmine.createSpy('verPedido');
      component.verPedido.subscribe(spy);

      const boton = (fixture.nativeElement as HTMLElement).querySelector(
        '.pedido-recreo__cta',
      ) as HTMLButtonElement;
      boton.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('con pedido', () => {
    beforeEach(() => {
      component.pedido = PedidoEnCursoMother.crear();
      fixture.detectChanges();
    });

    it('dado un pedido, deberia mostrar los items resumidos', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Sándwich JyQ');
    });

    it('dado un pedido, deberia mostrar el total formateado y el horario de retiro', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('$ 1500');
      expect(texto).toContain('Retirás 10:30');
    });

    it('dado un pedido, cuando hago click en "Ver mi pedido", deberia emitir verPedido', () => {
      const spy = jasmine.createSpy('verPedido');
      component.verPedido.subscribe(spy);

      const boton = (fixture.nativeElement as HTMLElement).querySelector(
        '.pedido-recreo__cta',
      ) as HTMLButtonElement;
      boton.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('recreo', () => {
    it('dado un recreo, deberia mostrar el nombre y las horas', () => {
      component.recreo = RecreoMother.crear();
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Primer recreo');
      expect(texto).toContain('10:15');
      expect(texto).toContain('10:30');
    });

    it('dado sin recreo, deberia mostrar "Sin recreo a la vista"', () => {
      component.recreo = undefined;
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Sin recreo a la vista');
    });
  });
});
