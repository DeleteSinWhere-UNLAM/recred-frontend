import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalAprobacionPromocionIaComponent } from './modal-aprobacion-promocion-ia.component';
import { PromocionCreada } from '../../models/recomendacion.model';

describe('ModalAprobacionPromocionIaComponent', () => {
  let component: ModalAprobacionPromocionIaComponent;
  let fixture: ComponentFixture<ModalAprobacionPromocionIaComponent>;

  const mockPromotion: PromocionCreada = {
    id: 'promo-1',
    name: 'Promo',
    discountPercentage: 10,
    startDate: '2026-01-01',
    status: 'ACTIVE',
    endDate: '2026-12-31',
    productIds: ['p1']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAprobacionPromocionIaComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ModalAprobacionPromocionIaComponent);
    component = fixture.componentInstance;
    component.promotion = mockPromotion;
    component.resolvedProducts = [];
    fixture.detectChanges();
  });

  it('dado que getDiscountedPrice recibe un precio original sin descuento, deberia devolver originalPrice', () => {
    component.promotion = { ...mockPromotion, discountPercentage: undefined } as unknown as PromocionCreada;
    expect(component.getDiscountedPrice(100)).toBe(100);
  });

  it('dado que getDiscountedPrice recibe un precio original y hay descuento, deberia aplicar el porcentaje', () => {
    component.promotion = mockPromotion;
    expect(component.getDiscountedPrice(100)).toBe(90);
  });

  it('dado que se invoca onApprove, deberia emitir approve con el id', () => {
    spyOn(component.approve, 'emit');
    component.onApprove();
    expect(component.approve.emit).toHaveBeenCalledWith('promo-1');
  });

  it('dado que se invoca onEdit, deberia emitir edit con el id', () => {
    spyOn(component.edit, 'emit');
    component.onEdit();
    expect(component.edit.emit).toHaveBeenCalledWith('promo-1');
  });

  it('dado que se invoca onDiscard, deberia emitir discard con el id', () => {
    spyOn(component.discard, 'emit');
    component.onDiscard();
    expect(component.discard.emit).toHaveBeenCalledWith('promo-1');
  });

  it('dado que se invoca onClose, deberia emitir closeModal', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });
});
