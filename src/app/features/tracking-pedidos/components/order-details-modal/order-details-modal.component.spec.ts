import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PromotionService, Promotion } from '../../../../data-access/services/promociones/promotion.service';
import { DialogService } from '../../../../shared/services/dialog.service';
import { CompraService } from '../../../compra/services/compra.service';
import { Producto } from '../../../inventario/models/producto.interface';
import { ProductoService } from '../../../inventario/services/producto.service';
import { ScheduledPickupMother } from '../../tracking-pedidos.mother';
import { OrderDetailsModalComponent } from './order-details-modal.component';

describe('OrderDetailsModalComponent', () => {
  let component: OrderDetailsModalComponent;
  let fixture: ComponentFixture<OrderDetailsModalComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let promotionService: jasmine.SpyObj<PromotionService>;
  let productService: jasmine.SpyObj<ProductoService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService', ['deliver']);
    promotionService = jasmine.createSpyObj<PromotionService>('PromotionService', [
      'getPromotionById',
    ]);
    productService = jasmine.createSpyObj<ProductoService>('ProductoService', ['getById']);
    dialogService = jasmine.createSpyObj<DialogService>('DialogService', ['alert', 'confirm']);

    await TestBed.configureTestingModule({
      imports: [OrderDetailsModalComponent],
      providers: [
        { provide: CompraService, useValue: compraService },
        { provide: PromotionService, useValue: promotionService },
        { provide: ProductoService, useValue: productService },
        { provide: DialogService, useValue: dialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailsModalComponent);
    component = fixture.componentInstance;
    component.order = ScheduledPickupMother.crear();
  });

  describe('esPromocion', () => {
    it('dado un nombre que empieza con "promo", cuando pregunto si es promocion, deberia devolver true', () => {
      expect(component.esPromocion('Promo 2x1')).toBeTrue();
    });

    it('dado un nombre que empieza con "combo", cuando pregunto si es promocion, deberia devolver true', () => {
      expect(component.esPromocion('combo especial')).toBeTrue();
    });

    it('dado un nombre que contiene "duo pack", cuando pregunto si es promocion, deberia devolver true', () => {
      expect(component.esPromocion('Alfajor Duo Pack')).toBeTrue();
    });

    it('dado un nombre normal, cuando pregunto si es promocion, deberia devolver false', () => {
      expect(component.esPromocion('Alfajor')).toBeFalse();
    });

    it('dado un nombre vacio, cuando pregunto si es promocion, deberia devolver false', () => {
      expect(component.esPromocion('')).toBeFalse();
    });
  });

  describe('togglePromoDetails', () => {
    it('dado un productoId no cargado, cuando toggle, deberia pedir la promocion y sus productos', () => {
      const promo = { productIds: ['p1'], discountPercentage: 20 } as unknown as Promotion;
      const producto = { id: 'p1', precio: 100 } as unknown as Producto;
      promotionService.getPromotionById.and.returnValue(of(promo));
      productService.getById.and.returnValue(of(producto));

      component.togglePromoDetails('promo-1');

      expect(component.expandedPromos.has('promo-1')).toBeTrue();
      expect(promotionService.getPromotionById).toHaveBeenCalledWith('promo-1');
      expect(productService.getById).toHaveBeenCalledWith('p1');
      expect(component.promosLoaded.get('promo-1')?.loading).toBeFalse();
      expect(component.promosLoaded.get('promo-1')?.products.length).toBe(1);
    });

    it('dado un productoId ya expandido, cuando toggle de nuevo, deberia colapsarlo', () => {
      component.expandedPromos.add('promo-1');

      component.togglePromoDetails('promo-1');

      expect(component.expandedPromos.has('promo-1')).toBeFalse();
      expect(promotionService.getPromotionById).not.toHaveBeenCalled();
    });

    it('dado que falla getPromotionById, cuando toggle, deberia marcar error', () => {
      promotionService.getPromotionById.and.returnValue(throwError(() => new Error('boom')));

      component.togglePromoDetails('promo-1');

      expect(component.promosLoaded.get('promo-1')?.error).toBeTrue();
      expect(component.promosLoaded.get('promo-1')?.loading).toBeFalse();
    });

    it('dado una promocion sin productos, cuando toggle, deberia dejar products vacio sin cargar loading', () => {
      const promo = { productIds: [], discountPercentage: 10 } as unknown as Promotion;
      promotionService.getPromotionById.and.returnValue(of(promo));

      component.togglePromoDetails('promo-1');

      expect(component.promosLoaded.get('promo-1')?.products).toEqual([]);
      expect(component.promosLoaded.get('promo-1')?.loading).toBeFalse();
    });
  });

  describe('getPromoOriginalPrice / getPromoDiscountedPrice', () => {
    it('dado varios productos cargados, deberia sumar los precios originales', () => {
      component.promosLoaded.set('promo-1', {
        promotion: { discountPercentage: 20 } as unknown as Promotion,
        products: [{ precio: 100 } as Producto, { precio: 50 } as Producto],
        loading: false,
        error: false,
      });

      expect(component.getPromoOriginalPrice('promo-1')).toBe(150);
      expect(component.getPromoDiscountedPrice('promo-1')).toBe(120);
    });

    it('dado un promo id inexistente, deberia devolver 0', () => {
      expect(component.getPromoOriginalPrice('inexistente')).toBe(0);
      expect(component.getPromoDiscountedPrice('inexistente')).toBe(0);
    });
  });

  describe('nextStatusText y canAdvance / canCancel', () => {
    it('dado PENDIENTE, deberia decir "Iniciar preparación" y permitir avanzar/cancelar', () => {
      component.order = ScheduledPickupMother.crear({ status: 'PENDIENTE' });

      expect(component.nextStatusText()).toBe('Iniciar preparación');
      expect(component.canAdvance()).toBeTrue();
      expect(component.canCancel()).toBeTrue();
    });

    it('dado ENTREGADO, deberia devolver texto vacio y no permitir avanzar ni cancelar', () => {
      component.order = ScheduledPickupMother.crear({ status: 'ENTREGADO' });

      expect(component.nextStatusText()).toBe('');
      expect(component.canAdvance()).toBeFalse();
      expect(component.canCancel()).toBeFalse();
    });
  });

  describe('onAdvance', () => {
    it('dado un estado PENDIENTE, cuando hago click en avanzar, deberia emitir advanceStatus con EN_PREPARACION', () => {
      spyOn(component.advanceStatus, 'emit');
      component.order = ScheduledPickupMother.crear({ status: 'PENDIENTE' });

      component['onAdvance']();

      expect(component.advanceStatus.emit).toHaveBeenCalledWith({
        orderId: 'order-1',
        nextStatus: 'EN_PREPARACION',
      });
    });

    it('dado un estado LISTO, cuando hago click en avanzar, deberia abrir el modal de verificacion', () => {
      spyOn(component.advanceStatus, 'emit');
      component.order = ScheduledPickupMother.crear({ status: 'LISTO' });

      component['onAdvance']();

      expect(component.showVerificationModal).toBeTrue();
      expect(component.advanceStatus.emit).not.toHaveBeenCalled();
    });

    it('dado que esta actualizando, cuando hago click en avanzar, no deberia emitir', () => {
      spyOn(component.advanceStatus, 'emit');
      component.isUpdating = true;
      component.order = ScheduledPickupMother.crear({ status: 'PENDIENTE' });

      component['onAdvance']();

      expect(component.advanceStatus.emit).not.toHaveBeenCalled();
    });
  });

  describe('validateCode', () => {
    it('dado un codigo, cuando valido, deberia llamar a deliver y marcar codeValidated', () => {
      compraService.deliver.and.returnValue(of(undefined));
      component.verificationCode = 'ABC123';

      component['validateCode']();

      expect(compraService.deliver).toHaveBeenCalledWith('order-1', 'ABC123');
      expect(component.codeValidated).toBeTrue();
      expect(component.validationError).toBeNull();
    });

    it('dado un codigo vacio, cuando valido, no deberia llamar a deliver', () => {
      component.verificationCode = '';

      component['validateCode']();

      expect(compraService.deliver).not.toHaveBeenCalled();
    });

    it('dado que deliver falla, cuando valido, deberia setear validationError', () => {
      compraService.deliver.and.returnValue(throwError(() => new Error('bad code')));
      component.verificationCode = 'BAD';

      component['validateCode']();

      expect(component.codeValidated).toBeFalse();
      expect(component.validationError).toBe('Código incorrecto. Por favor, ingréselo nuevamente.');
    });

    it('dado un codigo validado y estado LISTO, cuando avanzo, deberia emitir ENTREGADO', () => {
      spyOn(component.advanceStatus, 'emit');
      component.order = ScheduledPickupMother.crear({ status: 'LISTO' });
      component.showVerificationModal = true;
      component.codeValidated = true;

      component['onAdvance']();

      expect(component.advanceStatus.emit).toHaveBeenCalledWith({
        orderId: 'order-1',
        nextStatus: 'ENTREGADO',
      });
    });
  });

  describe('onCancel', () => {
    it('dado que confirmo el cancelar, cuando hago click, deberia emitir cancelOrder con el id', async () => {
      spyOn(component.cancelOrder, 'emit');
      dialogService.confirm.and.resolveTo(true);

      await component['onCancel']();

      expect(component.cancelOrder.emit).toHaveBeenCalledWith('order-1');
    });

    it('dado que rechazo el cancelar, cuando hago click, no deberia emitir', async () => {
      spyOn(component.cancelOrder, 'emit');
      dialogService.confirm.and.resolveTo(false);

      await component['onCancel']();

      expect(component.cancelOrder.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('cuando hago click en cerrar, deberia emitir closeModal', () => {
      spyOn(component.closeModal, 'emit');

      component['onClose']();

      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('dado que isUpdating es true, cuando hago click en cerrar, no deberia emitir', () => {
      spyOn(component.closeModal, 'emit');
      component.isUpdating = true;

      component['onClose']();

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });
  });

  describe('nextStatusText — estados intermedios', () => {
    it('dado EN_PREPARACION, deberia decir "Marcar como listo"', () => {
      component.order = ScheduledPickupMother.crear({ status: 'EN_PREPARACION' });

      expect(component.nextStatusText()).toBe('Marcar como listo');
    });

    it('dado LISTO, deberia decir "Entregar pedido"', () => {
      component.order = ScheduledPickupMother.crear({ status: 'LISTO' });

      expect(component.nextStatusText()).toBe('Entregar pedido');
    });
  });

  describe('onBackdropClick', () => {
    it('dado un click en el backdrop (target === currentTarget), deberia cerrar el modal', () => {
      spyOn(component.closeModal, 'emit');
      const backdrop = document.createElement('div');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: backdrop });
      Object.defineProperty(event, 'currentTarget', { value: backdrop });

      component['onBackdropClick'](event);

      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('dado un click en un hijo del backdrop (target !== currentTarget), no deberia cerrar el modal', () => {
      spyOn(component.closeModal, 'emit');
      const backdrop = document.createElement('div');
      const child = document.createElement('div');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: child });
      Object.defineProperty(event, 'currentTarget', { value: backdrop });

      component['onBackdropClick'](event);

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });
  });

  describe('onAdvance — EN_PREPARACION', () => {
    it('dado un estado EN_PREPARACION, cuando avanzo, deberia emitir advanceStatus con LISTO', () => {
      spyOn(component.advanceStatus, 'emit');
      component.order = ScheduledPickupMother.crear({ status: 'EN_PREPARACION' });

      component['onAdvance']();

      expect(component.advanceStatus.emit).toHaveBeenCalledWith({
        orderId: 'order-1',
        nextStatus: 'LISTO',
      });
    });
  });

  describe('onCancel — isUpdating', () => {
    it('dado que isUpdating es true, no deberia mostrar el confirm ni emitir', async () => {
      spyOn(component.cancelOrder, 'emit');
      component.isUpdating = true;

      await component['onCancel']();

      expect(dialogService.confirm).not.toHaveBeenCalled();
      expect(component.cancelOrder.emit).not.toHaveBeenCalled();
    });
  });

  describe('togglePromoDetails — branches faltantes', () => {
    it('dado un productoId ya cargado en promosLoaded, cuando toggle (expandir de nuevo), no deberia volver a pedirlo', () => {
      component.promosLoaded.set('promo-1', {
        promotion: null,
        products: [],
        loading: false,
        error: false,
      });

      component.togglePromoDetails('promo-1');

      expect(component.expandedPromos.has('promo-1')).toBeTrue();
      expect(promotionService.getPromotionById).not.toHaveBeenCalled();
    });

    it('dado una promocion sin productIds (undefined), deberia tratarla como sin productos', () => {
      const promo = { discountPercentage: 10 } as unknown as Promotion;
      promotionService.getPromotionById.and.returnValue(of(promo));

      component.togglePromoDetails('promo-1');

      expect(component.promosLoaded.get('promo-1')?.products).toEqual([]);
      expect(component.promosLoaded.get('promo-1')?.loading).toBeFalse();
    });

    it('dado un forkJoin que emite error, deberia marcar error true en promosLoaded', () => {
      const promo = { productIds: ['p1'], discountPercentage: 0 } as unknown as Promotion;
      promotionService.getPromotionById.and.returnValue(of(promo));
      const rareObservable = {
        pipe: () => throwError(() => new Error('forkjoin-boom')),
      } as unknown as ReturnType<typeof productService.getById>;
      productService.getById.and.returnValue(rareObservable);

      component.togglePromoDetails('promo-1');

      const data = component.promosLoaded.get('promo-1');
      expect(data?.error).toBeTrue();
      expect(data?.loading).toBeFalse();
    });

it('dado que un producto del forkJoin falla, deberia filtrarlo y quedar solo los validos', () => {
      const promo = { productIds: ['p1', 'p2'], discountPercentage: 0 } as unknown as Promotion;
      promotionService.getPromotionById.and.returnValue(of(promo));
      productService.getById.and.callFake((id: string) => {
        if (id === 'p1') return of({ id: 'p1', precio: 100 } as unknown as Producto);
        return throwError(() => new Error('boom'));
      });

      component.togglePromoDetails('promo-1');

      const data = component.promosLoaded.get('promo-1');
      expect(data?.error).toBeFalse();
      expect(data?.products.map((p) => p.id)).toEqual(['p1']);
    });
  });

  describe('getPromoOriginalPrice / getPromoDiscountedPrice — fallbacks', () => {
    it('dado un producto sin precio, no deberia sumarlo', () => {
      component.promosLoaded.set('promo-1', {
        promotion: { discountPercentage: 10 } as unknown as Promotion,
        products: [{} as Producto, { precio: 500 } as Producto],
        loading: false,
        error: false,
      });

      expect(component.getPromoOriginalPrice('promo-1')).toBe(500);
    });

    it('dado una promocion sin discountPercentage, deberia usar 0 (sin descuento)', () => {
      component.promosLoaded.set('promo-1', {
        promotion: {} as unknown as Promotion,
        products: [{ precio: 500 } as Producto],
        loading: false,
        error: false,
      });

      expect(component.getPromoDiscountedPrice('promo-1')).toBe(500);
    });
  });
});
