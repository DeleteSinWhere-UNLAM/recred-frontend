import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductoInventarioMother } from '../../../inventario/inventario.mother';
import { PromocionSugeridaMother } from '../../recomendaciones-estacionales.mother';
import { ModalAprobarPromocionIaComponent } from './modal-aprobar-promocion-ia.component';

describe('ModalAprobarPromocionIaComponent', () => {
  let component: ModalAprobarPromocionIaComponent;
  let fixture: ComponentFixture<ModalAprobarPromocionIaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAprobarPromocionIaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalAprobarPromocionIaComponent);
    component = fixture.componentInstance;
    component.suggestedPromotion = PromocionSugeridaMother.crear();
    component.resolvedProducts = [
      ProductoInventarioMother.crear({ id: 'prod-1', nombre: 'Café', precio: 1000 }),
      ProductoInventarioMother.crear({ id: 'prod-2', nombre: 'Alfajor', precio: 500 }),
    ];
    fixture.detectChanges();
  });

  describe('Estado inicial', () => {
    it('dado el modal recien montado, cuando lo leo, deberia inicializar el form con el descuento sugerido y sin productos seleccionados', () => {
      expect(component.promotionForm).toBeDefined();
      expect(component.promotionForm.get('discountPercentage')?.value).toBe(20);
      expect(component.selectedProductIds.size).toBe(0);
    });
  });

  describe('toggleProductSelection', () => {
    it('dado un productId no seleccionado, cuando lo toggleo, deberia agregarlo', () => {
      component.toggleProductSelection('prod-1');

      expect(component.isProductSelected('prod-1')).toBeTrue();
    });

    it('dado un productId ya seleccionado, cuando lo toggleo, deberia sacarlo', () => {
      component.toggleProductSelection('prod-1');

      component.toggleProductSelection('prod-1');

      expect(component.isProductSelected('prod-1')).toBeFalse();
    });
  });

  describe('getDiscountedPrice', () => {
    it('dado un descuento del 20%, cuando calculo el precio de $1000, deberia devolver $800', () => {
      givenDescuento(20);

      expect(component.getDiscountedPrice(1000)).toBe(800);
    });

    it('dado un descuento del 50%, cuando calculo el precio de $500, deberia devolver $250', () => {
      givenDescuento(50);

      expect(component.getDiscountedPrice(500)).toBe(250);
    });
  });

  describe('onConfirm', () => {
    it('dado el form valido y productos seleccionados, cuando confirmo, deberia emitir confirmPromotion con el payload', () => {
      spyOn(component.confirmPromotion, 'emit');
      component.selectedProductIds.add('prod-1');
      component.promotionForm.patchValue({
        discountPercentage: 25,
        startDate: '2026-06-10',
        endDate: '2026-06-20',
      });

      component.onConfirm();

      expect(component.confirmPromotion.emit).toHaveBeenCalledWith({
        discountPercentage: 25,
        startDate: '2026-06-10',
        endDate: '2026-06-20',
        productIds: ['prod-1'],
      });
    });

    it('dado el form invalido, cuando confirmo, no deberia emitir', () => {
      spyOn(component.confirmPromotion, 'emit');
      component.selectedProductIds.add('prod-1');
      component.promotionForm.patchValue({ discountPercentage: null });

      component.onConfirm();

      expect(component.confirmPromotion.emit).not.toHaveBeenCalled();
    });

    it('dado sin productos seleccionados, cuando confirmo, no deberia emitir', () => {
      spyOn(component.confirmPromotion, 'emit');

      component.onConfirm();

      expect(component.confirmPromotion.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('dado el modal, cuando llamo onClose, deberia emitir closeModal', () => {
      spyOn(component.closeModal, 'emit');

      component.onClose();

      expect(component.closeModal.emit).toHaveBeenCalled();
    });
  });

  function givenDescuento(porcentaje: number): void {
    component.promotionForm.patchValue({ discountPercentage: porcentaje });
  }
});
