import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DatosFormularioProducto } from '../components/formulario-producto/formulario-producto.component';
import { Categoria } from '../models/categoria.interface';
import {
  EventoInventarioRealtime,
  ItemResumenInventario,
  MovimientoStockInventario,
} from '../models/inventario.interface';
import { Producto } from '../models/producto.interface';
import { InventarioRealtimeService } from '../services/inventario-realtime.service';
import { ProductoService } from '../services/producto.service';
import { InventarioPageComponent } from './inventario-page.component';

const ID_SIN_TACC = '15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8';
const ID_SIN_AZUCAR = '7e113952-93ca-4797-a80d-54f3a31b2165';
const ID_CONT_LACTEOS = 'a087290b-474e-4a8c-9e5d-ce1c375d4009';
const BUFFET_ID_TEST = 'buffet-test-123';

class CategoriaMother {
  static crear(override: Partial<Categoria> = {}): Categoria {
    return { id: 'c1', descripcion: 'Categoria 1', activo: true, ...override };
  }

  static crearVarias(): Categoria[] {
    return [CategoriaMother.crear(), CategoriaMother.crear({ id: 'c2', descripcion: 'Categoria 2' })];
  }
}

class ItemInventarioMother {
  static crearAlfajor(override: Partial<ItemResumenInventario> = {}): ItemResumenInventario {
    return {
      productId: '1',
      nombre: 'Alfajor',
      precio: 1200,
      tipoManejoInventario: 'STOCK_EXACTO',
      estadoInventario: 'DISPONIBLE',
      stockActual: 20,
      stockReservado: 3,
      stockDisponible: 17,
      stockMinimo: 5,
      cupoMaximoDiario: null,
      cupoDisponibleDia: null,
      disponible: true,
      bajoStock: false,
      agotado: false,
      ...override,
    };
  }

  static crearSandwich(override: Partial<ItemResumenInventario> = {}): ItemResumenInventario {
    return {
      productId: '2',
      nombre: 'Sandwich',
      precio: 2500,
      tipoManejoInventario: 'CUPO_DIARIO',
      estadoInventario: 'BAJO_STOCK',
      stockActual: 4,
      stockReservado: 1,
      stockDisponible: 3,
      stockMinimo: null,
      cupoMaximoDiario: 30,
      cupoDisponibleDia: 3,
      disponible: true,
      bajoStock: true,
      agotado: false,
      ...override,
    };
  }
}

class ProductoMother {
  static crear(override: Partial<Producto> = {}): Producto {
    return {
      id: '1',
      nombre: 'Producto 1',
      descripcion: 'Desc 1',
      precio: 100,
      peso: 1,
      requierePreparacion: false,
      stockActual: 10,
      categoria: { id: 'c1', descripcion: 'Categoria 1' },
      ...override,
    };
  }

  static crearNuevo(): Producto {
    return ProductoMother.crear({
      id: 'new-id',
      nombre: 'New Producto',
      descripcion: 'New Desc',
      categoriaId: 'c1',
    });
  }
}

class MovimientoStockMother {
  static crearHistorial(): MovimientoStockInventario[] {
    return [
      {
        id: 'movement-old',
        inventarioId: 'inventory-1',
        tipo: 'VENTA',
        cantidad: 2,
        cantidadAnterior: 10,
        cantidadNueva: 8,
        motivo: 'Consumo por venta presencial',
        usuarioId: 'usuario-1',
        compraId: 'compra-1',
        creadoEn: '2026-06-11T10:30:00',
      },
      {
        id: 'movement-new',
        inventarioId: 'inventory-1',
        tipo: 'AJUSTE',
        cantidad: 5,
        cantidadAnterior: 8,
        cantidadNueva: 13,
        motivo: 'Reposición manual',
        usuarioId: 'usuario-1',
        compraId: null,
        creadoEn: '2026-06-11T11:30:00',
      },
    ];
  }
}

class DatosFormularioMother {
  static crearBase(override: Partial<DatosFormularioProducto> = {}): DatosFormularioProducto {
    return {
      nombre: 'Producto Test',
      descripcion: 'Descripción test',
      precio: 100,
      peso: 1,
      stockActual: 10,
      categoriaId: 'c1',
      nuevaCategoriaNombre: '',
      requierePreparacion: false,
      contiene_azucar: false,
      contiene_mani: false,
      contiene_lactosa: false,
      contiene_tacc: false,
      ...override,
    };
  }
}

