import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComboPromotionModalComponent } from './combo-promotion-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SuggestedProduct } from '../../models/sugerencia-producto.model';

describe('ComboPromotionModalComponent', () => {
  let component: ComboPromotionModalComponent;
  let fixture: ComponentFixture<ComboPromotionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboPromotionModalComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ComboPromotionModalComponent);
    component = fixture.componentInstance;
    component.baseProductName = 'Test Producto';
    component.suggestedProducts = [
      { id: 'p1', nombre: 'Prod 1', precio: 100 } as SuggestedProduct,
      { id: 'p2', nombre: 'Prod 2', precio: 200 } as SuggestedProduct
    ];
    fixture.detectChanges();
  });

  it('debería iniciar con el formulario válido por sus valores por defecto', () => {
    let formValido = false;

    whenRevisoElFormulario(() => formValido = component.promotionForm.valid);
    thenElFormularioEsValido(formValido);
  });

  it('debería permitir togglear la selección de un producto', () => {
    let seleccionadoInicialmente = false;
    let seleccionadoDespuesDeActivar = false;
    let seleccionadoDespuesDeDesactivar = false;

    whenChequeoSeleccionInicial('p1', val => seleccionadoInicialmente = val);
    whenToggleoProducto('p1');
    whenChequeoSeleccionActual('p1', val => seleccionadoDespuesDeActivar = val);
    thenElProductoSeActivo(seleccionadoInicialmente, seleccionadoDespuesDeActivar, component.selectedProductIds.size);

    whenToggleoProducto('p1');
    whenChequeoSeleccionActual('p1', val => seleccionadoDespuesDeDesactivar = val);
    thenElProductoSeDesactivo(seleccionadoDespuesDeDesactivar, component.selectedProductIds.size);
  });

  it('getDiscountedPrice debería calcular el precio con descuento', () => {
    let precioCalculado = 0;

    givenDescuentoIngresado(20);
    whenCalculoPrecioConDescuento(100, val => precioCalculado = val);
    thenElPrecioEsDescontado(precioCalculado, 80);
  });

  it('getDiscountedPrice debería retornar el precio original si no hay descuento', () => {
    let precioCalculado = 0;

    givenDescuentoNulo();
    whenCalculoPrecioConDescuento(100, val => precioCalculado = val);
    thenElPrecioEsElMismo(precioCalculado, 100);
  });

  it('onConfirm debería emitir si el formulario es válido y hay productos seleccionados', () => {
    spyOn(component.confirmPromotion, 'emit');

    givenFormularioLlenado(15, '2026-06-16', '2026-06-20');
    givenProductoSeleccionado('p1');
    whenConfirmoLaPromocion();
    thenSeEmiteElEventoConLosDatosConfirmados();
  });

  it('onConfirm no debería emitir si el formulario es inválido', () => {
    spyOn(component.confirmPromotion, 'emit');

    givenFormularioInvalido(15, '', '2026-06-20');
    givenProductoSeleccionado('p1');
    whenConfirmoLaPromocion();
    thenNoSeEmiteElEventoDeConfirmacion();
  });

  it('onConfirm no debería emitir si no hay productos seleccionados', () => {
    spyOn(component.confirmPromotion, 'emit');

    givenFormularioLlenado(15, '2026-06-16', '2026-06-20');
    givenSinProductosSeleccionados();
    whenConfirmoLaPromocion();
    thenNoSeEmiteElEventoDeConfirmacion();
  });

  it('onClose debería emitir evento closeModal', () => {
    spyOn(component.closeModal, 'emit');

    whenCierroElModal();
    thenSeEmiteElCierreDelModal();
  });

  function whenRevisoElFormulario(callback: () => void): void {
    callback();
  }

  function whenChequeoSeleccionInicial(id: string, callback: (val: boolean) => void): void {
    callback(component.isProductSelected(id));
  }

  function whenChequeoSeleccionActual(id: string, callback: (val: boolean) => void): void {
    callback(component.isProductSelected(id));
  }

  function whenToggleoProducto(id: string): void {
    component.toggleProductSelection(id);
  }

  function givenDescuentoIngresado(porcentaje: number): void {
    component.promotionForm.patchValue({ discountPercentage: porcentaje });
  }

  function givenDescuentoNulo(): void {
    component.promotionForm.patchValue({ discountPercentage: null });
  }

  function whenCalculoPrecioConDescuento(precioBase: number, callback: (val: number) => void): void {
    callback(component.getDiscountedPrice(precioBase));
  }

  function givenFormularioLlenado(discount: number, start: string, end: string): void {
    component.promotionForm.patchValue({
      discountPercentage: discount,
      startDate: start,
      endDate: end
    });
  }

  function givenFormularioInvalido(discount: number, start: string, end: string): void {
    component.promotionForm.patchValue({
      discountPercentage: discount,
      startDate: start,
      endDate: end
    });
  }

  function givenProductoSeleccionado(id: string): void {
    component.toggleProductSelection(id);
  }

  function givenSinProductosSeleccionados(): void {
  }

  function whenConfirmoLaPromocion(): void {
    component.onConfirm();
  }

  function whenCierroElModal(): void {
    component.onClose();
  }

  function thenElFormularioEsValido(valido: boolean): void {
    expect(valido).toBeTrue();
  }

  function thenElProductoSeActivo(inicial: boolean, activo: boolean, cantidad: number): void {
    expect(inicial).toBeFalse();
    expect(activo).toBeTrue();
    expect(cantidad).toBe(1);
  }

  function thenElProductoSeDesactivo(activo: boolean, cantidad: number): void {
    expect(activo).toBeFalse();
    expect(cantidad).toBe(0);
  }

  function thenElPrecioEsDescontado(calculado: number, esperado: number): void {
    expect(calculado).toBe(esperado);
  }

  function thenElPrecioEsElMismo(calculado: number, esperado: number): void {
    expect(calculado).toBe(esperado);
  }

  function thenSeEmiteElEventoConLosDatosConfirmados(): void {
    expect(component.confirmPromotion.emit).toHaveBeenCalledWith({
      discountPercentage: 15,
      startDate: '2026-06-16',
      endDate: '2026-06-20',
      productIds: ['p1']
    });
  }

  function thenNoSeEmiteElEventoDeConfirmacion(): void {
    expect(component.confirmPromotion.emit).not.toHaveBeenCalled();
  }

  function thenSeEmiteElCierreDelModal(): void {
    expect(component.closeModal.emit).toHaveBeenCalled();
  }
});
