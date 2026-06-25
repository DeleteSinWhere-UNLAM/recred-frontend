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

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería iniciar con el formulario válido por sus valores por defecto', () => {
    expect(component.promotionForm.valid).toBeTrue();
  });

  it('debería permitir togglear la selección de un producto', () => {
    expect(component.isProductSelected('p1')).toBeFalse();
    
    component.toggleProductSelection('p1');
    expect(component.isProductSelected('p1')).toBeTrue();
    expect(component.selectedProductIds.size).toBe(1);

    component.toggleProductSelection('p1');
    expect(component.isProductSelected('p1')).toBeFalse();
    expect(component.selectedProductIds.size).toBe(0);
  });

  it('getDiscountedPrice debería calcular el precio con descuento', () => {
    component.promotionForm.patchValue({ discountPercentage: 20 });
    const discounted = component.getDiscountedPrice(100);
    expect(discounted).toBe(80);
  });

  it('getDiscountedPrice debería retornar el precio original si no hay descuento', () => {
    component.promotionForm.patchValue({ discountPercentage: null });
    const discounted = component.getDiscountedPrice(100);
    expect(discounted).toBe(100);
  });

  it('onConfirm debería emitir si el formulario es válido y hay productos seleccionados', () => {
    spyOn(component.confirmPromotion, 'emit');

    component.promotionForm.patchValue({
      discountPercentage: 15,
      startDate: '2026-06-16',
      endDate: '2026-06-20'
    });
    component.toggleProductSelection('p1');

    component.onConfirm();

    expect(component.confirmPromotion.emit).toHaveBeenCalledWith({
      discountPercentage: 15,
      startDate: '2026-06-16',
      endDate: '2026-06-20',
      productIds: ['p1']
    });
  });

  it('onConfirm no debería emitir si el formulario es inválido', () => {
    spyOn(component.confirmPromotion, 'emit');

    component.promotionForm.patchValue({
      discountPercentage: 15,
      startDate: '', // Invalid
      endDate: '2026-06-20'
    });
    component.toggleProductSelection('p1');

    component.onConfirm();

    expect(component.confirmPromotion.emit).not.toHaveBeenCalled();
  });

  it('onConfirm no debería emitir si no hay productos seleccionados', () => {
    spyOn(component.confirmPromotion, 'emit');

    component.promotionForm.patchValue({
      discountPercentage: 15,
      startDate: '2026-06-16',
      endDate: '2026-06-20'
    });
    // No products selected

    component.onConfirm();

    expect(component.confirmPromotion.emit).not.toHaveBeenCalled();
  });

  it('onClose debería emitir evento closeModal', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });
});