describe('InventarioPageComponent', () => {
  let component: InventarioPageComponent;
  let fixture: ComponentFixture<InventarioPageComponent>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioRealtime: jasmine.SpyObj<InventarioRealtimeService>;
  let activatedRoute: {
    snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> };
  };

  const categorias = CategoriaMother.crearVarias();
  const inventario: ItemResumenInventario[] = [
    ItemInventarioMother.crearAlfajor(),
    ItemInventarioMother.crearSandwich(),
  ];
  const productos: Producto[] = [
    ProductoMother.crear(),
    ProductoMother.crear({
      id: '2',
      nombre: 'Producto 2',
      descripcion: 'Desc 2',
      precio: 200,
      peso: 2,
      requierePreparacion: true,
      stockActual: 20,
      categoria: undefined,
    }),
  ];
  const movimientosStock = MovimientoStockMother.crearHistorial();

  beforeEach(async () => {
    servicioProducto = jasmine.createSpyObj('ProductoService', [
      'getCategories',
      'getInventoryOverview',
      'updateInventoryStock',
      'getProductStockMovements',
      'getById',
      'create',
      'update',
      'delete',
    ]);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId', 'getPerfil']);
    servicioRealtime = jasmine.createSpyObj('InventarioRealtimeService', [
      'connect',
      'recordRefetch',
    ]);

    servicioProducto.getCategories.and.returnValue(of(categorias));
    servicioProducto.getInventoryOverview.and.returnValue(of(inventario));
    servicioProducto.updateInventoryStock.and.returnValue(of({ ok: true }));
    servicioProducto.getProductStockMovements.and.returnValue(of(movimientosStock));
    servicioProducto.create.and.returnValue(of(ProductoMother.crearNuevo()));
    servicioProducto.getById.and.returnValue(of(productos[0]));
    servicioProducto.update.and.returnValue(of(productos[0]));
    servicioProducto.delete.and.returnValue(of(void 0));
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);
    servicioPerfil.getPerfil.and.returnValue(null);
    servicioRealtime.connect.and.returnValue(new AbortController());
    activatedRoute = { snapshot: { queryParamMap: convertToParamMap({}) } };

    await TestBed.configureTestingModule({
      imports: [InventarioPageComponent],
      providers: [
        { provide: ProductoService, useValue: servicioProducto },
        { provide: ToastService, useValue: servicioToast },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: InventarioRealtimeService, useValue: servicioRealtime },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRoute },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventarioPageComponent);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado el componente, cuando se monta, deberia crearse', () => {
      expect(component).toBeTruthy();
    });

    it('dado un buffetId en el perfil, cuando inicializo, deberia cargar categorias, overview y conectar SSE', () => {
      whenMonto();

      expect(servicioProducto.getCategories).toHaveBeenCalled();
      expect(servicioProducto.getInventoryOverview).toHaveBeenCalledWith(BUFFET_ID_TEST);
      expect(servicioRealtime.connect).toHaveBeenCalled();
      expect(component.categories).toEqual(categorias);
      expect(component.products).toEqual(inventario);
    });

    it('dado un productId en el query param, cuando inicializo, deberia abrir el modal de gestion y resaltar el producto', () => {
      activatedRoute.snapshot.queryParamMap = convertToParamMap({
        productId: inventario[1].productId,
      });

      whenMonto();

      expect(component.inventoryManagementTarget).toEqual(inventario[1]);
      expect(component.getInventoryManagementMode()).toBe('CUPO_DIARIO');
      expect(component.highlightedProductIds.has(inventario[1].productId)).toBeTrue();
    });

    it('dado datos de producto en query params, cuando inicializo, deberia abrir el alta simple precompletada', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');
      activatedRoute.snapshot.queryParamMap = convertToParamMap({
        origen: 'oportunidad-stock',
        nombreProducto: 'Prod C',
        precioProducto: '400',
      });

      whenMonto();

      expect(component.isFormVisible).toBeTrue();
      expect(component.selectedProduct).toBeNull();
      expect(component.datosInicialesProducto).toEqual({
        nombre: 'Prod C',
        descripcion: 'Producto sugerido para incorporar al stock.',
        precio: 400,
        peso: 0,
        stockActual: 0,
      });
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: {
          origen: null,
          nombreProducto: null,
          precioProducto: null,
        },
        queryParamsHandling: 'merge',
      });
    });

    it('dado que falla la carga del inventario, deberia mostrar toast de error y dejar isLoading en false', () => {
      servicioProducto.getInventoryOverview.and.returnValue(throwError(() => new Error('API Error')));

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al cargar el inventario', 'error');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('eventos SSE', () => {
    it('dado un evento PURCHASE_CREATED, deberia mostrar el toast con el total formateado', () => {
      whenMonto();
      const handlers = servicioRealtime.connect.calls.mostRecent().args[1] as {
        onPurchaseCreated: (event: EventoInventarioRealtime) => void;
      };
      const totalEsperado = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(2500);

      handlers.onPurchaseCreated({
        buffetId: BUFFET_ID_TEST,
        type: 'PURCHASE_CREATED',
        occurredAt: new Date().toISOString(),
        message: 'Pedido realizado',
        purchaseTotal: 2500,
      });

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        `Pedido realizado - Total: ${totalEsperado}`,
        'success',
      );
    });

    it('dado un evento STOCK_CHANGED, deberia resaltar temporalmente el producto por 3 segundos', fakeAsync(() => {
      whenMonto();
      const handlers = servicioRealtime.connect.calls.mostRecent().args[1] as {
        onRefresh: (event: EventoInventarioRealtime) => void;
      };

      handlers.onRefresh({
        buffetId: BUFFET_ID_TEST,
        type: 'STOCK_CHANGED',
        productId: inventario[0].productId,
        stockActual: 18,
        stockReservado: 3,
        stockDisponible: 15,
        estadoInventario: 'DISPONIBLE',
        tipoManejoInventario: 'STOCK_EXACTO',
        occurredAt: new Date().toISOString(),
      });

      expect(component.highlightedProductIds.has(inventario[0].productId)).toBeTrue();

      tick(3000);

      expect(component.highlightedProductIds.has(inventario[0].productId)).toBeFalse();
    }));
  });

  describe('filtros y busqueda', () => {
    beforeEach(() => {
      component.products = inventario;
    });

    it('dado el filtro BAJO_STOCK, deberia dejar solo los productos con bajoStock true', () => {
      component.setFilter('BAJO_STOCK');

      expect(component.filteredProducts).toEqual([inventario[1]]);
    });

    it('dado un searchQuery por nombre, deberia filtrar por match parcial', () => {
      component.searchQuery = 'alfa';

      expect(component.filteredProducts).toEqual([inventario[0]]);
    });

    it('dado busqueda y filtro combinados, deberia aplicar la interseccion', () => {
      component.searchQuery = 'sand';
      component.setFilter('BAJO_STOCK');

      expect(component.filteredProducts).toEqual([inventario[1]]);
    });

    it('dado un producto con alta reserva, el filtro ALTA_RESERVA deberia dejar solo ese', () => {
      const altaReserva = ItemInventarioMother.crearAlfajor({
        productId: 'alta-reserva',
        stockDisponible: 3,
        stockReservado: 4,
      });
      component.products = [inventario[0], altaReserva];

      component.setFilter('ALTA_RESERVA');

      expect(component.filteredProducts).toEqual([altaReserva]);
    });

    it('dado un producto pausado, el filtro PAUSADO deberia dejar solo ese', () => {
      const pausado = ItemInventarioMother.crearAlfajor({
        productId: 'pausado',
        nombre: 'Producto no disponible',
        estadoInventario: 'DESACTIVADO',
        disponible: false,
        agotado: false,
      });
      component.products = [...inventario, pausado];

      component.setFilter('PAUSADO');

      expect(component.filteredProducts).toEqual([pausado]);
      expect(component.pausadosCount).toBe(1);
    });

    it('dado inventario cargado, deberia calcular disponibles y reservados', () => {
      expect(component.disponiblesCount).toBe(2);
      expect(component.reservadosCount).toBe(4);
      expect(component.altaReservaCount).toBe(0);
    });
  });

  describe('formulario individual', () => {
    it('dado el componente, cuando llamo openIndividualForm, deberia dejar selectedProduct null y mostrar el form', () => {
      component.openIndividualForm();

      expect(component.selectedProduct).toBeNull();
      expect(component.isFormVisible).toBeTrue();
    });

    it('dado un producto, cuando llamo openEditForm, deberia asignarlo y mostrar el form', () => {
      component.openEditForm(productos[0]);

      expect(component.selectedProduct).toEqual(productos[0]);
      expect(component.isFormVisible).toBeTrue();
    });

    it('dado un formulario nuevo, cuando lo envio, deberia crear el producto y recargar la lista', () => {
      const spyLoadProducts = spyOn(component, 'loadProducts');
      component.selectedProduct = null;

      component.handleFormSubmit(DatosFormularioMother.crearBase());

      expect(servicioProducto.create).toHaveBeenCalled();
      expect(servicioProducto.create.calls.mostRecent().args[0].buffetId).toBe(BUFFET_ID_TEST);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Producto creado exitosamente',
        'success',
      );
      expect(component.isFormVisible).toBeFalse();
      expect(spyLoadProducts).toHaveBeenCalled();
    });

    it('dado que la creacion falla, deberia mostrar el toast de error', () => {
      servicioProducto.create.and.returnValue(throwError(() => new Error()));
      component.selectedProduct = null;

      component.handleFormSubmit(DatosFormularioMother.crearBase());

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al crear el producto', 'error');
    });

    it('dado un producto en edicion, cuando envio el form, deberia actualizarlo', () => {
      component.selectedProduct = productos[0];

      component.handleFormSubmit(DatosFormularioMother.crearBase());

      expect(servicioProducto.update).toHaveBeenCalled();
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Producto actualizado exitosamente',
        'success',
      );
    });

    it('dado que la actualizacion falla, deberia mostrar el toast de error', () => {
      servicioProducto.update.and.returnValue(throwError(() => new Error()));
      component.selectedProduct = productos[0];

      component.handleFormSubmit(DatosFormularioMother.crearBase());

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al actualizar el producto',
        'error',
      );
    });

    it('dado un producto en deleteTarget, cuando confirmo delete, deberia eliminarlo y sacarlo de la lista', () => {
      component.products = [...inventario];
      component.deleteTarget = productos[0];

      component.confirmDelete();

      expect(servicioProducto.delete).toHaveBeenCalledWith(productos[0].id);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Producto eliminado correctamente',
        'success',
      );
      expect(component.products.length).toBe(1);
    });
  });

  describe('buildHealthClassificationIds', () => {
    it('dado un producto sin TACC, sin azucar y sin lacteos, deberia incluir Sin TACC y Sin Azucar', () => {
      component.selectedProduct = null;
      component.handleFormSubmit(
        DatosFormularioMother.crearBase({ contiene_tacc: false, contiene_azucar: false, contiene_lactosa: false }),
      );

      const payload = servicioProducto.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).toContain(ID_SIN_TACC);
      expect(payload.clasificacionesSaludIds).toContain(ID_SIN_AZUCAR);
      expect(payload.clasificacionesSaludIds).not.toContain(ID_CONT_LACTEOS);
    });

    it('dado un producto con TACC, no deberia incluir la clasificacion Sin TACC', () => {
      component.selectedProduct = null;
      component.handleFormSubmit(
        DatosFormularioMother.crearBase({ contiene_tacc: true }),
      );

      const payload = servicioProducto.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_TACC);
    });

    it('dado un producto con azucar, no deberia incluir la clasificacion Sin Azucar', () => {
      component.selectedProduct = null;
      component.handleFormSubmit(
        DatosFormularioMother.crearBase({ contiene_azucar: true }),
      );

      const payload = servicioProducto.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_AZUCAR);
    });

    it('dado un producto con lacteos, deberia incluir la clasificacion Contiene Lacteos', () => {
      component.selectedProduct = null;
      component.handleFormSubmit(
        DatosFormularioMother.crearBase({ contiene_lactosa: true }),
      );

      const payload = servicioProducto.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).toContain(ID_CONT_LACTEOS);
    });

    it('dado un producto con TACC y azucar sin lacteos, no deberia incluir ninguna de las 3 relevantes', () => {
      component.selectedProduct = null;
      component.handleFormSubmit(
        DatosFormularioMother.crearBase({
          contiene_tacc: true,
          contiene_azucar: true,
          contiene_lactosa: false,
        }),
      );

      const payload = servicioProducto.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_TACC);
      expect(payload.clasificacionesSaludIds).not.toContain(ID_SIN_AZUCAR);
      expect(payload.clasificacionesSaludIds).not.toContain(ID_CONT_LACTEOS);
    });

    it('dado el mismo producto, deberia enviar las mismas clasificaciones al crear y al actualizar', () => {
      const datos = DatosFormularioMother.crearBase({ contiene_lactosa: true });

      component.selectedProduct = null;
      component.handleFormSubmit(datos);
      const payloadCreate = servicioProducto.create.calls.mostRecent().args[0];

      component.selectedProduct = productos[0];
      component.handleFormSubmit(datos);
      const payloadUpdate = servicioProducto.update.calls.mostRecent().args[1];

      expect(payloadCreate.clasificacionesSaludIds).toEqual(payloadUpdate.clasificacionesSaludIds);
    });
  });

  describe('historial de stock', () => {
    it('dado un producto, cuando abro el historial, deberia pedirlo y ordenarlo desc por fecha', () => {
      whenMonto();

      component.openStockHistory(inventario[0]);

      expect(servicioProducto.getProductStockMovements).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        inventario[0].productId,
      );
      expect(component.stockMovementTarget).toEqual(inventario[0]);
      expect(component.stockMovements.map((m) => m.id)).toEqual([
        'movement-new',
        'movement-old',
      ]);
      expect(component.isLoadingStockMovements).toBeFalse();
    });

    it('dado el historial abierto, cuando cierro, deberia limpiar target y movimientos', () => {
      whenMonto();
      component.openStockHistory(inventario[0]);

      component.closeStockHistory();

      expect(component.stockMovementTarget).toBeNull();
      expect(component.stockMovements).toEqual([]);
      expect(component.isLoadingStockMovements).toBeFalse();
    });

    it('dado que falla la carga del historial, deberia mostrar el toast de error', () => {
      servicioProducto.getProductStockMovements.and.returnValue(
        throwError(() => new Error('API Error')),
      );

      whenMonto();
      component.openStockHistory(inventario[0]);

      expect(component.stockMovements).toEqual([]);
      expect(component.isLoadingStockMovements).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No se pudo cargar el historial del producto',
        'error',
      );
    });
  });

  describe('gestion de inventario', () => {
    it('dado un producto pausado en modo DISPONIBLE_NO_DISPONIBLE, cuando cambio a STOCK_EXACTO, deberia reutilizar stockActual y stockMinimo', () => {
      servicioPerfil.getPerfil.and.returnValue({
        id: 'usuario-123',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        rol: 'VENDEDOR',
      });
      const pausado = ItemInventarioMother.crearAlfajor({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        estadoInventario: 'DESACTIVADO',
        disponible: false,
        stockActual: 15,
        stockMinimo: 5,
      });

      whenMonto();
      component.openInventoryManagement(pausado);
      component.inventoryManagementForm.patchValue({
        tipoManejoInventario: 'STOCK_EXACTO',
        motivo: '',
      });
      component.onInventoryModeChange();
      component.submitInventoryManagement();

      expect(servicioProducto.updateInventoryStock).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        pausado.productId,
        {
          tipoManejoInventario: 'STOCK_EXACTO',
          disponible: true,
          estadoInventario: 'DISPONIBLE',
          stockActual: 15,
          stockMinimo: 5,
          motivo: 'Volver a stock exacto',
          usuarioId: 'usuario-123',
        },
      );
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Inventario actualizado', 'success');
    });

    it('dado el modal de gestion abierto, cuando aplico atajo PAUSE, deberia enviar DESACTIVADO', () => {
      whenMonto();
      component.openInventoryManagement(inventario[0]);

      component.applyInventoryManagementShortcut('PAUSE');
      component.submitInventoryManagement();

      expect(servicioProducto.updateInventoryStock).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        inventario[0].productId,
        {
          tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
          disponible: false,
          estadoInventario: 'DESACTIVADO',
          motivo: 'Pausado temporalmente',
        },
      );
    });

    it('dado el modal en modo DISPONIBLE_NO_DISPONIBLE, cuando lo envio, no deberia pisar stock', () => {
      whenMonto();
      component.openInventoryManagement(inventario[0]);
      component.inventoryManagementForm.patchValue({
        tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
        disponible: false,
        motivo: 'Pausado temporalmente',
      });

      component.submitInventoryManagement();

      expect(servicioProducto.updateInventoryStock).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        inventario[0].productId,
        {
          tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
          disponible: false,
          estadoInventario: 'DESACTIVADO',
          motivo: 'Pausado temporalmente',
        },
      );
    });

    it('dado un usuario logueado y un producto pausado, cuando aplico MAKE_AVAILABLE, deberia incluir el usuarioId', () => {
      servicioPerfil.getPerfil.and.returnValue({
        id: 'usuario-123',
        email: 'test@example.com',
        nombre: 'Test',
        apellido: 'User',
        rol: 'VENDEDOR',
      });

      whenMonto();
      component.openInventoryManagement(
        ItemInventarioMother.crearAlfajor({ estadoInventario: 'DESACTIVADO', disponible: false }),
      );
      component.applyInventoryManagementShortcut('MAKE_AVAILABLE');
      component.submitInventoryManagement();

      expect(servicioProducto.updateInventoryStock).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        inventario[0].productId,
        {
          tipoManejoInventario: 'DISPONIBLE_NO_DISPONIBLE',
          disponible: true,
          estadoInventario: 'DISPONIBLE',
          motivo: 'Producto disponible',
          usuarioId: 'usuario-123',
        },
      );
    });

    it('dado un producto STOCK_EXACTO, cuando aplico atajo SOLD_OUT, deberia setear stockActual 0', () => {
      whenMonto();
      component.openInventoryManagement(inventario[0]);

      component.applyInventoryManagementShortcut('SOLD_OUT');
      component.submitInventoryManagement();

      expect(servicioProducto.updateInventoryStock).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        inventario[0].productId,
        {
          tipoManejoInventario: 'STOCK_EXACTO',
          disponible: true,
          estadoInventario: 'SIN_STOCK',
          stockActual: 0,
          stockMinimo: 5,
          motivo: 'Marcar agotado',
        },
      );
    });

    it('dado un producto CUPO_DIARIO, cuando aplico atajo SOLD_OUT, deberia setear cupoMaximoDiario 0', () => {
      whenMonto();
      component.openInventoryManagement(inventario[1]);

      component.applyInventoryManagementShortcut('SOLD_OUT');
      component.submitInventoryManagement();

      expect(servicioProducto.updateInventoryStock).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        inventario[1].productId,
        {
          tipoManejoInventario: 'CUPO_DIARIO',
          disponible: true,
          estadoInventario: 'SIN_STOCK',
          cupoMaximoDiario: 0,
          motivo: 'Marcar agotado',
        },
      );
    });

    it('dado un error 409 con code STOCK_INSUFFICIENT, cuando envio la gestion, deberia mapear el mensaje', () => {
      const error = new HttpErrorResponse({
        status: 409,
        error: { code: 'STOCK_INSUFFICIENT', mensaje: 'No hay stock suficiente...' },
      });
      servicioProducto.updateInventoryStock.and.returnValue(throwError(() => error));

      whenMonto();
      component.openInventoryManagement(inventario[0]);
      component.inventoryManagementForm.patchValue({ stockActual: 0 });
      component.submitInventoryManagement();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('No hay stock suficiente.', 'error');
    });
  });

  describe('busqueda y navegacion adicionales', () => {
    it('dado un input con valor, setSearchQuery deberia setearlo; sin target no deberia romper', () => {
      const input = document.createElement('input');
      input.value = 'alfa';

      component.setSearchQuery({ target: input } as unknown as Event);
      expect(component.searchQuery).toBe('alfa');

      component.setSearchQuery({ target: null } as unknown as Event);
      expect(component.searchQuery).toBe('');
    });

    it('dado un searchQuery seteado, cuando llamo clearSearchQuery, deberia vaciarlo', () => {
      component.searchQuery = 'algo';

      component.clearSearchQuery();

      expect(component.searchQuery).toBe('');
    });

    it('cuando llamo irAComparador, deberia navegar a /kiosquero/proveedores/comparador con preselect low-stock', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');

      component.irAComparador();

      expect(navigateSpy).toHaveBeenCalledWith(['/kiosquero/proveedores/comparador'], {
        queryParams: { preselect: 'low-stock' },
      });
    });
  });

  describe('filtros DISPONIBLE y AGOTADO', () => {
    beforeEach(() => {
      component.products = [
        ItemInventarioMother.crearAlfajor({ productId: 'p-disp', disponible: true, agotado: false, estadoInventario: 'DISPONIBLE' }),
        ItemInventarioMother.crearAlfajor({ productId: 'p-ago', disponible: false, agotado: true, estadoInventario: 'SIN_STOCK', stockActual: 0 }),
      ];
    });

    it('dado el filtro DISPONIBLE, deberia dejar solo los productos disponibles', () => {
      component.setFilter('DISPONIBLE');

      expect(component.filteredProducts.map((p) => p.productId)).toEqual(['p-disp']);
    });

    it('dado el filtro AGOTADO, deberia dejar solo los productos agotados', () => {
      component.setFilter('AGOTADO');

      expect(component.filteredProducts.map((p) => p.productId)).toEqual(['p-ago']);
    });
  });

  describe('acciones de creacion/edicion desde overview', () => {
    it('cuando llamo openCreateForm, deberia abrir el formulario individual sin producto seleccionado', () => {
      component.openCreateForm();

      expect(component.isFormVisible).toBeTrue();
      expect(component.selectedProduct).toBeNull();
    });

    it('dado openEditFormFromInventory, deberia pedir el detalle y abrir el form con el producto', () => {
      whenMonto();
      component.openEditFormFromInventory(inventario[0]);

      expect(servicioProducto.getById).toHaveBeenCalledWith(inventario[0].productId);
      expect(component.isFormVisible).toBeTrue();
    });

    it('dado openEditFormFromInventory con getById que falla, deberia mostrar toast de error', () => {
      servicioProducto.getById.and.returnValue(throwError(() => new Error('Not found')));

      component.openEditFormFromInventory(inventario[0]);

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al cargar el producto', 'error');
    });
  });

  describe('delete flows', () => {
    beforeEach(() => whenMonto());

    it('dado requestDelete con un producto, deberia setearlo como target', () => {
      component.requestDelete(productos[0]);

      expect(component.deleteTarget).toEqual(productos[0]);
    });

    it('dado requestDeleteFromInventory con un item, deberia setearlo como target normalizado', () => {
      component.requestDeleteFromInventory(inventario[0]);

      expect(component.deleteTarget?.id).toBe(inventario[0].productId);
    });

    it('dado cancelDelete, deberia limpiar el target', () => {
      component.deleteTarget = productos[0];

      component.cancelDelete();

      expect(component.deleteTarget).toBeNull();
    });

    it('dado que confirmDelete falla, deberia mostrar toast de error', () => {
      servicioProducto.delete.and.returnValue(throwError(() => new Error('boom')));
      component.deleteTarget = productos[0];

      component.confirmDelete();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al eliminar el producto', 'error');
    });

    it('dado confirmDelete sin target, no deberia llamar al service', () => {
      component.deleteTarget = null;

      component.confirmDelete();

      expect(servicioProducto.delete).not.toHaveBeenCalled();
    });
  });

  describe('branches puntuales', () => {
    it('dado un producto sin stockReservado, reservadosCount deberia caer al fallback 0', () => {
      component.products = [
        ItemInventarioMother.crearAlfajor({ productId: 'p1', stockReservado: null as unknown as number }),
      ];

      expect(component.reservadosCount).toBe(0);
    });

    it('dado un producto sin stockActual definido, normalizeEditableProduct via openEditFormFromInventory no deberia romper', () => {
      whenMonto();
      servicioProducto.getById.and.returnValue(of(ProductoMother.crear({ stockActual: null as unknown as number })));

      component.openEditFormFromInventory(inventario[0]);

      expect(component.selectedProduct).toBeTruthy();
    });

    it('dado un evento PURCHASE_CREATED sin message ni total, deberia mostrar "Nueva compra"', () => {
      whenMonto();
      const handlers = servicioRealtime.connect.calls.mostRecent().args[1] as {
        onPurchaseCreated: (event: EventoInventarioRealtime) => void;
      };

      handlers.onPurchaseCreated({
        buffetId: BUFFET_ID_TEST,
        type: 'PURCHASE_CREATED',
        occurredAt: new Date().toISOString(),
      });

      expect(servicioToast.mostrar).toHaveBeenCalledWith(jasmine.stringMatching(/Nueva compra/), 'success');
    });

    it('dado un producto no en overview, cuando llega STOCK_CHANGED con productId distinto al target del historial, no deberia recargar el historial', fakeAsync(() => {
      whenMonto();
      const handlers = servicioRealtime.connect.calls.mostRecent().args[1] as {
        onRefresh: (event: EventoInventarioRealtime) => void;
      };
      servicioProducto.getProductStockMovements.calls.reset();

      handlers.onRefresh({
        buffetId: BUFFET_ID_TEST,
        type: 'STOCK_CHANGED',
        productId: 'inexistente-en-overview',
        occurredAt: new Date().toISOString(),
      });

      tick(3000);

      expect(servicioProducto.getProductStockMovements).not.toHaveBeenCalled();
    }));
  });

  describe('errores de perfil sin buffetId', () => {
    it('dado sin buffetId al montar, cuando cargo el inventario, deberia mostrar toast de error', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);

      whenMonto();
      component.loadProducts();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/buffet/i),
        'error',
      );
    });

    it('dado que getCategories falla, deberia mostrar el toast de error', () => {
      servicioProducto.getCategories.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(jasmine.stringMatching(/categor/i), 'error');
    });
  });

  describe('getInventoryErrorMessage', () => {
    it('dado un HttpErrorResponse con status 403 y sin code conocido, deberia devolver el mensaje de permisos', () => {
      const mensaje = invocarGetInventoryErrorMessage(
        new HttpErrorResponse({ status: 403, statusText: 'Forbidden' }),
      );

      expect(mensaje).toContain('permisos');
    });

    it('dado un HttpErrorResponse con status 404 y sin code conocido, deberia devolver el mensaje de no encontrado', () => {
      const mensaje = invocarGetInventoryErrorMessage(
        new HttpErrorResponse({ status: 404, statusText: 'Not Found' }),
      );

      expect(mensaje).toContain('encontr');
    });

    it('dado un HttpErrorResponse con status 400 y sin code conocido, deberia devolver el mensaje de datos ingresados', () => {
      const mensaje = invocarGetInventoryErrorMessage(
        new HttpErrorResponse({ status: 400, statusText: 'Bad Request' }),
      );

      expect(mensaje).toContain('datos');
    });

    it('dado un error que no es HttpErrorResponse, deberia devolver el mensaje generico', () => {
      const mensaje = invocarGetInventoryErrorMessage(new Error('otro'));

      expect(mensaje).toContain('inesperado');
    });

    it('dado un HttpErrorResponse con code conocido en el body, deberia devolver el mensaje mapeado', () => {
      const mensaje = invocarGetInventoryErrorMessage(
        new HttpErrorResponse({ status: 409, error: { code: 'STOCK_INSUFFICIENT' } }),
      );

      expect(mensaje).toContain('stock');
    });

    function invocarGetInventoryErrorMessage(error: unknown): string {
      whenMonto();
      const priv = component as unknown as { getInventoryErrorMessage(e: unknown): string };
      return priv.getInventoryErrorMessage(error);
    }
  });

  describe('setDefaultInventoryManagementMotivo con modo desconocido', () => {
    it('dado un modo sin motivo default mapeado, deberia patchear motivo con string vacio', () => {
      whenMonto();
      const priv = component as unknown as {
        setDefaultInventoryManagementMotivo(): void;
        getInventoryManagementMode(): string;
        inventoryManagementForm: { patchValue: (v: unknown) => void; get(name: string): { value: unknown } | null };
      };
      spyOn(priv, 'getInventoryManagementMode').and.returnValue('MODO_INEXISTENTE' as never);
      spyOn(priv.inventoryManagementForm, 'patchValue');

      priv.setDefaultInventoryManagementMotivo();

      expect(priv.inventoryManagementForm.patchValue).toHaveBeenCalledWith({ motivo: '' });
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
