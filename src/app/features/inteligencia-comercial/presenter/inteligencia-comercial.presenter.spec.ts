import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  PromotionService,
} from '../../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { Producto } from '../../inventario/models/producto.interface';
import { SugerenciaAgregarProducto } from '../../sugerencias-agregar/models/sugerencia-agregar.model';
import { SugerenciasAgregarService } from '../../sugerencias-agregar/services/sugerencias-agregar.service';
import {
  ComboSuggestion,
  SugerenciaProducto,
} from '../../sugerencias/models/sugerencia-producto.model';
import { SugerenciasService } from '../../sugerencias/services/sugerencias.service';
import { InteligenciaComercialPresenter } from './inteligencia-comercial.presenter';
import { PromotionFormData } from '../../sugerencias/components/combo-promotion-modal/combo-promotion-modal.component';

class SugerenciaAgregarMother {
  static crear(override: Partial<SugerenciaAgregarProducto> = {}): SugerenciaAgregarProducto {
    return {
      id: 'op-1',
      alumnoId: null,
      buffetId: 'buffet-1',
      productoId: 'prod-1',
      titulo: 'Sumar alfajor',
      mensaje: 'Podrias agregar este producto',
      metadata: {
        totalSales: 20,
        productName: 'Alfajor',
        productPrice: 500,
        totalRevenue: 10000,
        totalCustomers: 15,
      },
      ...override,
    };
  }
}

class SugerenciaProductoMother {
  static crear(override: Partial<SugerenciaProducto> = {}): SugerenciaProducto {
    return {
      productoOriginal: 'Chocolate',
      resumen: 'Baja rotacion',
      alertas: [],
      productosSugeridos: [],
      motivoIA: 'Poco consumido',
      modeloIA: 'gpt',
      estadisticasVenta: {
        productoId: 'prod-chocolate',
        nombre: 'Chocolate',
        categoria: 'golosinas',
        precioActual: 300,
        ventasPeriodo: 2,
        participacionVentas: 0.01,
        rankingGeneral: 30,
        rankingCategoria: 5,
        promedioVentasCategoria: null,
        promedioPrecioCategoria: null,
        diferenciaPrecioCategoria: null,
        diasSinVenta: 7,
        clientesDistintos: 1,
        stockActual: 20,
        stockPromedioCategoria: null,
      },
      ...override,
    };
  }
}

