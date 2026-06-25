import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalAprobarPromocionIaComponent } from './modal-aprobar-promocion-ia.component';
import { PromocionSugerida } from '../../models/recomendacion.model';
import { Producto } from '../../../inventario/models/producto.interface';

describe('ModalAprobarPromocionIaComponent', () => {
  let component: ModalAprobarPromocionIaComponent;
  let fixture: ComponentFixture<ModalAprobarPromocionIaComponent>;

  const mockSuggestedPromotion: PromocionSugerida = {
    nombre: 'Combo Invierno',
    descuento: 20,
    categorias_destino: ['caliente'],
    productIds: ['prod-1', 'prod-2']
  };

  const mockProducts: Producto[] = [
    { id: 'prod-1', nombre: 'Café', descripcion: '', precio: 1000, peso: 0, requierePreparacion: false, stockActual: 10 },
    { id: 'prod-2', nombre: 'Alfajor', descripcion: '', precio: 500, peso: 0, requierePreparacion: false, stockActual: 5 }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAprobarPromocionIaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalAprobarPromocionIaComponent);
    component = fixture.componentInstance;
    component.suggestedPromotion = mockSuggestedPromotion;
    component.resolvedProducts = mockProducts;
    fixture.detectChanges();
  });

  it('Dado que se crea el componente, debería inicializarse correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.promotionForm).toBeDefined();
    expect(component.selectedProductIds.size).toBe(0);
  });

  it('Dado que se hace click en confirmar, debería emitir los datos del formulario si es valido', () => {
    spyOn(component.confirmPromotion, 'emit');
    component.selectedProductIds.add('prod-1'); // Simulamos selección de producto
    component.onConfirm();
    expect(component.confirmPromotion.emit).toHaveBeenCalled();
  });

  it('Dado que el usuario hace clic en cerrar, debe emitir closeModal', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });
});
