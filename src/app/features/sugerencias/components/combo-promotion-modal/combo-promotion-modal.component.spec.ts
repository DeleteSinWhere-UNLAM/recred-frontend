import { ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuggestedProductMother } from '../../sugerencias.mother';
import { ComboPromotionModalComponent } from './combo-promotion-modal.component';

describe('ComboPromotionModalComponent', () => {
  let component: ComboPromotionModalComponent;
  let fixture: ComponentFixture<ComboPromotionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboPromotionModalComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ComboPromotionModalComponent);
    component = fixture.componentInstance;
    component.baseProductName = 'Test Producto';
    component.suggestedProducts = [
      SuggestedProductMother.crear({ id: 'p1', nombre: 'Prod 1', precio: 100 }),
      SuggestedProductMother.crear({ id: 'p2', nombre: 'Prod 2', precio: 200 }),
    ];
    fixture.detectChanges();
  });

  describe('estado inicial', () => {
    it('cuando se monta, el formulario deberia iniciar valido con valores por defecto', () => {
      expect(component.promotionForm.valid).toBeTrue();
    });
  });

  describe('toggleProductSelection', () => {
    it('dado un producto, cuando hago click en toggle, deberia agregarlo y luego removerlo', () => {
      expect(component.isProductSelected('p1')).toBeFalse();

      component.toggleProductSelection('p1');
      expect(component.isProductSelected('p1')).toBeTrue();
      expect(component.selectedProductIds.size).toBe(1);

      component.toggleProductSelection('p1');
      expect(component.isProductSelected('p1')).toBeFalse();
      expect(component.selectedProductIds.size).toBe(0);
    });
  });

  describe('getDiscountedPrice', () => {
    it('dado un descuento del 20%, cuando calculo el precio, deberia devolverlo con el descuento aplicado', () => {
      component.promotionForm.patchValue({ discountPercentage: 20 });

      expect(component.getDiscountedPrice(100)).toBe(80);
    });

    it('dado descuento nulo, cuando calculo el precio, deberia devolver el original', () => {
      component.promotionForm.patchValue({ discountPercentage: null });

      expect(component.getDiscountedPrice(100)).toBe(100);
    });
  });

  describe('onConfirm', () => {
    it('dado un form valido y productos seleccionados, cuando hago click en confirmar, deberia emitir confirmPromotion', () => {
      spyOn(component.confirmPromotion, 'emit');
      component.promotionForm.patchValue({
        discountPercentage: 15,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
      });
      component.toggleProductSelection('p1');

      component.onConfirm();

      expect(component.confirmPromotion.emit).toHaveBeenCalledWith({
        discountPercentage: 15,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
        productIds: ['p1'],
      });
    });

    it('dado un form invalido, cuando hago click en confirmar, no deberia emitir', () => {
      spyOn(component.confirmPromotion, 'emit');
      component.promotionForm.patchValue({
        discountPercentage: 15,
        startDate: '',
        endDate: '2026-06-20',
      });
      component.toggleProductSelection('p1');

      component.onConfirm();

      expect(component.confirmPromotion.emit).not.toHaveBeenCalled();
    });

    it('dado que no hay productos seleccionados, cuando hago click en confirmar, no deberia emitir', () => {
      spyOn(component.confirmPromotion, 'emit');
      component.promotionForm.patchValue({
        discountPercentage: 15,
        startDate: '2026-06-16',
        endDate: '2026-06-20',
      });

      component.onConfirm();

      expect(component.confirmPromotion.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('cuando hago click en cerrar, deberia emitir closeModal', () => {
      spyOn(component.closeModal, 'emit');

      component.onClose();

      expect(component.closeModal.emit).toHaveBeenCalled();
    });
  });
});
