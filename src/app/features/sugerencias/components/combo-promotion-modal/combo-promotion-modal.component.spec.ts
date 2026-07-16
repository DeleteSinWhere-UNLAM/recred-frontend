import { ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuggestedProductMother } from '../../sugerencias.mother';
import { ComboPromotionModalComponent } from './combo-promotion-modal.component';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';

describe('ComboPromotionModalComponent', () => {
  let component: ComboPromotionModalComponent;
  let fixture: ComponentFixture<ComboPromotionModalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboPromotionModalComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(ComboPromotionModalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    component.baseProductName = 'Test Producto';
    component.suggestedProducts = [
      SuggestedProductMother.crear({ id: 'p1', nombre: 'Prod 1', precio: 100 }),
      SuggestedProductMother.crear({ id: 'p2', nombre: 'Prod 2', precio: 200 }),
    ];
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('estado inicial', () => {
    it('cuando se monta el modal, el formulario deberia iniciar valido con valores por defecto', () => {
      expect(component.promotionForm.valid).toBeTrue();
    });
  });

  describe('toggleProductSelection', () => {
    it('dado un producto, cuando hago click en toggle dos veces, deberia agregarlo y luego removerlo', () => {
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
    it('dado un descuento del 20%, cuando calculo el precio de 100, deberia devolver 80', () => {
      givenDescuento(20);

      expect(component.getDiscountedPrice(100)).toBe(80);
    });

    it('dado descuento nulo, cuando calculo el precio de 100, deberia devolver el original', () => {
      givenDescuento(null);

      expect(component.getDiscountedPrice(100)).toBe(100);
    });
  });

  describe('onConfirm', () => {
    it('dado un form valido y productos seleccionados, cuando confirmo, deberia emitir confirmPromotion', () => {
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
        imageUrl: undefined
      });
    });

    it('dado un form invalido, cuando confirmo, no deberia emitir', () => {
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

    it('dado que no hay productos seleccionados, cuando confirmo, no deberia emitir', () => {
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
    it('cuando hago click en cerrar, deberia emitir closeModal y limpiar previsualizacion', () => {
      spyOn(component.closeModal, 'emit');
      component.imagePreview = 'https://some/image.png';

      component.onClose();

      expect(component.closeModal.emit).toHaveBeenCalled();
      expect(component.imagePreview).toBeNull();
    });
  });

  describe('gestion de imagen', () => {
    it('cuando llamo a removeImage, deberia limpiar el preview a null', () => {
      component.imagePreview = 'https://img.com/promo.png';
      component.removeImage();
      expect(component.imagePreview).toBeNull();
    });

    it('dado que subo una imagen, deberia hacer un post al endpoint de carga de imagen y actualizar imagePreview', () => {
      const file = new File(['foo'], 'promo.png', { type: 'image/png' });
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', {
        value: {
          0: file,
          length: 1,
          item: (i: number) => (i === 0 ? file : null),
        },
      });
      spyOn(FileReader.prototype, 'readAsDataURL').and.stub();
      const event = { target: input } as unknown as Event;

      component.onFileSelected(event);

      expect(component.isUploadingImage).toBeTrue();
      const req = httpMock.expectOne(`${environment.apiUrl}/load-stock/upload-image`);
      expect(req.request.method).toBe('POST');
      req.flush({ url_imagen: 'https://cloud/promo_subida.png' });

      expect(component.imagePreview).toBe('https://cloud/promo_subida.png');
      expect(component.isUploadingImage).toBeFalse();
    });
  });

  function givenDescuento(porcentaje: number | null): void {
    component.promotionForm.patchValue({ discountPercentage: porcentaje });
  }
});
