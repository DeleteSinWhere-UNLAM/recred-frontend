import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IaPromotionApprovalModalComponent } from './ia-promotion-approval-modal.component';
import { PromocionSugerida } from '../../models/recomendacion.model';
import { Product } from '../../../updated-inventory/models/product.interface';

describe('IaPromotionApprovalModalComponent', () => {
  let component: IaPromotionApprovalModalComponent;
  let fixture: ComponentFixture<IaPromotionApprovalModalComponent>;

  const mockSuggestedPromotion: PromocionSugerida = {
    nombre: 'Combo Invierno',
    descuento: 20,
    categorias_destino: ['caliente'],
    productIds: ['prod-1', 'prod-2']
  };

  const mockProducts: Product[] = [
    { id: 'prod-1', nombre: 'Café', descripcion: '', precio: 1000, peso: 0, requierePreparacion: false, stockActual: 10 },
    { id: 'prod-2', nombre: 'Alfajor', descripcion: '', precio: 500, peso: 0, requierePreparacion: false, stockActual: 5 }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IaPromotionApprovalModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IaPromotionApprovalModalComponent);
    component = fixture.componentInstance;
    component.suggestedPromotion = mockSuggestedPromotion;
    component.resolvedProducts = mockProducts;
    fixture.detectChanges();
  });

  it('Dado que se crea el componente, debería inicializarse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.promotionForm).toBeDefined();
    expect(component.selectedProductIds.size).toBe(2);
  });

  it('Dado que se hace click en confirmar, debería emitir los datos del formulario si es valido', () => {
    spyOn(component.confirmPromotion, 'emit');
    component.onConfirm();
    expect(component.confirmPromotion.emit).toHaveBeenCalled();
  });

  it('Dado que el usuario hace clic en cerrar, debe emitir closeModal', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });
});
