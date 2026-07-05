import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProductoInventarioMother } from '../../../inventario/inventario.mother';
import { ProductoService } from '../../../inventario/services/producto.service';
import { RecomendacionProveedorMother } from '../../proveedores.mother';
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

    servicioProducto = jasmine.createSpyObj('ProductoService', ['getAll']);
    servicioProducto.getAll.and.returnValue(of([disponibleAgua, bajoStockJugo, disponibleAlfajor]));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
  });

  describe('carga inicial', () => {
    it('dado la page al iniciarse, cuando corre ngOnInit, deberia cargar productos y no auto-seleccionar', () => {
      build();
      whenMonto();

      expect(servicioProducto.getAll).toHaveBeenCalled();
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
      servicioProducto.getAll.and.returnValue(throwError(() => new Error('boom')));
      build();

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cargar productos para comparar',
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

  describe('volver', () => {
    it('dado la page, cuando llamo volver, deberia navegar a /kiosquero/proveedores', () => {
      build();
      whenMonto();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
