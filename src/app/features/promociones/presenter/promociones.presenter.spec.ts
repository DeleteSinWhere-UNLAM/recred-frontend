import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  Promotion,
  PromotionService,
} from '../../../data-access/services/promociones/promotion.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { Producto } from '../../inventario/models/producto.interface';
import { ProductoService } from '../../inventario/services/producto.service';
import { PromocionesPagePresenter } from './promociones.presenter';
import { PerfilService } from '../../../data-access/services/perfil.service';

class ProductoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: 'p1',
      nombre: 'Alfajor',
      descripcion: '',
      precio: 1200,
      peso: 0,
      requierePreparacion: false,
      stockActual: 0,
      ...override,
    };
  }
}

class PromocionMother {
  static crear(override: Partial<Promotion> = {}): Promotion {
    return {
      id: '1',
      name: 'Promo 1',
      discountPercentage: 10,
      productIds: ['p1'],
      startDate: '2026-06-12T00:00:00Z',
      endDate: '2026-06-20T00:00:00Z',
      status: 'ACTIVE',
      ...override,
    };
  }
}

describe('PromocionesPagePresenter', () => {
  let presenter: PromocionesPagePresenter;
  let servicioPromocion: jasmine.SpyObj<PromotionService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let router: jasmine.SpyObj<Router>;
  let servicioDialog: jasmine.SpyObj<DialogService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    servicioPromocion = jasmine.createSpyObj('PromotionService', [
      'getPromotions',
      'cambiarEstadoPromocion',
      'actualizarPromocion'
    ]);
    servicioProducto = jasmine.createSpyObj('ProductoService', ['getById']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    servicioDialog = jasmine.createSpyObj('DialogService', ['confirm']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    servicioPerfil.obtenerBuffetId.and.returnValue('buffet-1');

    TestBed.configureTestingModule({
      providers: [
        PromocionesPagePresenter,
        { provide: PromotionService, useValue: servicioPromocion },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: Router, useValue: router },
        { provide: DialogService, useValue: servicioDialog },
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });

    presenter = TestBed.inject(PromocionesPagePresenter);
  });

  describe('inicializacion', () => {
    it('dado el presenter recien creado, deberia estar en estado limpio', () => {
      expect(presenter.isLoading()).toBeFalse();
      expect(presenter.error()).toBeNull();
      expect(presenter.promotions()).toEqual([]);
    });
  });

  describe('loadPromotions', () => {
    it('dado una API que responde con promociones y productos, deberia actualizar el estado con los productos resueltos', () => {
      givenPromocionesDelBack([PromocionMother.crear()]);
      givenProductoResuelto(ProductoMother.crear());

      whenCargoPromociones();

      expect(presenter.isLoading()).toBeFalse();
      expect(presenter.error()).toBeNull();
      expect(presenter.promotions().length).toBe(1);
      expect(presenter.promotions()[0].name).toBe('Promo 1');
      expect(presenter.promotions()[0].products[0].nombre).toBe('Alfajor');
      expect(servicioProducto.getById).toHaveBeenCalledWith('p1', 'buffet-1');
    });

    it('dado una promocion sin imageUrl pero cuyos productos tienen urlImagen, deberia generar el collage dinamico', () => {
      givenPromocionesDelBack([PromocionMother.crear({ imageUrl: undefined, productIds: ['p1', 'p2'] })]);
      servicioProducto.getById.and.callFake((id: string) => of(ProductoMother.crear({ id, urlImagen: `https://res.cloudinary.com/djzfudbze/image/upload/v12345/${id}.png` })));

      whenCargoPromociones();

      const promo = presenter.promotions()[0];
      expect(promo.imageUrl).toContain('res.cloudinary.com/djzfudbze/image/upload');
      expect(promo.imageUrl).toContain('p1');
      expect(promo.imageUrl).toContain('p2');
    });

    it('dado el back devuelve nombres en espanol o snake_case, deberia normalizarlos al modelo interno', () => {
      const promocionRaw: Record<string, unknown> = {
        id: '1',
        nombre: 'Promo Spanish',
        porcentaje_descuento: 15,
        productosIds: ['p1'],
        fechaInicio: '2026-06-12T00:00:00.123456Z',
        fechaFin: '2026-06-20T00:00:00.654321Z',
        estado: 'DRAFT',
      };
      givenPromocionesDelBack([promocionRaw as unknown as Promotion]);
      givenProductoResuelto(ProductoMother.crear({ id: 'p1', nombre: 'Jugo', precio: 900 }));

      whenCargoPromociones();

      const result = presenter.promotions()[0];
      expect(result.name).toBe('Promo Spanish');
      expect(result.discountPercentage).toBe(15);
      expect(result.productIds).toEqual(['p1']);
      expect(result.status).toBe('DRAFT');
      expect(result.startDate).toContain('2026-06-12T00:00:00Z');
      expect(result.products[0].nombre).toBe('Jugo');
    });

    it('dado un producto que no se puede resolver, deberia usar el fallback "Producto no disponible"', () => {
      givenPromocionesDelBack([PromocionMother.crear()]);
      servicioProducto.getById.and.returnValue(throwError(() => new Error('Not found')));

      whenCargoPromociones();

      expect(presenter.error()).toBeNull();
      expect(presenter.promotions()[0].products[0].id).toBe('p1');
      expect(presenter.promotions()[0].products[0].nombre).toBe('Producto no disponible');
    });

    it('dado que la API falla al obtener promociones, deberia setear el mensaje de error y dejar la lista vacia', () => {
      servicioPromocion.getPromotions.and.returnValue(throwError(() => new Error('API Error')));

      whenCargoPromociones();

      expect(presenter.isLoading()).toBeFalse();
      expect(presenter.error()).toBe(
        'Ocurrió un error al cargar las promociones. Por favor, intenta nuevamente.',
      );
      expect(presenter.promotions().length).toBe(0);
    });
  });

  describe('navegacion', () => {
    it('dado el presenter, cuando hago click en volver, deberia navegar a /kiosquero', () => {
      presenter.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });

    it('dado el presenter, cuando hago click en nueva promocion, deberia navegar a baja rotacion del kiosquero', () => {
      presenter.nuevaPromocion();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/sugerencias');
    });
  });

  describe('toggleStatus', () => {
    it('deberia llamar al service y recargar promociones si es exitoso', () => {
      servicioPromocion.cambiarEstadoPromocion.and.returnValue(of(PromocionMother.crear()));
      servicioPromocion.getPromotions.and.returnValue(of([]));

      presenter.toggleStatus('promo-1');

      expect(servicioPromocion.cambiarEstadoPromocion).toHaveBeenCalledWith('promo-1');
      expect(servicioPromocion.getPromotions).toHaveBeenCalled();
    });

    it('dado que el toggle falla, deberia setear el estado de error', () => {
      servicioPromocion.cambiarEstadoPromocion.and.returnValue(throwError(() => new Error('Toggle failed')));

      presenter.toggleStatus('promo-1');

      expect(presenter.error()).toBe('Error al cambiar el estado de la promoción.');
    });
  });

  describe('helpers de UI y calculos', () => {
    it('getStatusLabel deberia devolver la etiqueta correcta segun estado y fechas', () => {
      const pastDate = new Date(Date.now() - 100000).toISOString();
      const futureDate = new Date(Date.now() + 100000).toISOString();

      const pInactive = { ...PromocionMother.crear({ status: 'INACTIVE' }), products: [] };
      const pDraft = { ...PromocionMother.crear({ status: 'ACTIVE', startDate: futureDate, endDate: futureDate }), products: [] };
      const pActive = { ...PromocionMother.crear({ status: 'ACTIVE', startDate: pastDate, endDate: futureDate }), products: [] };
      const pExpired = { ...PromocionMother.crear({ status: 'ACTIVE', startDate: pastDate, endDate: pastDate }), products: [] };

      expect(presenter.getStatusLabel(pInactive)).toBe('Inactiva');
      expect(presenter.getStatusLabel(pDraft)).toBe('Programada');
      expect(presenter.getStatusLabel(pActive)).toBe('Activa');
      expect(presenter.getStatusLabel(pExpired)).toBe('Vencida');
    });

    it('dado una promocion con 5 productos y descuento 20%, calcularia originales, descuentos y visibles', () => {
      const promo = {
        ...PromocionMother.crear({ discountPercentage: 20 }),
        products: [
          ProductoMother.crear({ id: '1', precio: 1000 }),
          ProductoMother.crear({ id: '2', precio: 500 }),
          ProductoMother.crear({ id: '3', precio: 500 }),
          ProductoMother.crear({ id: '4', precio: 0 }),
          ProductoMother.crear({ id: '5', precio: 200 }),
        ],
      };

      expect(presenter.getOriginalTotal(promo)).toBe(2200);
      expect(presenter.getDiscountedTotal(promo)).toBe(1760);
      expect(presenter.getVisibleProducts(promo).length).toBe(3);
      expect(presenter.getHiddenProductsCount(promo)).toBe(2);
    });

    it('dado una promocion con 2 productos, getHiddenProductsCount deberia ser 0', () => {
      const promo = {
        ...PromocionMother.crear(),
        products: [ProductoMother.crear({ id: '1' }), ProductoMother.crear({ id: '2' })],
      };

      expect(presenter.getHiddenProductsCount(promo)).toBe(0);
    });

    it('dado una promocion sin descuento, getDiscountedTotal deberia ser igual al total original', () => {
      const promo = {
        ...PromocionMother.crear({ discountPercentage: 0 }),
        products: [ProductoMother.crear({ precio: 400 })],
      };

      expect(presenter.getDiscountedTotal(promo)).toBe(400);
    });

    it('dado promociones cargadas, hasPromotions deberia devolver true; sin promociones, false', () => {
      expect(presenter.hasPromotions()).toBeFalse();

      givenPromocionesDelBack([PromocionMother.crear()]);
      givenProductoResuelto(ProductoMother.crear());
      whenCargoPromociones();

      expect(presenter.hasPromotions()).toBeTrue();
    });
  });

  describe('filtros y ordenamiento', () => {
    beforeEach(() => {
      const p1 = { ...PromocionMother.crear({ id: '1', name: 'Banana', status: 'ACTIVE', startDate: '2026-05-01T00:00:00.000Z' }), products: [] };
      const p2 = { ...PromocionMother.crear({ id: '2', name: 'Alfajor', status: 'INACTIVE', startDate: '2026-01-01T00:00:00.000Z' }), products: [] };
      const p3 = { ...PromocionMother.crear({ id: '3', name: 'Cerveza', status: 'ACTIVE', startDate: '2026-07-01T00:00:00.000Z' }), products: [] };
      servicioPromocion.getPromotions.and.returnValue(of([p1, p2, p3]));
      servicioProducto.getById.and.returnValue(of(ProductoMother.crear()));
      presenter.loadPromotions();
    });

    it('dado filter ALL y sort DATE_DESC (default), deberia devolver todas ordenadas por fecha descendente', () => {
      const ids = presenter.filteredPromotions().map((p) => p.id);
      expect(ids).toEqual(['3', '1', '2']);
    });

    it('dado filter ACTIVE, solo deberia devolver las activas', () => {
      presenter.setFilter('ACTIVE');

      const ids = presenter.filteredPromotions().map((p) => p.id);
      expect(ids).toEqual(['3', '1']);
    });

    it('dado filter INACTIVE, solo deberia devolver las inactivas', () => {
      presenter.setFilter('INACTIVE');

      const ids = presenter.filteredPromotions().map((p) => p.id);
      expect(ids).toEqual(['2']);
    });

    it('dado sort NAME_ASC, deberia ordenar por nombre alfabeticamente', () => {
      presenter.setSort('NAME_ASC');

      const nombres = presenter.filteredPromotions().map((p) => p.name);
      expect(nombres).toEqual(['Alfajor', 'Banana', 'Cerveza']);
    });

    it('dado sort NAME_DESC, deberia ordenar por nombre inverso', () => {
      presenter.setSort('NAME_DESC');

      const nombres = presenter.filteredPromotions().map((p) => p.name);
      expect(nombres).toEqual(['Cerveza', 'Banana', 'Alfajor']);
    });
  });

  describe('savePromotion', () => {
    it('dado el update es exitoso, deberia recargar las promociones', () => {
      servicioPromocion.actualizarPromocion.and.returnValue(of(PromocionMother.crear()));
      servicioPromocion.getPromotions.and.returnValue(of([]));

      presenter.savePromotion({ id: 'promo-1', name: 'X' });

      expect(servicioPromocion.actualizarPromocion).toHaveBeenCalledWith('promo-1', { id: 'promo-1', name: 'X' });
      expect(servicioPromocion.getPromotions).toHaveBeenCalled();
    });

    it('dado el update falla, deberia setear el mensaje de error', () => {
      servicioPromocion.actualizarPromocion.and.returnValue(throwError(() => new Error('boom')));

      presenter.savePromotion({ id: 'promo-1' });

      expect(presenter.error()).toBe('Error al actualizar la promoción.');
    });
  });

  describe('getPromotionStateClass', () => {
    it('dado una promocion INACTIVE, deberia devolver "inactive"', () => {
      const promo = { ...PromocionMother.crear({ status: 'INACTIVE' }), products: [] };

      expect(presenter.getPromotionStateClass(promo)).toBe('inactive');
    });

    it('dado una promocion ACTIVE con fecha futura, deberia devolver "draft"', () => {
      const future = new Date(Date.now() + 100000).toISOString();
      const promo = { ...PromocionMother.crear({ status: 'ACTIVE', startDate: future, endDate: future }), products: [] };

      expect(presenter.getPromotionStateClass(promo)).toBe('draft');
    });

    it('dado una promocion ACTIVE vigente, deberia devolver "active"', () => {
      const past = new Date(Date.now() - 100000).toISOString();
      const future = new Date(Date.now() + 100000).toISOString();
      const promo = { ...PromocionMother.crear({ status: 'ACTIVE', startDate: past, endDate: future }), products: [] };

      expect(presenter.getPromotionStateClass(promo)).toBe('active');
    });

    it('dado una promocion ACTIVE ya vencida, deberia devolver "expired"', () => {
      const past = new Date(Date.now() - 100000).toISOString();
      const promo = { ...PromocionMother.crear({ status: 'ACTIVE', startDate: past, endDate: past }), products: [] };

      expect(presenter.getPromotionStateClass(promo)).toBe('expired');
    });
  });

  describe('isExpiringSoon', () => {
    it('dado una promocion INACTIVE, deberia devolver false aunque termine pronto', () => {
      const enUnDia = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const promo = { ...PromocionMother.crear({ status: 'INACTIVE', endDate: enUnDia }), products: [] };

      expect(presenter.isExpiringSoon(promo)).toBeFalse();
    });

    it('dado una promocion ACTIVE que termina en menos de 3 dias, deberia devolver true', () => {
      const enUnDia = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const promo = { ...PromocionMother.crear({ status: 'ACTIVE', endDate: enUnDia }), products: [] };

      expect(presenter.isExpiringSoon(promo)).toBeTrue();
    });

    it('dado una promocion ACTIVE que termina en mas de 3 dias, deberia devolver false', () => {
      const enUnaSemana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const promo = { ...PromocionMother.crear({ status: 'ACTIVE', endDate: enUnaSemana }), products: [] };

      expect(presenter.isExpiringSoon(promo)).toBeFalse();
    });

    it('dado una promocion ACTIVE ya vencida, deberia devolver false', () => {
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const promo = { ...PromocionMother.crear({ status: 'ACTIVE', endDate: ayer }), products: [] };

      expect(presenter.isExpiringSoon(promo)).toBeFalse();
    });
  });

  describe('normalizacion de promociones con nombres alternativos', () => {
    it('dado que el back devuelve promocion sin nombre reconocible, deberia usar "Sin nombre"', () => {
      const promocionRaw: Record<string, unknown> = {
        id: 'promo-1',
        productIds: [],
      };
      givenPromocionesDelBack([promocionRaw as unknown as Promotion]);

      whenCargoPromociones();

      expect(presenter.promotions()[0].name).toBe('Sin nombre');
      expect(presenter.promotions()[0].discountPercentage).toBe(0);
      expect(presenter.promotions()[0].status).toBe('UNKNOWN');
    });

    it('dado promociones con "titulo" en vez de nombre, deberia respetarlo', () => {
      const promocionRaw: Record<string, unknown> = {
        id: 'promo-1',
        titulo: 'Titulo Legacy',
        productIds: [],
      };
      givenPromocionesDelBack([promocionRaw as unknown as Promotion]);

      whenCargoPromociones();

      expect(presenter.promotions()[0].name).toBe('Titulo Legacy');
    });

    it('dado que los productos vienen como objetos, deberia extraer los ids', () => {
      const promocionRaw: Record<string, unknown> = {
        id: 'promo-1',
        name: 'X',
        productos: [
          { id: 'p1' },
          { productId: 'p2' },
          { productoId: 'p3' },
          42,
          { nada: true },
        ],
      };
      givenPromocionesDelBack([promocionRaw as unknown as Promotion]);
      servicioProducto.getById.and.callFake((id: string) =>
        of(ProductoMother.crear({ id, nombre: `Nombre-${id}` })),
      );

      whenCargoPromociones();

      const promo = presenter.promotions()[0];
      expect(promo.productIds).toEqual(['p1', 'p2', 'p3']);
    });

    it('dado una promocion sin productIds, deberia resolverse con products vacio y sin llamar al ProductoService', () => {
      givenPromocionesDelBack([PromocionMother.crear({ productIds: [] })]);
      servicioProducto.getById.calls.reset();

      whenCargoPromociones();

      expect(presenter.promotions()[0].products).toEqual([]);
      expect(servicioProducto.getById).not.toHaveBeenCalled();
    });
  });

  function givenPromocionesDelBack(promociones: Promotion[]): void {
    servicioPromocion.getPromotions.and.returnValue(of(promociones));
  }

  function givenProductoResuelto(producto: Producto): void {
    servicioProducto.getById.and.returnValue(of(producto));
  }

  function whenCargoPromociones(): void {
    presenter.loadPromotions();
  }
});
