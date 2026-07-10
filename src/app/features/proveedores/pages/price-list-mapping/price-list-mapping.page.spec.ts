import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProductoInventarioMother } from '../../../inventario/inventario.mother';
import { ProductoService } from '../../../inventario/services/producto.service';
import {
  ItemListaPrecioMother,
  ListaPrecioProveedorMother,
  SUPPLIER_ID_TEST,
  SupplierResponseMother,
} from '../../proveedores.mother';
import { SupplierService } from '../../services/supplier.service';
import { PriceListMappingPage } from './price-list-mapping.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('PriceListMappingPage', () => {
  const LISTA_ID = 'lp-1';

  let component: PriceListMappingPage;
  let fixture: ComponentFixture<PriceListMappingPage>;
  let servicioSupplier: jasmine.SpyObj<SupplierService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  const item1 = ItemListaPrecioMother.crear({ id: 'i-1', nombreProductoProveedor: 'Alfajor x24' });
  const lista = ListaPrecioProveedorMother.crear({ id: LISTA_ID, items: [item1] });
  const proveedor = SupplierResponseMother.crear({ id: SUPPLIER_ID_TEST, listasPrecios: [lista] });

  function build(routeListaId: string | null = LISTA_ID): void {
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [PriceListMappingPage],
      providers: [
        { provide: SupplierService, useValue: servicioSupplier },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: ToastService, useValue: servicioToast },
        {
          provide: UsuarioService,
          useValue: jasmine.createSpyObj('UsuarioService', [], { nombreNavbar: signal('Kiosquero') }),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap(routeListaId ? { listaPrecioId: routeListaId } : {})),
          },
        },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(PriceListMappingPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PriceListMappingPage);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    servicioSupplier = jasmine.createSpyObj('SupplierService', [
      'getSuppliers',
      'getSupplierById',
      'updateMapping',
      'createSupplier',
      'updateSupplier',
      'deleteSupplier',
      'uploadPriceList',
      'getPurchaseRecommendations',
    ]);
    servicioSupplier.getSuppliers.and.returnValue(of([proveedor]));
    servicioSupplier.getSupplierById.and.returnValue(of(proveedor));

    servicioProducto = jasmine.createSpyObj('ProductoService', ['getAll']);
    servicioProducto.getAll.and.returnValue(
      of([
        ProductoInventarioMother.crear({ id: 'prod-alfajor', nombre: 'Alfajor de chocolate' }),
        ProductoInventarioMother.crear({ id: 'prod-tostado', nombre: 'Tostado' }),
      ]),
    );

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
  });

  describe('ngOnInit', () => {
    it('dado un listaPrecioId, cuando se monta, deberia cargar productos, ubicar la lista y setear items', () => {
      build();
      whenMonto();

      expect(component.listaPrecioId).toBe(LISTA_ID);
      expect(servicioProducto.getAll).toHaveBeenCalled();
      expect(servicioSupplier.getSuppliers).toHaveBeenCalled();
      expect(servicioSupplier.getSupplierById).toHaveBeenCalledWith(SUPPLIER_ID_TEST);
      expect(component.supplier()?.id).toBe(SUPPLIER_ID_TEST);
      expect(component.priceList()?.id).toBe(LISTA_ID);
      expect(component.items().length).toBe(1);
      expect(component.isLoading()).toBeFalse();
    });

    it('dado sin listaPrecioId en el route, cuando se monta, deberia mostrar toast y navegar a /kiosquero/proveedores', () => {
      build(null);
      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Lista de precios no especificada',
        'error',
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });

    it('dado que ningun supplier tiene la lista, deberia mostrar toast "no encontrada" y navegar a proveedores', () => {
      servicioSupplier.getSuppliers.and.returnValue(
        of([SupplierResponseMother.crear({ id: 'otro-sup', listasPrecios: [] })]),
      );
      build();

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Lista de precios no encontrada',
        'error',
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });

    it('dado que getSuppliers falla, deberia mostrar toast y navegar a proveedores', () => {
      spyOn(console, 'error');
      servicioSupplier.getSuppliers.and.returnValue(throwError(() => new Error('boom')));
      build();

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al ubicar la lista de precios',
        'error',
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });

    it('dado que getAll de productos falla, no deberia romper la carga pero deberia mostrar toast', () => {
      spyOn(console, 'error');
      servicioProducto.getAll.and.returnValue(throwError(() => new Error('boom')));
      build();

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cargar productos del inventario para mapear',
        'error',
      );
    });

    it('dado que getSupplierById (detalle) falla, deberia dejar isLoading en false sin romper', () => {
      spyOn(console, 'error');
      servicioSupplier.getSupplierById.and.returnValue(throwError(() => new Error('boom')));
      build();

      whenMonto();

      expect(component.isLoading()).toBeFalse();
    });

    it('dado que el detalle devuelve la lista sin items, items del state deberia caer al arreglo vacio', () => {
      const listaSinItems = ListaPrecioProveedorMother.crear({
        id: 'lp-1',
        items: undefined as unknown as [],
      });
      const proveedorSinItems = SupplierResponseMother.crear({
        id: SUPPLIER_ID_TEST,
        listasPrecios: [listaSinItems],
      });
      servicioSupplier.getSuppliers.and.returnValue(of([proveedorSinItems]));
      servicioSupplier.getSupplierById.and.returnValue(of(proveedorSinItems));

      build();
      whenMonto();

      expect(component.items()).toEqual([]);
    });
  });

  describe('confirmMapping', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un item sin productoInventarioId, cuando confirmo, deberia mostrar toast de error y no llamar al service', () => {
      const item = ItemListaPrecioMother.crear({ productoInventarioId: null });

      component.confirmMapping(item);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Asociá un producto del inventario primero',
        'error',
      );
      expect(servicioSupplier.updateMapping).not.toHaveBeenCalled();
    });

    it('dado un item mapeado, cuando confirmo, deberia llamar updateMapping y actualizar el item en el state', () => {
      const actualizado = ItemListaPrecioMother.crear({ mappingConfirmado: true });
      servicioSupplier.updateMapping.and.returnValue(of(actualizado));

      component.confirmMapping(item1);

      expect(servicioSupplier.updateMapping).toHaveBeenCalledWith('i-1', 'prod-alfajor');
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/Mapeo confirmado/),
        'success',
      );
    });

    it('dado que updateMapping falla, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      servicioSupplier.updateMapping.and.returnValue(throwError(() => new Error('boom')));

      component.confirmMapping(item1);

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al confirmar el mapeo', 'error');
    });

    it('dado varios items en el state, cuando confirmo uno, los demas deberian quedar intactos', () => {
      const item2 = ItemListaPrecioMother.crear({ id: 'i-2', nombreProductoProveedor: 'Coca x6' });
      component.items.set([item1, item2]);
      const actualizado = ItemListaPrecioMother.crear({ id: 'i-1', mappingConfirmado: true });
      servicioSupplier.updateMapping.and.returnValue(of(actualizado));

      component.confirmMapping(item1);

      const stateFinal = component.items();
      expect(stateFinal.find((i) => i.id === 'i-1')?.mappingConfirmado).toBeTrue();
      expect(stateFinal.find((i) => i.id === 'i-2')).toEqual(item2);
    });
  });

  describe('selectProduct', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un producto seleccionado, cuando llamo selectProduct, deberia llamar updateMapping con el productId y cerrar el dropdown', () => {
      servicioSupplier.updateMapping.and.returnValue(of(ItemListaPrecioMother.crear()));
      component.activeDropdownRowId.set('i-1');

      component.selectProduct(
        item1,
        ProductoInventarioMother.crear({ id: 'prod-tostado' }),
      );

      expect(servicioSupplier.updateMapping).toHaveBeenCalledWith('i-1', 'prod-tostado');
      expect(component.activeDropdownRowId()).toBeNull();
    });

    it('dado product=null (desmapear), cuando llamo selectProduct, deberia mandar null al service', () => {
      servicioSupplier.updateMapping.and.returnValue(
        of(ItemListaPrecioMother.crear({ productoInventarioId: null, mappingConfirmado: false })),
      );

      component.selectProduct(item1, null);

      expect(servicioSupplier.updateMapping).toHaveBeenCalledWith('i-1', null);
    });

    it('dado que updateMapping falla, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      servicioSupplier.updateMapping.and.returnValue(throwError(() => new Error('boom')));

      component.selectProduct(item1, ProductoInventarioMother.crear());

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al actualizar el mapeo del producto',
        'error',
      );
    });
  });

  describe('dropdown handlers', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un rowId, cuando abro el dropdown, deberia setear activeDropdownRowId y limpiar la busqueda', () => {
      component.productSearchQuery.set('previo');
      const evt = new Event('click');
      spyOn(evt, 'stopPropagation');

      component.openProductDropdown('i-1', evt);

      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(component.activeDropdownRowId()).toBe('i-1');
      expect(component.productSearchQuery()).toBe('');
    });

    it('dado el dropdown abierto, cuando cierro, deberia limpiar activeDropdownRowId y la busqueda', () => {
      component.activeDropdownRowId.set('i-1');
      component.productSearchQuery.set('busqueda');

      component.closeProductDropdown();

      expect(component.activeDropdownRowId()).toBeNull();
      expect(component.productSearchQuery()).toBe('');
    });

    it('dado una busqueda vacia, getFilteredInventoryProducts deberia devolver todos los productos', () => {
      const productos = component.getFilteredInventoryProducts();
      expect(productos.length).toBe(2);
    });

    it('dado una busqueda, deberia filtrar por nombre (case insensitive)', () => {
      component.productSearchQuery.set('TOSTADO');

      const productos = component.getFilteredInventoryProducts();

      expect(productos.length).toBe(1);
      expect(productos[0].id).toBe('prod-tostado');
    });
  });

  describe('volver', () => {
    it('dado un supplier cargado, cuando llamo volver, deberia navegar a /kiosquero/proveedores/{id}', () => {
      build();
      whenMonto();

      component.volver();

      expect(router.navigate).toHaveBeenCalledWith(['/kiosquero/proveedores', SUPPLIER_ID_TEST]);
    });

    it('dado sin supplier, cuando llamo volver, deberia navegar al listado', () => {
      build();
      whenMonto();
      component.supplier.set(null);

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
