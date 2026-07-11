import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { BUFFET_ID_TEST, ProductoInventarioMother } from '../../../inventario/inventario.mother';
import { ProductoService } from '../../../inventario/services/producto.service';
import {
  RecomendacionProveedorMother,
  SupplierResponseMother,
  ListaPrecioProveedorMother,
  ItemListaPrecioMother,
} from '../../proveedores.mother';
import { SupplierService } from '../../services/supplier.service';
import { PurchaseRecommendationsPage } from './purchase-recommendations.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('PurchaseRecommendationsPage', () => {
  let component: PurchaseRecommendationsPage;
  let fixture: ComponentFixture<PurchaseRecommendationsPage>;
  let servicioSupplier: jasmine.SpyObj<SupplierService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let router: jasmine.SpyObj<Router>;

  const disponibleAgua = ProductoInventarioMother.crear({
    id: 'prod-agua',
    nombre: 'Agua Mineral',
    stockActual: 20,
    categoria: { id: 'cat-bebidas', descripcion: 'Bebidas' },
  });
  const bajoStockJugo = ProductoInventarioMother.crear({
    id: 'prod-jugo',
    nombre: 'Jugo Naranja',
    stockActual: 3,
    categoria: { id: 'cat-bebidas', descripcion: 'Bebidas' },
  });
  const disponibleAlfajor = ProductoInventarioMother.crear({
    id: 'prod-alfajor',
    nombre: 'Alfajor',
    stockActual: 15,
    categoria: { id: 'cat-golosinas', descripcion: 'Golosinas' },
  });

  function build(queryParams: Record<string, string> = {}): void {
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [PurchaseRecommendationsPage],
      providers: [
        { provide: SupplierService, useValue: servicioSupplier },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: ToastService, useValue: servicioToast },
        { provide: PerfilService, useValue: servicioPerfil },
        {
          provide: UsuarioService,
          useValue: jasmine.createSpyObj('UsuarioService', [], { nombreNavbar: signal('Kiosquero') }),
        },
        { provide: ActivatedRoute, useValue: { queryParams: of(queryParams) } },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(PurchaseRecommendationsPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PurchaseRecommendationsPage);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    servicioSupplier = jasmine.createSpyObj('SupplierService', [
      'getSuppliers',
      'getSupplierById',
      'createSupplier',
      'updateSupplier',
      'deleteSupplier',
      'uploadPriceList',
      'updateMapping',
      'getPurchaseRecommendations',
    ]);
    servicioSupplier.getPurchaseRecommendations.and.returnValue(
      of([RecomendacionProveedorMother.crear()]),
    );
    const mockSupplier = SupplierResponseMother.crear({
      listasPrecios: [
        ListaPrecioProveedorMother.crear({
          activa: true,
          items: [
            ItemListaPrecioMother.crear({ productoInventarioId: 'prod-agua', mappingConfirmado: true }),
            ItemListaPrecioMother.crear({ productoInventarioId: 'prod-jugo', mappingConfirmado: true }),
            ItemListaPrecioMother.crear({ productoInventarioId: 'prod-alfajor', mappingConfirmado: true }),
          ]
        })
      ]
    });
    servicioSupplier.getSuppliers.and.returnValue(of([mockSupplier]));

    servicioProducto = jasmine.createSpyObj('ProductoService', ['getAll', 'getAllByBuffetId']);
    servicioProducto.getAll.and.returnValue(of([disponibleAgua, bajoStockJugo, disponibleAlfajor]));
    servicioProducto.getAllByBuffetId.and.returnValue(of([disponibleAgua, bajoStockJugo, disponibleAlfajor]));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);
  });

  describe('carga inicial', () => {
    it('dado la page al iniciarse, cuando corre ngOnInit, deberia cargar productos y no auto-seleccionar', () => {
      build();
      whenMonto();

      expect(servicioProducto.getAllByBuffetId).toHaveBeenCalledWith(BUFFET_ID_TEST);
      expect(component.products().length).toBe(3);
      expect(component.selectedProductIds().size).toBe(0);
      expect(component.isLoading()).toBeFalse();
    });

    it('dado queryParam preselect=low-stock, cuando carga, deberia auto-seleccionar los productos con bajo stock', () => {
      build({ preselect: 'low-stock' });

      whenMonto();

      expect(component.selectedProductIds().has('prod-jugo')).toBeTrue();
      expect(component.selectedProductIds().has('prod-agua')).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/pre-seleccionaron 1 productos con bajo stock/),
        'info',
      );
    });

    it('dado que getAll falla, cuando se monta, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      servicioProducto.getAllByBuffetId.and.returnValue(throwError(() => new Error('boom')));
      build();

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cargar productos para comparar',
        'error',
      );
    });

    it('dado sin buffetId, cuando carga productos, no deberia consultar productos sin contexto de stock', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);
      build();

      whenMonto();

      expect(servicioProducto.getAllByBuffetId).not.toHaveBeenCalled();
      expect(servicioProducto.getAll).not.toHaveBeenCalled();
      expect(component.products()).toEqual([]);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No se pudo identificar el buffet para cargar el stock',
        'error',
      );
    });
  });

  describe('isLowStock', () => {
    it('dado stockActual <= 5, deberia devolver true', () => {
      build();
      expect(component.isLowStock(bajoStockJugo)).toBeTrue();
    });

    it('dado stockActual > 5, deberia devolver false', () => {
      build();
      expect(component.isLowStock(disponibleAgua)).toBeFalse();
    });

    it('dado stock null, deberia devolver false', () => {
      build();
      const productoSinStockConfigurado = {
        ...ProductoInventarioMother.crear({ stockActual: null as unknown as number }),
        stockDisponible: null,
        estadoInventario: null,
      };

      expect(component.isLowStock(productoSinStockConfigurado)).toBeFalse();
    });

    it('dado estadoInventario BAJO_STOCK, deberia devolver true', () => {
      build();
      const productoBajoStock = {
        ...disponibleAgua,
        stockActual: 20,
        stockDisponible: 20,
        estadoInventario: 'BAJO_STOCK',
      };

      expect(component.isLowStock(productoBajoStock)).toBeTrue();
    });
  });

  describe('formatStockLabel y stockBadgeLabel', () => {
    beforeEach(() => {
      build();
    });

    it('dado stock null, deberia mostrar stock no configurado y no mostrar badge', () => {
      const productoSinStockConfigurado = {
        ...ProductoInventarioMother.crear({ stockActual: null as unknown as number }),
        stockDisponible: null,
        estadoInventario: null,
      };

      expect(component.formatStockLabel(productoSinStockConfigurado)).toBe('Stock no configurado');
      expect(component.stockBadgeLabel(productoSinStockConfigurado)).toBeNull();
    });

    it('dado stock disponible bajo y minimo, deberia mostrar una leyenda clara', () => {
      const productoBajoStock = {
        ...bajoStockJugo,
        stockDisponible: 3,
        stockMinimo: 5,
        estadoInventario: 'BAJO_STOCK',
      };

      expect(component.formatStockLabel(productoBajoStock)).toBe('Disponible: 3 un. / minimo 5');
      expect(component.stockBadgeLabel(productoBajoStock)).toBe('Bajo stock');
    });

    it('dado estadoInventario SIN_STOCK, deberia mostrar sin stock', () => {
      const productoSinStock = {
        ...bajoStockJugo,
        stockActual: 0,
        stockDisponible: 0,
        estadoInventario: 'SIN_STOCK',
      };

      expect(component.formatStockLabel(productoSinStock)).toBe('Sin stock');
      expect(component.stockBadgeLabel(productoSinStock)).toBe('Sin stock');
    });
  });

  describe('categories y filteredProducts (computed)', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado productos con categorias, categories deberia deduplicar por categoriaId', () => {
      const cats = component.categories();

      expect(cats.length).toBe(2);
      expect(cats.map((c) => c.id).sort()).toEqual(['cat-bebidas', 'cat-golosinas']);
    });

    it('dado searchQuery vacio y categoria TODAS, filteredProducts deberia devolver todos', () => {
      expect(component.filteredProducts().length).toBe(3);
    });

    it('dado searchQuery "jugo", filteredProducts deberia matchear por nombre (case insensitive)', () => {
      component.searchQuery.set('JUGO');

      const list = component.filteredProducts();

      expect(list.length).toBe(1);
      expect(list[0].id).toBe('prod-jugo');
    });

    it('dado selectedCategory bebidas, filteredProducts deberia dejar solo los de esa categoria', () => {
      component.selectedCategory.set('cat-bebidas');

      const list = component.filteredProducts();

      expect(list.length).toBe(2);
      expect(list.map((p) => p.id).sort()).toEqual(['prod-agua', 'prod-jugo']);
    });
  });

  describe('seleccion de productos', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un productId no seleccionado, cuando lo toggleo, deberia agregarlo', () => {
      component.toggleProductSelection('prod-agua');

      expect(component.isProductSelected('prod-agua')).toBeTrue();
    });

    it('dado un productId ya seleccionado, cuando lo toggleo, deberia sacarlo', () => {
      component.toggleProductSelection('prod-agua');

      component.toggleProductSelection('prod-agua');

      expect(component.isProductSelected('prod-agua')).toBeFalse();
    });

    it('dado un click en selectAll, deberia seleccionar todos los filteredProducts', () => {
      component.selectAll();

      expect(component.selectedProductIds().size).toBe(3);
    });

    it('dado un click en selectAllLowStock, deberia sumar los que estan bajos', () => {
      component.selectAllLowStock();

      expect(component.selectedProductIds().has('prod-jugo')).toBeTrue();
      expect(component.selectedProductIds().has('prod-agua')).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Productos visibles con bajo stock seleccionados',
        'success',
      );
    });

    it('dado una seleccion, cuando llamo clearSelection, deberia dejar todo vacio y limpiar recommendations', () => {
      component.selectAll();
      component.recommendations.set([RecomendacionProveedorMother.crear()]);

      component.clearSelection();

      expect(component.selectedProductIds().size).toBe(0);
      expect(component.recommendations().length).toBe(0);
    });
  });

  describe('getRecommendations', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado sin productos seleccionados, cuando llamo, deberia mostrar toast de error y no llamar al service', () => {
      component.getRecommendations();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Seleccioná al menos un producto para cotizar',
        'error',
      );
      expect(servicioSupplier.getPurchaseRecommendations).not.toHaveBeenCalled();
    });

    it('dado productos seleccionados, cuando pido recomendaciones, deberia llamar al service con esos ids y setear el signal', () => {
      component.toggleProductSelection('prod-jugo');
      component.toggleProductSelection('prod-agua');

      component.getRecommendations();

      expect(servicioSupplier.getPurchaseRecommendations).toHaveBeenCalled();
      const ids = servicioSupplier.getPurchaseRecommendations.calls.mostRecent().args[0];
      expect(ids.sort()).toEqual(['prod-agua', 'prod-jugo']);
      expect(component.recommendations().length).toBe(1);
      expect(component.isFetchingRecommendations()).toBeFalse();
    });

    it('dado varias recomendaciones, cuando las recibo, deberia ordenar las cotizadas primero', () => {
      servicioSupplier.getPurchaseRecommendations.and.returnValue(
        of([
          RecomendacionProveedorMother.crear({
            productoInventarioId: 'p-1',
            proveedorRecomendadoId: '',
          }),
          RecomendacionProveedorMother.crear({
            productoInventarioId: 'p-2',
            proveedorRecomendadoId: 'sup-2',
          }),
        ]),
      );
      component.toggleProductSelection('prod-agua');

      component.getRecommendations();

      const list = component.recommendations();
      expect(list[0].productoInventarioId).toBe('p-2');
      expect(list[1].productoInventarioId).toBe('p-1');
    });

    it('dado que el service falla, deberia mostrar toast de error y dejar isFetching en false', () => {
      spyOn(console, 'error');
      servicioSupplier.getPurchaseRecommendations.and.returnValue(throwError(() => new Error('boom')));
      component.toggleProductSelection('prod-agua');

      component.getRecommendations();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cotizar mejores precios de compra',
        'error',
      );
      expect(component.isFetchingRecommendations()).toBeFalse();
    });
  });

  describe('accordion', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un productId, cuando toggleo el accordion, deberia expandirlo', () => {
      component.toggleAccordion('prod-agua');

      expect(component.isAccordionExpanded('prod-agua')).toBeTrue();
    });

    it('dado dos toggles seguidos, deberia colapsar de nuevo', () => {
      component.toggleAccordion('prod-agua');
      component.toggleAccordion('prod-agua');

      expect(component.isAccordionExpanded('prod-agua')).toBeFalse();
    });
  });

  describe('exportToCsv', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado sin recomendaciones, no deberia disparar la descarga', () => {
      const createSpy = spyOn(URL, 'createObjectURL');

      component.exportToCsv();

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('dado recomendaciones, deberia armar el blob, disparar la descarga y mostrar toast', () => {
      const createSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
      const revokeSpy = spyOn(URL, 'revokeObjectURL');
      const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');
      component.recommendations.set([RecomendacionProveedorMother.crear()]);

      component.exportToCsv();

      expect(createSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalledWith('blob:x');
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Reporte de Excel (CSV) descargado con éxito',
        'success',
      );
    });
  });

  describe('exportToPdf', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado sin recomendaciones, no deberia abrir la ventana', () => {
      const openSpy = spyOn(window, 'open');

      component.exportToPdf();

      expect(openSpy).not.toHaveBeenCalled();
    });

    it('dado que window.open devuelve null, deberia mostrar toast de error', () => {
      spyOn(window, 'open').and.returnValue(null);
      component.recommendations.set([RecomendacionProveedorMother.crear()]);

      component.exportToPdf();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/No se pudo abrir la ventana de impresión/),
        'error',
      );
    });

    it('dado recomendaciones, deberia abrir una ventana y escribir HTML con la tabla', () => {
      const write = jasmine.createSpy('write');
      const close = jasmine.createSpy('close');
      const fakeWindow = { document: { write, close } } as unknown as Window;
      spyOn(window, 'open').and.returnValue(fakeWindow);
      component.recommendations.set([
        RecomendacionProveedorMother.crear({ nombreProducto: 'Alfajor' }),
      ]);

      component.exportToPdf();

      expect(write).toHaveBeenCalled();
      expect(close).toHaveBeenCalled();
      const html = write.calls.mostRecent().args[0] as string;
      expect(html).toContain('Alfajor');
      expect(html).toContain('Reporte de Compras Recomendadas');
    });
  });

  describe('filtros y deshabilitados de mapeo', () => {
    it('dado productos, si uno no esta mapeado, isProductMapped deberia retornar false y no deberia dejar seleccionarlo', () => {
      build();
      whenMonto();
      // Remove prod-agua from mapped set manually to test unmapped behavior
      component.mappedProductIds.set(new Set(['prod-jugo', 'prod-alfajor']));
      
      expect(component.isProductMapped('prod-agua')).toBeFalse();
      expect(component.isProductMapped('prod-jugo')).toBeTrue();
      
      // selectAll shouldn't select prod-agua
      component.selectAll();
      expect(component.selectedProductIds().has('prod-agua')).toBeFalse();
      expect(component.selectedProductIds().has('prod-jugo')).toBeTrue();
    });

    it('dado filtro mappedFilter seteado a MAPEADOS, deberia ocultar los no mapeados', () => {
      build();
      whenMonto();
      // Only jugo and alfajor are mapped
      component.mappedProductIds.set(new Set(['prod-jugo', 'prod-alfajor']));
      
      expect(component.filteredProducts().length).toBe(3); // initially all since filter is TODOS
      
      component.mappedFilter.set('MAPEADOS');
      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(2);
      expect(filtered.find(p => p.id === 'prod-agua')).toBeUndefined();
    });

    it('dado una lista mixta de productos, filteredProducts deberia ordenar los mapeados primero', () => {
      build();
      whenMonto();
      // Only alfajor is mapped
      component.mappedProductIds.set(new Set(['prod-alfajor']));
      
      const filtered = component.filteredProducts();
      // Alfajor should be first
      expect(filtered[0].id).toBe('prod-alfajor');
      expect(filtered[1].id).not.toBe('prod-alfajor');
      expect(filtered[2].id).not.toBe('prod-alfajor');
    });
  });

  describe('volver', () => {
    it('dado la page, cuando llamo volver, deberia navegar a /kiosquero/proveedores', () => {
      build();
      whenMonto();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });
  });

  describe('modal de alternativas', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado el modal cerrado, cuando abro para un producto, deberia setear el activo y abrirlo', () => {
      const evento = new Event('click');
      const stopSpy = spyOn(evento, 'stopPropagation');

      component.openAlternativesModal('prod-agua', evento);

      expect(stopSpy).toHaveBeenCalled();
      expect(component.isAlternativesModalOpen()).toBeTrue();
      expect(component.activeAlternativesProductId()).toBe('prod-agua');
    });

    it('dado el modal abierto, cuando lo cierro sin evento, deberia cerrarlo y limpiar el activo', () => {
      component.openAlternativesModal('prod-agua', new Event('click'));

      component.closeAlternativesModal();

      expect(component.isAlternativesModalOpen()).toBeFalse();
      expect(component.activeAlternativesProductId()).toBeNull();
    });

    it('dado el modal abierto, cuando cierro con click en el overlay, deberia cerrarlo', () => {
      component.openAlternativesModal('prod-agua', new Event('click'));
      const overlay = document.createElement('div');
      overlay.classList.add('modal-overlay');
      const evento = { target: overlay } as unknown as Event;

      component.closeAlternativesModal(evento);

      expect(component.isAlternativesModalOpen()).toBeFalse();
    });

    it('dado el modal abierto, cuando el click viene de otro elemento, no deberia cerrarlo', () => {
      component.openAlternativesModal('prod-agua', new Event('click'));
      const dentro = document.createElement('div');
      const evento = { target: dentro } as unknown as Event;

      component.closeAlternativesModal(evento);

      expect(component.isAlternativesModalOpen()).toBeTrue();
    });
  });

  describe('chooseAlternative y helpers de chosen', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado una opcion, cuando la elijo, deberia guardarla en chosenRecommendations y cerrar el modal', () => {
      component.openAlternativesModal('prod-agua', new Event('click'));
      const opcion = {
        proveedorId: 'sup-1',
        nombreProveedor: 'Proveedor A',
        precio: 1000,
        unidad: '6x1L',
        precioUnitario: 166,
        isRecommended: false,
      };

      component.chooseAlternative('prod-agua', opcion);

      expect(component.getChosenSupplierName('prod-agua')).toBe('Proveedor A');
      expect(component.getChosenPrice('prod-agua')).toBe(1000);
      expect(component.getChosenUnit('prod-agua')).toBe('6x1L');
      expect(component.getChosenUnitPrice('prod-agua')).toBe(166);
      expect(component.hasChosenEquivalent('prod-agua')).toBeTrue();
      expect(component.isAlternativesModalOpen()).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/Se seleccionó la oferta de Proveedor A/),
        'success',
      );
    });

    it('dado sin chosen para el producto, los getters deberian devolver defaults vacios', () => {
      expect(component.getChosenSupplierName('prod-x')).toBe('');
      expect(component.getChosenPrice('prod-x')).toBe(0);
      expect(component.getChosenUnit('prod-x')).toBe('');
      expect(component.hasChosenEquivalent('prod-x')).toBeFalse();
    });

    it('dado un chosen cuyo precio unitario coincide con el precio, hasChosenEquivalent deberia ser false', () => {
      component.openAlternativesModal('prod-agua', new Event('click'));
      component.chooseAlternative('prod-agua', {
        proveedorId: 's',
        nombreProveedor: 'X',
        precio: 100,
        unidad: 'u',
        precioUnitario: 100,
        isRecommended: false,
      });

      expect(component.hasChosenEquivalent('prod-agua')).toBeFalse();
    });
  });

  describe('hasRecommendation / hasNoQuote / hasAlternatives', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado una recomendacion con proveedorRecomendadoId, hasRecommendation deberia ser true', () => {
      component.recommendations.set([
        RecomendacionProveedorMother.crear({ productoInventarioId: 'p1', proveedorRecomendadoId: 'sup' }),
      ]);

      expect(component.hasRecommendation('p1')).toBeTrue();
      expect(component.hasNoQuote('p1')).toBeFalse();
    });

    it('dado una recomendacion sin proveedor recomendado, hasNoQuote deberia ser true', () => {
      component.recommendations.set([
        RecomendacionProveedorMother.crear({ productoInventarioId: 'p1', proveedorRecomendadoId: '' }),
      ]);

      expect(component.hasRecommendation('p1')).toBeFalse();
      expect(component.hasNoQuote('p1')).toBeTrue();
    });

    it('dado una recomendacion con alternativas, hasAlternatives deberia ser true', () => {
      component.recommendations.set([
        RecomendacionProveedorMother.crear({
          productoInventarioId: 'p1',
          alternativas: [
            { proveedorId: 's1', nombreProveedor: 'A', precio: 100, unidad: 'u', precioUnitario: 100 },
          ],
        }),
      ]);

      expect(component.hasAlternatives('p1')).toBeTrue();
    });
  });

  describe('getAllOptionsForProduct e isCurrentChosenOption', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado una recomendacion con proveedor recomendado y alternativas, deberia devolver todas las opciones', () => {
      component.recommendations.set([
        RecomendacionProveedorMother.crear({
          productoInventarioId: 'p1',
          proveedorRecomendadoId: 'sup-rec',
          nombreProveedorRecomendado: 'Recomendado',
          mejorPrecio: 500,
          unidad: 'u',
          mejorPrecioUnitario: 500,
          alternativas: [
            { proveedorId: 'sup-alt', nombreProveedor: 'Alternativo', precio: 600, unidad: 'u', precioUnitario: 600 },
          ],
        }),
      ]);

      const opciones = component.getAllOptionsForProduct('p1');

      expect(opciones.length).toBe(2);
      expect(opciones[0].isRecommended).toBeTrue();
      expect(opciones[1].isRecommended).toBeFalse();
    });

    it('dado sin recomendacion, deberia devolver array vacio', () => {
      expect(component.getAllOptionsForProduct('inexistente')).toEqual([]);
    });

    it('dado un chosen y una opcion identica, isCurrentChosenOption deberia ser true', () => {
      component.openAlternativesModal('p1', new Event('click'));
      const opcion = {
        proveedorId: 's1',
        nombreProveedor: 'A',
        precio: 200,
        unidad: 'u',
        precioUnitario: 200,
        isRecommended: true,
      };
      component.chooseAlternative('p1', opcion);

      expect(component.isCurrentChosenOption('p1', opcion)).toBeTrue();
    });
  });

  describe('getActiveProductName', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un activeAlternativesProductId, deberia devolver el nombre del producto', () => {
      component.activeAlternativesProductId.set('prod-agua');

      expect(component.getActiveProductName()).toBe('Agua Mineral');
    });

    it('dado sin activeAlternativesProductId, deberia devolver string vacio', () => {
      expect(component.getActiveProductName()).toBe('');
    });
  });

  describe('loadSuppliersAndProducts (error branch)', () => {
    it('dado que getSuppliers falla, deberia mostrar toast pero igual cargar productos', () => {
      spyOn(console, 'error');
      servicioSupplier.getSuppliers.and.returnValue(throwError(() => new Error('boom')));
      build();

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cargar información de mapeos',
        'error',
      );
      expect(servicioProducto.getAllByBuffetId).toHaveBeenCalledWith(BUFFET_ID_TEST);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
