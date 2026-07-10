import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  ItemListaPrecioMother,
  ListaPrecioProveedorMother,
  SUPPLIER_ID_TEST,
  SupplierResponseMother,
} from '../../proveedores.mother';
import { SupplierService } from '../../services/supplier.service';
import { SupplierDetailPage } from './supplier-detail.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('SupplierDetailPage', () => {
  const STORAGE_KEY = 'recred_eliminadas_listas_precio';

  let component: SupplierDetailPage;
  let fixture: ComponentFixture<SupplierDetailPage>;
  let servicioSupplier: jasmine.SpyObj<SupplierService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  function build(routeId: string | null = SUPPLIER_ID_TEST): void {
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [SupplierDetailPage],
      providers: [
        { provide: SupplierService, useValue: servicioSupplier },
        { provide: ToastService, useValue: servicioToast },
        {
          provide: UsuarioService,
          useValue: jasmine.createSpyObj('UsuarioService', [], { nombreNavbar: signal('Kiosquero') }),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap(routeId ? { id: routeId } : {})),
          },
        },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(SupplierDetailPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SupplierDetailPage);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);

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
    servicioSupplier.getSupplierById.and.returnValue(of(SupplierResponseMother.crear()));
    servicioSupplier.uploadPriceList.and.returnValue(of(ListaPrecioProveedorMother.crear({ id: 'lp-nueva' })));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  describe('ngOnInit', () => {
    it('dado un id en el route, cuando se monta, deberia llamar getSupplierById y setear el supplier', () => {
      build();
      whenMonto();

      expect(component.supplierId).toBe(SUPPLIER_ID_TEST);
      expect(servicioSupplier.getSupplierById).toHaveBeenCalledWith(SUPPLIER_ID_TEST);
      expect(component.supplier()?.id).toBe(SUPPLIER_ID_TEST);
      expect(component.isLoading()).toBeFalse();
    });

    it('dado sin id en el route, cuando se monta, deberia mostrar toast y navegar a /kiosquero/proveedores', () => {
      build(null);
      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Proveedor no especificado', 'error');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });

    it('dado un id salvado en localStorage, cuando se monta, deberia cargarlo en eliminadasDefinitivamente', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['lp-viejo']));
      build();

      whenMonto();

      expect(component.eliminadasDefinitivamente()).toContain('lp-viejo');
    });

    it('dado un localStorage corrupto, cuando se monta, no deberia romper y deberia loggear el error', () => {
      const errorSpy = spyOn(console, 'error');
      localStorage.setItem(STORAGE_KEY, 'json invalido');
      build();

      whenMonto();

      expect(errorSpy).toHaveBeenCalled();
    });

    it('dado que getSupplierById falla, deberia mostrar toast y navegar a /kiosquero/proveedores', () => {
      spyOn(console, 'error');
      servicioSupplier.getSupplierById.and.returnValue(throwError(() => new Error('boom')));
      build();

      whenMonto();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cargar la ficha del proveedor',
        'error',
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });
  });

  describe('drag & drop', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado onDragOver, deberia prevenir el default y marcar isDragOver=true', () => {
      const evt = crearDragEvent();

      component.onDragOver(evt);

      expect(evt.preventDefault).toHaveBeenCalled();
      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(component.isDragOver()).toBeTrue();
    });

    it('dado onDragLeave, deberia setear isDragOver=false', () => {
      component.isDragOver.set(true);

      component.onDragLeave(crearDragEvent());

      expect(component.isDragOver()).toBeFalse();
    });

    it('dado onDrop con un archivo valido (.pdf), deberia dispararlo por processFile y llamar uploadPriceList', () => {
      const archivo = new File(['x'], 'lista.pdf', { type: 'application/pdf' });
      const evt = crearDropEvent([archivo]);

      component.onDrop(evt);

      expect(component.isDragOver()).toBeFalse();
      expect(servicioSupplier.uploadPriceList).toHaveBeenCalledWith(SUPPLIER_ID_TEST, archivo);
    });

    it('dado onDrop sin archivos, no deberia llamar al service', () => {
      component.onDrop(crearDropEvent([]));

      expect(servicioSupplier.uploadPriceList).not.toHaveBeenCalled();
    });
  });

  describe('processFile via input', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un archivo de extension invalida (.png), deberia mostrar toast y no subir', () => {
      const archivo = new File(['x'], 'foto.png', { type: 'image/png' });

      component.onFileSelected(crearFileEvent([archivo]));

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/Formato de archivo inválido/),
        'error',
      );
      expect(servicioSupplier.uploadPriceList).not.toHaveBeenCalled();
    });

    it('dado un archivo > 5MB (.pdf), deberia mostrar toast de tamano y no subir', () => {
      const grande = new File([new Uint8Array(6 * 1024 * 1024)], 'grande.pdf', {
        type: 'application/pdf',
      });

      component.onFileSelected(crearFileEvent([grande]));

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'El archivo supera el límite de 5MB.',
        'error',
      );
      expect(servicioSupplier.uploadPriceList).not.toHaveBeenCalled();
    });

    it('dado un archivo CSV valido, deberia subirlo y navegar a la pagina de mapeo', () => {
      const archivo = new File(['col1,col2'], 'lista.csv', { type: 'text/csv' });

      component.onFileSelected(crearFileEvent([archivo]));

      expect(servicioSupplier.uploadPriceList).toHaveBeenCalledWith(SUPPLIER_ID_TEST, archivo);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Lista de precios subida y procesada correctamente con IA',
        'success',
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/kiosquero/proveedores/lista-precio',
        'lp-nueva',
      ]);
      expect(component.isUploading()).toBeFalse();
    });

    it('dado que uploadPriceList falla, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      servicioSupplier.uploadPriceList.and.returnValue(throwError(() => new Error('boom')));
      const archivo = new File(['x'], 'lista.pdf', { type: 'application/pdf' });

      component.onFileSelected(crearFileEvent([archivo]));

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al procesar el archivo. Reintentá en unos instantes.',
        'error',
      );
      expect(component.isUploading()).toBeFalse();
    });

    it('dado onFileSelected sin archivos, no deberia hacer nada', () => {
      component.onFileSelected(crearFileEvent([]));

      expect(servicioSupplier.uploadPriceList).not.toHaveBeenCalled();
    });
  });

  describe('navegacion a mapeo', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un listaPrecioId, cuando llamo verMapeo, deberia navegar a la ruta de mapeo', () => {
      component.verMapeo('lp-1');

      expect(router.navigate).toHaveBeenCalledWith(['/kiosquero/proveedores/lista-precio', 'lp-1']);
    });

    it('dado una url, cuando llamo descargarArchivo, deberia stopear el evento y abrir la URL en nueva pestana', () => {
      const evt = new Event('click');
      spyOn(evt, 'stopPropagation');
      const openSpy = spyOn(window, 'open');

      component.descargarArchivo('https://cdn/lp.pdf', evt);

      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith('https://cdn/lp.pdf', '_blank');
    });

    it('dado la page, cuando llamo volver, deberia navegar a /kiosquero/proveedores', () => {
      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/proveedores');
    });
  });

  describe('isListMapped', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado una lista sin items, deberia devolver false', () => {
      const lista = ListaPrecioProveedorMother.crear({ items: undefined });

      expect(component.isListMapped(lista)).toBeFalse();
    });

    it('dado una lista con items no confirmados, deberia devolver false', () => {
      const lista = ListaPrecioProveedorMother.crear({
        items: [
          ItemListaPrecioMother.crear({ mappingConfirmado: true }),
          ItemListaPrecioMother.crear({ id: 'i-2', mappingConfirmado: false }),
        ],
      });

      expect(component.isListMapped(lista)).toBeFalse();
    });

    it('dado una lista con todos los items confirmados, deberia devolver true', () => {
      const lista = ListaPrecioProveedorMother.crear({
        items: [
          ItemListaPrecioMother.crear({ mappingConfirmado: true }),
          ItemListaPrecioMother.crear({ id: 'i-2', mappingConfirmado: true }),
        ],
      });

      expect(component.isListMapped(lista)).toBeTrue();
    });
  });

  describe('ocultar y eliminar listas', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado un id, cuando lo oculto temporalmente, deberia agregarlo al signal y mostrar toast', () => {
      const evt = new Event('click');
      spyOn(evt, 'stopPropagation');

      component.ocultarTemporalmente('lp-1', evt);

      expect(evt.stopPropagation).toHaveBeenCalled();
      expect(component.ocultasTemporalmente()).toContain('lp-1');
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Lista ocultada temporalmente',
        'success',
      );
    });

    it('dado un id, cuando lo elimino definitivamente, deberia persistirlo en localStorage y agregarlo al signal', () => {
      component.eliminarDefinitivamente('lp-1', new Event('click'));

      expect(component.eliminadasDefinitivamente()).toContain('lp-1');
      const persistido = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(persistido).toContain('lp-1');
    });

    it('dado un id ya persistido, cuando lo elimino de nuevo, no deberia duplicarlo en localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['lp-1']));

      component.eliminarDefinitivamente('lp-1', new Event('click'));

      const persistido = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(persistido).toEqual(['lp-1']);
    });
  });

  describe('getListasPreciosFiltradas', () => {
    it('dado sin supplier cargado, deberia devolver []', () => {
      build();
      whenMonto();
      component.supplier.set(null);

      expect(component.getListasPreciosFiltradas()).toEqual([]);
    });

    it('dado un supplier con listas, deberia filtrar las ocultas y las eliminadas', () => {
      build();
      whenMonto();
      component.supplier.set(
        SupplierResponseMother.crear({
          listasPrecios: [
            ListaPrecioProveedorMother.crear({ id: 'lp-1' }),
            ListaPrecioProveedorMother.crear({ id: 'lp-2' }),
            ListaPrecioProveedorMother.crear({ id: 'lp-3' }),
          ],
        }),
      );
      component.ocultasTemporalmente.set(['lp-2']);
      component.eliminadasDefinitivamente.set(['lp-3']);

      const visibles = component.getListasPreciosFiltradas();

      expect(visibles.length).toBe(1);
      expect(visibles[0].id).toBe('lp-1');
    });
  });

  describe('modal de precios', () => {
    beforeEach(() => {
      build();
      whenMonto();
    });

    it('dado la page, cuando abro el modal de precios, deberia setearlo en true y limpiar la busqueda', () => {
      component.pricesSearchQuery.set('previo');

      component.openPricesModal();

      expect(component.isPricesModalOpen()).toBeTrue();
      expect(component.pricesSearchQuery()).toBe('');
    });

    it('dado el modal abierto, cuando cierro, deberia setearlo en false', () => {
      component.openPricesModal();

      component.closePricesModal();

      expect(component.isPricesModalOpen()).toBeFalse();
    });

    it('dado sin supplier, getLatestPrices deberia devolver []', () => {
      component.supplier.set(null);
      expect(component.getLatestPrices()).toEqual([]);
    });

    it('dado varias listas cronologicas, deberia quedar con el precio de la lista mas reciente por producto', () => {
      component.supplier.set(
        SupplierResponseMother.crear({
          listasPrecios: [
            ListaPrecioProveedorMother.crear({
              id: 'lp-1',
              nombreOriginal: 'lista-vieja.pdf',
              creadoEn: '2026-01-01T00:00:00Z',
              items: [
                ItemListaPrecioMother.crear({
                  nombreProductoProveedor: 'Alfajor Jorgito x24',
                  precio: 10000,
                }),
              ],
            }),
            ListaPrecioProveedorMother.crear({
              id: 'lp-2',
              nombreOriginal: 'lista-junio.pdf',
              creadoEn: '2026-06-01T00:00:00Z',
              items: [
                ItemListaPrecioMother.crear({
                  nombreProductoProveedor: 'Alfajor Jorgito x24',
                  precio: 12000,
                }),
                ItemListaPrecioMother.crear({
                  id: 'i-2',
                  nombreProductoProveedor: 'Coca x6',
                  precio: 5000,
                }),
              ],
            }),
          ],
        }),
      );

      const precios = component.getLatestPrices();

      expect(precios.length).toBe(2);
      const alfajor = precios.find((p) => p.nombre === 'Alfajor Jorgito x24');
      expect(alfajor?.precio).toBe(12000);
      expect(alfajor?.lista).toBe('lista-junio.pdf');
    });

    it('dado una busqueda en el modal, getLatestPrices deberia filtrar por nombre', () => {
      component.supplier.set(
        SupplierResponseMother.crear({
          listasPrecios: [
            ListaPrecioProveedorMother.crear({
              items: [
                ItemListaPrecioMother.crear({ nombreProductoProveedor: 'Alfajor' }),
                ItemListaPrecioMother.crear({ id: 'i-2', nombreProductoProveedor: 'Coca-Cola' }),
              ],
            }),
          ],
        }),
      );
      component.pricesSearchQuery.set('coca');

      const precios = component.getLatestPrices();

      expect(precios.length).toBe(1);
      expect(precios[0].nombre).toBe('Coca-Cola');
    });

    it('dado una lista sin items, getLatestPrices deberia continuar sin romper', () => {
      component.supplier.set(
        SupplierResponseMother.crear({
          listasPrecios: [
            ListaPrecioProveedorMother.crear({ id: 'lp-vacia', items: undefined as unknown as [] }),
            ListaPrecioProveedorMother.crear({
              id: 'lp-ok',
              items: [ItemListaPrecioMother.crear({ nombreProductoProveedor: 'Coca' })],
            }),
          ],
        }),
      );

      const precios = component.getLatestPrices();

      expect(precios.some((p) => p.nombre === 'Coca')).toBeTrue();
    });

    it('dado un item sin unidad, getLatestPrices deberia usar "unidad" como fallback', () => {
      component.supplier.set(
        SupplierResponseMother.crear({
          listasPrecios: [
            ListaPrecioProveedorMother.crear({
              items: [
                ItemListaPrecioMother.crear({
                  nombreProductoProveedor: 'Alfajor',
                  unidad: undefined as unknown as string,
                }),
              ],
            }),
          ],
        }),
      );

      const precios = component.getLatestPrices();

      expect(precios[0].unidad).toBe('unidad');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function crearDragEvent(): DragEvent {
    const evt = {
      preventDefault: () => undefined,
      stopPropagation: () => undefined,
      dataTransfer: null,
    } as unknown as DragEvent;
    spyOn(evt, 'preventDefault');
    spyOn(evt, 'stopPropagation');
    return evt;
  }

  function crearDropEvent(archivos: File[]): DragEvent {
    const evt = crearDragEvent();
    Object.defineProperty(evt, 'dataTransfer', {
      value: { files: archivos },
      configurable: true,
    });
    return evt;
  }

  function crearFileEvent(archivos: File[]): Event {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: archivos });
    return { target: input } as unknown as Event;
  }
});
