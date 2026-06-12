import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IaPromotionApprovalModalComponent } from './ia-promotion-approval-modal.component';
import { PromocionCreada } from '../../models/recomendacion.model';
import { Product } from '../../../updated-inventory/models/product.interface';
import { DatePipe } from '@angular/common';

describe('IaPromotionApprovalModalComponent', () => {
  let component: IaPromotionApprovalModalComponent;
  let fixture: ComponentFixture<IaPromotionApprovalModalComponent>;

  const mockPromotion: PromocionCreada = {
    id: 'promo-1',
    name: 'Combo Invierno',
    discountPercentage: 20,
    productIds: ['prod-1', 'prod-2'],
    startDate: '2026-06-12T00:00:00Z',
    endDate: '2026-06-20T00:00:00Z',
    status: 'PENDING'
  };

  const mockProducts: Product[] = [
    { id: 'prod-1', nombre: 'Café', descripcion: '', precio: 1000, peso: 0, requierePreparacion: false, stockActual: 10 },
    { id: 'prod-2', nombre: 'Alfajor', descripcion: '', precio: 500, peso: 0, requierePreparacion: false, stockActual: 5 }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IaPromotionApprovalModalComponent],
      providers: [DatePipe]
    }).compileComponents();

    fixture = TestBed.createComponent(IaPromotionApprovalModalComponent);
    component = fixture.componentInstance;
    component.promotion = mockPromotion;
    component.resolvedProducts = mockProducts;
    fixture.detectChanges();
  });

  it('Dado que se crea el componente, debería inicializarse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('Dado que se hace click en aprobar, debería emitir el id de la promoción', () => {
    spyOn(component.approve, 'emit');
    component.onApprove();
    expect(component.approve.emit).toHaveBeenCalledWith('promo-1');
  });

  it('Dado que se hace click en editar, debería emitir el id de la promoción', () => {
    spyOn(component.edit, 'emit');
    component.onEdit();
    expect(component.edit.emit).toHaveBeenCalledWith('promo-1');
  });

  it('Dado que se hace click en descartar, debería emitir el id de la promoción', () => {
    spyOn(component.discard, 'emit');
    component.onDiscard();
    expect(component.discard.emit).toHaveBeenCalledWith('promo-1');
  });

  it('Dado que el usuario hace clic en cerrar, debe emitir closeModal', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });
});