describe('InteligenciaComercialPresenter', () => {
  let presenter: InteligenciaComercialPresenter;
  let sugerenciasAgregarService: jasmine.SpyObj<SugerenciasAgregarService>;
  let sugerenciasService: jasmine.SpyObj<SugerenciasService>;
  let promotionService: jasmine.SpyObj<PromotionService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let productoService: jasmine.SpyObj<ProductoService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sugerenciasAgregarService = jasmine.createSpyObj('SugerenciasAgregarService', [
      'getSugerenciasAgregarProducto',
    ]);
    sugerenciasService = jasmine.createSpyObj('SugerenciasService', [
      'getSugerencias',
      'getComboSuggestions',
    ]);
    promotionService = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    toastService = jasmine.createSpyObj('ToastService', ['mostrar']);
    productoService = jasmine.createSpyObj('ProductoService', ['getById']);
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        InteligenciaComercialPresenter,
        { provide: SugerenciasAgregarService, useValue: sugerenciasAgregarService },
        { provide: SugerenciasService, useValue: sugerenciasService },
        { provide: PromotionService, useValue: promotionService },
        { provide: ToastService, useValue: toastService },
        { provide: ProductoService, useValue: productoService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(InteligenciaComercialPresenter);
  });

  describe('inicializar', () => {
    it('dado los servicios responden ok, deberia poblar ambos streams y bajar loadings', () => {
      givenOportunidadesDelBack([SugerenciaAgregarMother.crear()]);
      givenBajaRotacionDelBack([SugerenciaProductoMother.crear()]);

      presenter.inicializar();

      expect(currentOportunidades().length).toBe(1);
      expect(currentBajaRotacion().length).toBe(1);
      expect(currentLoadingAgregar()).toBeFalse();
      expect(currentLoadingRotacion()).toBeFalse();
    });

    it('dado sugerenciasAgregarService falla, deberia setear errorAgregar y dejar la lista vacia', () => {
      sugerenciasAgregarService.getSugerenciasAgregarProducto.and.returnValue(
        throwError(() => new Error('boom')),
      );
      givenBajaRotacionDelBack([]);

      presenter.inicializar();

      expect(currentOportunidades()).toEqual([]);
      expect(currentErrorAgregar()).toContain('No se pudieron cargar las oportunidades');
      expect(presenter.tieneErrores).toBeTrue();
    });

    it('dado sugerenciasService falla, deberia setear errorRotacion', () => {
      givenOportunidadesDelBack([]);
      sugerenciasService.getSugerencias.and.returnValue(throwError(() => new Error('boom')));

      presenter.inicializar();

      expect(currentBajaRotacion()).toEqual([]);
      expect(currentErrorRotacion()).toContain('No se pudieron cargar los productos con baja rotacion');
    });
  });

  describe('navegacion simple', () => {
    it('verOportunidadesStock deberia navegar a /sugerencias-agregar', () => {
      presenter.verOportunidadesStock();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/sugerencias-agregar');
    });

    it('verBajaRotacion deberia navegar a /kiosquero/sugerencias', () => {
      presenter.verBajaRotacion();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/sugerencias');
    });

    it('cargarProducto deberia navegar a /admin-productos', () => {
      presenter.cargarProducto();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });
  });

  describe('crearPromocion', () => {
    it('dado no hay productos con baja rotacion, deberia navegar a /kiosquero/sugerencias', () => {
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([]);
      presenter.inicializar();

      presenter.crearPromocion();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/sugerencias');
    });

    it('dado hay un producto critico, deberia abrir el modal para ese producto', () => {
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([
        SugerenciaProductoMother.crear({
          estadisticasVenta: {
            ...SugerenciaProductoMother.crear().estadisticasVenta,
            productoId: 'prod-critico',
            diasSinVenta: 30,
          },
        }),
      ]);
      sugerenciasService.getComboSuggestions.and.returnValue(
        of({ idProduct: 'prod-critico', productName: 'X', suggestedProducts: [] } as ComboSuggestion),
      );
      presenter.inicializar();

      presenter.crearPromocion();

      expect(sugerenciasService.getComboSuggestions).toHaveBeenCalledWith('prod-critico');
    });
  });

  describe('darAltaOportunidad', () => {
    it('dado un oportunidadId inexistente, deberia navegar a /admin-productos sin query params', () => {
      givenOportunidadesDelBack([SugerenciaAgregarMother.crear({ id: 'existente' })]);
      givenBajaRotacionDelBack([]);
      presenter.inicializar();

      presenter.darAltaOportunidad('otro-id');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });

    it('dado un oportunidadId valido, deberia navegar con queryParams del producto', () => {
      givenOportunidadesDelBack([
        SugerenciaAgregarMother.crear({
          id: 'op-1',
          metadata: {
            totalSales: 20,
            productName: 'Milanesa',
            productPrice: 1200,
            totalRevenue: 24000,
            totalCustomers: 10,
          },
        }),
      ]);
      givenBajaRotacionDelBack([]);
      presenter.inicializar();

      presenter.darAltaOportunidad('op-1');

      expect(router.navigate).toHaveBeenCalledWith(
        ['/admin-productos'],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({
            origen: 'oportunidad-stock',
            nombreProducto: 'Milanesa',
            precioProducto: 1200,
          }),
        }),
      );
    });
  });

  describe('abrirPromocionParaProducto', () => {
    it('dado el productoId no existe, deberia navegar a /kiosquero/sugerencias', () => {
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([SugerenciaProductoMother.crear()]);
      presenter.inicializar();

      presenter.abrirPromocionParaProducto('id-inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/sugerencias');
    });

    it('dado el productoId existe y sugerencias responde ok, deberia abrir el modal con los productos', () => {
      const sugerencia = SugerenciaProductoMother.crear({
        estadisticasVenta: {
          ...SugerenciaProductoMother.crear().estadisticasVenta,
          productoId: 'prod-1',
        },
      });
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([sugerencia]);
      const suggestedProducts = [{ id: 'suggested', nombre: 'Sug', precio: 100 }];
      sugerenciasService.getComboSuggestions.and.returnValue(
        of({ idProduct: 'prod-1', productName: 'x', suggestedProducts } as ComboSuggestion),
      );
      presenter.inicializar();

      presenter.abrirPromocionParaProducto('prod-1');

      expect(currentModalAbierto()).toBeTrue();
      expect(currentProductosSugeridos()).toEqual(suggestedProducts);
    });

    it('dado sugerencias falla, deberia mostrar toast de error y no abrir el modal', () => {
      const sugerencia = SugerenciaProductoMother.crear({
        estadisticasVenta: {
          ...SugerenciaProductoMother.crear().estadisticasVenta,
          productoId: 'prod-1',
        },
      });
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([sugerencia]);
      sugerenciasService.getComboSuggestions.and.returnValue(throwError(() => new Error('boom')));
      presenter.inicializar();

      presenter.abrirPromocionParaProducto('prod-1');

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'No se pudieron cargar sugerencias para el combo',
        'error',
      );
      expect(currentModalAbierto()).toBeFalse();
    });
  });

  describe('cerrarModalCombo', () => {
    it('deberia cerrar el modal y limpiar los productos sugeridos', () => {
      const sugerencia = SugerenciaProductoMother.crear({
        estadisticasVenta: {
          ...SugerenciaProductoMother.crear().estadisticasVenta,
          productoId: 'prod-1',
        },
      });
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([sugerencia]);
      sugerenciasService.getComboSuggestions.and.returnValue(
        of({
          idProduct: 'prod-1',
          productName: 'x',
          suggestedProducts: [{ id: '1', nombre: 'a', precio: 10 }],
        } as ComboSuggestion),
      );
      presenter.inicializar();
      presenter.abrirPromocionParaProducto('prod-1');

      presenter.cerrarModalCombo();

      expect(currentModalAbierto()).toBeFalse();
      expect(currentProductosSugeridos()).toEqual([]);
    });
  });

  describe('generarPromocion sin producto seleccionado', () => {
    const formData: PromotionFormData = {
      productIds: [],
      discountPercentage: 10,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    };

    it('dado no se abrio ningun modal antes, no deberia llamar al servicio', () => {
      presenter.generarPromocion(formData);

      expect(promotionService.createPromotion).not.toHaveBeenCalled();
    });
  });

  describe('generarPromocion', () => {
    const formData: PromotionFormData = {
      productIds: ['extra-1'],
      discountPercentage: 20,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    };

    beforeEach(() => {
      const sugerencia = SugerenciaProductoMother.crear({
        productoOriginal: 'Chocolate',
        estadisticasVenta: {
          ...SugerenciaProductoMother.crear().estadisticasVenta,
          productoId: 'prod-1',
        },
      });
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([sugerencia]);
      sugerenciasService.getComboSuggestions.and.returnValue(
        of({ idProduct: 'prod-1', productName: 'x', suggestedProducts: [] } as ComboSuggestion),
      );
      presenter.inicializar();
      presenter.abrirPromocionParaProducto('prod-1');
    });

    it('dado la creacion es exitosa, deberia cerrar el modal, avisar y navegar', () => {
      productoService.getById.and.callFake((id: string) =>
        of({
          id,
          nombre: `p-${id}`,
          descripcion: '',
          precio: 100,
          peso: 0,
          requierePreparacion: false,
          stockActual: 5,
        } as Producto),
      );
      promotionService.createPromotion.and.returnValue(of(undefined) as never);

      presenter.generarPromocion(formData);

      expect(promotionService.createPromotion).toHaveBeenCalledTimes(1);
      const payload = promotionService.createPromotion.calls.mostRecent().args[0];
      expect(payload.name).toBe('Combo Chocolate');
      expect(payload.discountPercentage).toBe(20);
      expect(payload.productIds).toEqual(['prod-1', 'extra-1']);
      expect(toastService.mostrar).toHaveBeenCalledWith('Combo creado exitosamente', 'success');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/promociones');
      expect(currentModalAbierto()).toBeFalse();
    });

    it('dado el back falla al crear la promocion, deberia mostrar toast de error', () => {
      productoService.getById.and.callFake((id: string) =>
        of({
          id,
          nombre: '',
          descripcion: '',
          precio: 0,
          peso: 0,
          requierePreparacion: false,
          stockActual: 0,
        } as Producto),
      );
      promotionService.createPromotion.and.returnValue(throwError(() => new Error('boom')) as never);

      presenter.generarPromocion(formData);

      expect(toastService.mostrar).toHaveBeenCalledWith('Error al crear el combo', 'error');
    });

    it('dado productoService falla en un producto, deberia usar el fallback y seguir creando la promocion', () => {
      productoService.getById.and.returnValue(throwError(() => new Error('boom')));
      promotionService.createPromotion.and.returnValue(of(undefined) as never);

      presenter.generarPromocion(formData);

      expect(promotionService.createPromotion).toHaveBeenCalled();
    });
  });

  describe('estaCargando y tieneErrores', () => {
    it('dado ambos servicios responden, no deberia estar cargando ni con errores', () => {
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([]);

      presenter.inicializar();

      expect(presenter.estaCargando).toBeFalse();
      expect(presenter.tieneErrores).toBeFalse();
    });
  });

  describe('resumen', () => {
    it('dado oportunidades y baja rotacion cargadas, deberia sumar metricas y calcular promedio de dias', () => {
      givenOportunidadesDelBack([
        SugerenciaAgregarMother.crear({
          metadata: {
            totalSales: 0,
            productName: 'A',
            productPrice: 0,
            totalRevenue: 1000,
            totalCustomers: 5,
          },
        }),
        SugerenciaAgregarMother.crear({
          id: 'op-2',
          metadata: {
            totalSales: 0,
            productName: 'B',
            productPrice: 0,
            totalRevenue: 500,
            totalCustomers: 3,
          },
        }),
      ]);
      givenBajaRotacionDelBack([
        SugerenciaProductoMother.crear({
          estadisticasVenta: {
            ...SugerenciaProductoMother.crear().estadisticasVenta,
            diasSinVenta: 10,
            stockActual: 20,
          },
        }),
        SugerenciaProductoMother.crear({
          estadisticasVenta: {
            ...SugerenciaProductoMother.crear().estadisticasVenta,
            productoId: 'x',
            diasSinVenta: 20,
            stockActual: 30,
          },
        }),
      ]);
      presenter.inicializar();

      const resumen = presenter.resumen;

      expect(resumen.productosParaAgregar).toBe(2);
      expect(resumen.ingresoPotencial).toBe(1500);
      expect(resumen.clientesAlcanzables).toBe(8);
      expect(resumen.productosBajaRotacion).toBe(2);
      expect(resumen.stockInmovilizado).toBe(50);
      expect(resumen.promedioDiasSinVenta).toBe(15);
    });

    it('dado sin baja rotacion, el promedio de dias deberia ser 0', () => {
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack([]);
      presenter.inicializar();

      expect(presenter.resumen.promedioDiasSinVenta).toBe(0);
    });
  });

  describe('principalesOportunidadesAgregar', () => {
    it('deberia ordenar por totalRevenue descendente y devolver hasta 5', () => {
      const listas = Array.from({ length: 6 }, (_, i) =>
        SugerenciaAgregarMother.crear({
          id: `op-${i}`,
          metadata: {
            totalSales: 0,
            productName: `P${i}`,
            productPrice: 0,
            totalRevenue: i * 100,
            totalCustomers: 1,
          },
        }),
      );
      givenOportunidadesDelBack(listas);
      givenBajaRotacionDelBack([]);
      presenter.inicializar();

      const top = presenter.principalesOportunidadesAgregar;

      expect(top.length).toBe(5);
      expect(top[0].titulo).toBe('P5');
      expect(top[4].titulo).toBe('P1');
      expect(top[0].tono).toBe('exito');
      expect(top[0].valorMetricaPrincipal).toContain('$');
    });
  });

  describe('principalesBajaRotacion', () => {
    it('deberia ordenar por diasSinVenta desc y devolver hasta 5 con tono peligro cuando dias >= 10', () => {
      const listas = [5, 15, 3, 20, 8].map((dias, i) =>
        SugerenciaProductoMother.crear({
          productoOriginal: `Producto ${i}`,
          estadisticasVenta: {
            ...SugerenciaProductoMother.crear().estadisticasVenta,
            productoId: `prod-${i}`,
            diasSinVenta: dias,
            stockActual: i,
          },
        }),
      );
      givenOportunidadesDelBack([]);
      givenBajaRotacionDelBack(listas);
      presenter.inicializar();

      const top = presenter.principalesBajaRotacion;

      expect(top.length).toBe(5);
      expect(top[0].valorMetricaPrincipal).toBe('20');
      expect(top[0].tono).toBe('peligro');
      expect(top.at(-1)?.tono).toBe('advertencia');
    });
  });

  describe('formatearMoneda', () => {
    it('dado 1500, deberia devolverlo con simbolo $ y separador de miles', () => {
      const salida = presenter.formatearMoneda(1500);

      expect(salida).toContain('$');
      expect(salida).toContain('1');
      expect(salida).toContain('500');
    });
  });

  function givenOportunidadesDelBack(data: SugerenciaAgregarProducto[]): void {
    sugerenciasAgregarService.getSugerenciasAgregarProducto.and.returnValue(of(data));
  }

  function givenBajaRotacionDelBack(data: SugerenciaProducto[]): void {
    sugerenciasService.getSugerencias.and.returnValue(of(data));
  }

  function currentOportunidades(): SugerenciaAgregarProducto[] {
    let value: SugerenciaAgregarProducto[] = [];
    presenter.oportunidadesAgregar$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }

  function currentBajaRotacion(): SugerenciaProducto[] {
    let value: SugerenciaProducto[] = [];
    presenter.bajaRotacion$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }

  function currentLoadingAgregar(): boolean {
    let value = true;
    presenter.loadingAgregar$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }

  function currentLoadingRotacion(): boolean {
    let value = true;
    presenter.loadingRotacion$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }

  function currentErrorAgregar(): string | null {
    let value: string | null = null;
    presenter.errorAgregar$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }

  function currentErrorRotacion(): string | null {
    let value: string | null = null;
    presenter.errorRotacion$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }

  function currentModalAbierto(): boolean {
    let value = false;
    presenter.modalComboAbierto$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }

  function currentProductosSugeridos(): unknown[] {
    let value: unknown[] = [];
    presenter.productosSugeridos$.subscribe((v) => (value = v)).unsubscribe();
    return value;
  }
});
