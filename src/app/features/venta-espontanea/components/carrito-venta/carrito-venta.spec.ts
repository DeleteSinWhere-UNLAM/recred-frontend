import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarritoVenta } from './carrito-venta';

describe('CarritoVenta', () => {
  let component: CarritoVenta;
  let fixture: ComponentFixture<CarritoVenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarritoVenta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarritoVenta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa el componente, deberia crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
