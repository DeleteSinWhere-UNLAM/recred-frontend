import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccionKiosquero } from '../../models/accion-kiosquero.model';
import { AccionCardComponent } from './accion-card.component';

class AccionKiosqueroMother {
  static crear(override: Partial<AccionKiosquero> = {}): AccionKiosquero {
    return {
      id: 'ver-pedidos',
      titulo: 'Ver pedidos',
      descripcion: 'Gestioná las órdenes del día',
      icono: 'fa-clipboard-list',
      ruta: '/kiosquero/pedidos',
      color: 'menta',
      ...override,
    };
  }

  static crearPremium(): AccionKiosquero {
    return AccionKiosqueroMother.crear({
      id: 'promociones',
      titulo: 'Promociones',
      descripcion: 'Diseñá tus combos',
      premium: true,
    });
  }
}

describe('AccionCardComponent', () => {
  let component: AccionCardComponent;
  let fixture: ComponentFixture<AccionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccionCardComponent);
    component = fixture.componentInstance;
    component.accion = AccionKiosqueroMother.crear();
    fixture.detectChanges();
  });

  describe('render', () => {
    it('dado una accion, deberia mostrar titulo y descripcion', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Ver pedidos');
      expect(texto).toContain('Gestioná las órdenes del día');
    });

    it('dado una accion con color menta, deberia aplicar la clase accion-card--menta', () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector('button');
      expect(button?.classList.contains('accion-card--menta')).toBeTrue();
    });

    it('dado una accion premium, deberia mostrar el badge AVANZADO', () => {
      fixture.componentRef.setInput('accion', AccionKiosqueroMother.crearPremium());
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('AVANZADO');
    });

    it('dado una accion no premium, no deberia mostrar el badge AVANZADO', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).not.toContain('AVANZADO');
    });
  });

  describe('interaccion', () => {
    it('dado la accion, cuando hago click, deberia emitir seleccionar con la accion', () => {
      const spy = jasmine.createSpy('seleccionar');
      component.seleccionar.subscribe(spy);

      (fixture.nativeElement as HTMLElement).querySelector('button')!.click();

      expect(spy).toHaveBeenCalledWith(component.accion);
    });
  });
});
