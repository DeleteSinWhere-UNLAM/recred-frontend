import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarritoVenta } from './carrito-venta';

describe('CarritoVenta', () => {
  let component: CarritoVenta;
  let fixture: ComponentFixture<CarritoVenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarritoVenta],
    }).compileComponents();

    fixture = TestBed.createComponent(CarritoVenta);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado el componente, cuando se monta, deberia crearse', () => {
      whenMonto();

      expect(component).toBeTruthy();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
