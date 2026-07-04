import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { DatosFormularioProducto, FormularioProductoComponent } from '../inventario/components/formulario-producto/formulario-producto.component';
import { ModalSeleccionCargaComponent } from '../inventario/components/modal-seleccion-carga/modal-seleccion-carga.component';
import { ModalTablaCargaMasivaComponent } from '../inventario/components/modal-tabla-carga-masiva/modal-tabla-carga-masiva.component';
import { Categoria } from '../inventario/models/categoria.interface';
import { Producto } from '../inventario/models/producto.interface';
import { CargaMasivaService, RespuestaCargaMasiva, RespuestaProductoMasivo } from '../inventario/services/carga-masiva.service';
import { ProductoService } from '../inventario/services/producto.service';
import { HomeKiosqueroPage } from './home-kiosquero.page';
import { AccionKiosquero } from './models/accion-kiosquero.model';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-modal-seleccion-carga', template: '', standalone: true })
class ModalSeleccionCargaStub {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() selectIA = new EventEmitter<void>();
  @Output() selectManual = new EventEmitter<void>();
  @Output() selectBulk = new EventEmitter<void>();
}

@Component({ selector: 'app-modal-tabla-carga-masiva', template: '', standalone: true })
class ModalTablaCargaMasivaStub {
  @Input() isOpen = false;
  @Input() products: RespuestaProductoMasivo[] = [];
  @Input() categories: Categoria[] = [];
  @Input() isProcessing = false;
  @Input() buffetId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File>();
  @Output() saveProducts = new EventEmitter<RespuestaProductoMasivo[]>();
}

@Component({ selector: 'app-formulario-producto', template: '', standalone: true })
class FormularioProductoStub {
  @Input() categories: Categoria[] = [];
  @Input() product: unknown = null;
  @Output() formSubmit = new EventEmitter<DatosFormularioProducto>();
  @Output() formCancel = new EventEmitter<void>();
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

class ProductoMasivoMother {
  static crear(override: Partial<RespuestaProductoMasivo> = {}): RespuestaProductoMasivo {
    return {
      nombre: 'Alfajor',
      descripcion: 'Chocolate',
      precio: 500,
      peso: 50,
      requierePreparacion: false,
      categoriaId: 'c1',
      nuevaCategoriaNombre: '',
      stockActual: 20,
      saludEtiquetasIds: [],
      ...override,
    } as RespuestaProductoMasivo;
  }
}

interface PresenterMock {
  init: jasmine.Spy;
  ejecutarAccion: jasmine.Spy;
  nombreKiosquero: ReturnType<typeof signal<string>>;
  urlFotoPerfil: ReturnType<typeof signal<string | null>>;
  iniciales: ReturnType<typeof signal<string>>;
  saludo: ReturnType<typeof signal<string>>;
  isLoading: ReturnType<typeof signal<boolean>>;
  errorMessage: ReturnType<typeof signal<string | null>>;
  hasPanelData: ReturnType<typeof signal<boolean>>;
}

describe('HomeKiosqueroPage', () => {
  let component: HomeKiosqueroPage;
  let fixture: ComponentFixture<HomeKiosqueroPage>;
  let router: Router;
  let presenter: PresenterMock;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioCargaMasiva: jasmine.SpyObj<CargaMasivaService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  const accionCargarProductos: AccionKiosquero = {
    id: 'cargar-productos',
    titulo: 'Cargar productos',
    descripcion: 'Sumá stock',
    icono: 'fa-upload',
    ruta: '',
  };

  const accionVerPedidos: AccionKiosquero = {
    id: 'ver-pedidos',
    titulo: 'Ver pedidos',
    descripcion: 'Gestioná las órdenes',
    icono: 'fa-clipboard-list',
    ruta: '/kiosquero/pedidos',
  };

  beforeEach(async () => {
    presenter = crearPresenterMock();
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['setHomeUrl']);
    servicioProducto = jasmine.createSpyObj<ProductoService>('ProductoService', [
      'getCategories',
      'create',
      'createBulk',
    ]);
    servicioCargaMasiva = jasmine.createSpyObj<CargaMasivaService>('CargaMasivaService', ['uploadFile']);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['obtenerBuffetId']);

    servicioProducto.getCategories.and.returnValue(of([]));
    servicioProducto.create.and.returnValue(of({} as Producto));
    servicioProducto.createBulk.and.returnValue(of([] as Producto[]));
    servicioCargaMasiva.uploadFile.and.returnValue(of({ products: [] } as RespuestaCargaMasiva));
    servicioPerfil.obtenerBuffetId.and.returnValue('buffet-1');

    await TestBed.configureTestingModule({
      imports: [HomeKiosqueroPage],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: CargaMasivaService, useValue: servicioCargaMasiva },
        { provide: ToastService, useValue: servicioToast },
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    })
      .overrideComponent(HomeKiosqueroPage, {
        remove: {
          imports: [
            NavbarComponent,
            ModalSeleccionCargaComponent,
            ModalTablaCargaMasivaComponent,
            FormularioProductoComponent,
          ],
          providers: [HomeKiosqueroPresenter],
        },
        add: {
          imports: [
            NavbarStub,
            ModalSeleccionCargaStub,
            ModalTablaCargaMasivaStub,
            FormularioProductoStub,
          ],
          providers: [{ provide: HomeKiosqueroPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(HomeKiosqueroPage);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado ngOnInit, deberia setear /kiosquero como home, iniciar el presenter y cargar categorias', () => {
      component.ngOnInit();

      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
      expect(presenter.init).toHaveBeenCalled();
      expect(servicioProducto.getCategories).toHaveBeenCalled();
    });

    it('dado que la carga de categorias devuelve datos, deberia guardarlas en el componente', () => {
      const categorias: Categoria[] = [{ id: 'c1', descripcion: 'Cat', activo: true }];
      servicioProducto.getCategories.and.returnValue(of(categorias));

      component.ngOnInit();

      expect(component.categories).toEqual(categorias);
    });

    it('dado que la carga de categorias falla, deberia mostrar el toast de error', () => {
      servicioProducto.getCategories.and.returnValue(throwError(() => new Error('boom')));

      component.ngOnInit();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al cargar las categorías', 'error');
    });
  });

  describe('onActionClick', () => {
    it('dado la accion cargar-productos, cuando la selecciono, deberia abrir el modal de seleccion de carga', () => {
      component.onActionClick(accionCargarProductos);

      expect(component.isUploadModalVisible).toBeTrue();
      expect(presenter.ejecutarAccion).not.toHaveBeenCalled();
    });

    it('dado otra accion, cuando la selecciono, deberia delegar al presenter', () => {
      component.onActionClick(accionVerPedidos);

      expect(presenter.ejecutarAccion).toHaveBeenCalledWith(accionVerPedidos);
    });
  });

  describe('navegacion de carga', () => {
    it('dado el modal abierto, cuando voy a IA, deberia cerrar el modal y navegar a /cargar-producto-ia', () => {
      component.isUploadModalVisible = true;

      component.goToIaUpload();

      expect(component.isUploadModalVisible).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/cargar-producto-ia');
    });

    it('dado el modal abierto, cuando voy a carga manual, deberia cerrar el modal y mostrar el form individual', () => {
      component.isUploadModalVisible = true;

      component.goToManualUpload();

      expect(component.isUploadModalVisible).toBeFalse();
      expect(component.isManualProductFormVisible).toBeTrue();
    });

    it('dado el modal abierto, cuando voy a carga masiva, deberia abrir el modal masivo y limpiar los datos', () => {
      component.isUploadModalVisible = true;
      component.bulkProductsData = [ProductoMasivoMother.crear()];

      component.goToBulkUpload();

      expect(component.isUploadModalVisible).toBeFalse();
      expect(component.isBulkUploadModalVisible).toBeTrue();
      expect(component.bulkProductsData).toEqual([]);
    });

    it('dado el modal masivo, cuando lo cierro, deberia limpiar todo el estado', () => {
      component.isBulkUploadModalVisible = true;
      component.isProcessingFile = true;
      component.bulkProductsData = [ProductoMasivoMother.crear()];

      component.closeBulkUploadModal();

      expect(component.isBulkUploadModalVisible).toBeFalse();
      expect(component.isProcessingFile).toBeFalse();
      expect(component.bulkProductsData).toEqual([]);
    });
  });

  describe('handleFileUpload', () => {
    it('dado un archivo valido, cuando lo proceso, deberia guardar los productos y mostrar exito', () => {
      const productos = [ProductoMasivoMother.crear()];
      servicioCargaMasiva.uploadFile.and.returnValue(of({ products: productos }) as Observable<RespuestaCargaMasiva>);

      component.handleFileUpload(new File([''], 'test.csv'));

      expect(component.bulkProductsData).toEqual(productos);
      expect(component.isProcessingFile).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Archivo procesado correctamente', 'success');
    });

    it('dado que el upload falla, deberia mostrar el toast de error', () => {
      servicioCargaMasiva.uploadFile.and.returnValue(throwError(() => new Error('boom')));

      component.handleFileUpload(new File([''], 'test.csv'));

      expect(component.isProcessingFile).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al procesar el archivo', 'error');
    });
  });

  describe('handleBulkProductsSave', () => {
    it('dado sin buffetId, deberia mostrar el toast de error y no llamar al service', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);

      component.handleBulkProductsSave([ProductoMasivoMother.crear()]);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No se encontró un buffet asociado a tu perfil',
        'error',
      );
      expect(servicioProducto.createBulk).not.toHaveBeenCalled();
    });

    it('dado productos validos y buffetId, deberia armar los requests con el buffet, guardar y navegar', () => {
      const productos = [ProductoMasivoMother.crear()];

      component.handleBulkProductsSave(productos);

      const requests = servicioProducto.createBulk.calls.mostRecent().args[0];
      expect(requests[0].buffetId).toBe('buffet-1');
      expect(requests[0].nombre).toBe('Alfajor');
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Productos cargados exitosamente', 'success');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });

    it('dado una categoria NEW normalizada, deberia usar la misma capitalizacion para nombres iguales', () => {
      const productos = [
        ProductoMasivoMother.crear({ categoriaId: 'NEW', nuevaCategoriaNombre: '  Bebidas  ' }),
        ProductoMasivoMother.crear({ categoriaId: 'NEW', nuevaCategoriaNombre: 'bebidas' }),
      ];

      component.handleBulkProductsSave(productos);

      const requests = servicioProducto.createBulk.calls.mostRecent().args[0];
      expect(requests[0].nuevaCategoriaNombre).toBe('Bebidas');
      expect(requests[1].nuevaCategoriaNombre).toBe('Bebidas');
    });

    it('dado que createBulk falla, deberia mostrar el toast de error', () => {
      servicioProducto.createBulk.and.returnValue(throwError(() => new Error('boom')));

      component.handleBulkProductsSave([ProductoMasivoMother.crear()]);

      expect(component.isProcessingFile).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al guardar los productos', 'error');
    });
  });

  describe('handleManualProductSubmit', () => {
    it('dado sin buffetId, deberia mostrar el toast de error y no llamar al service', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);

      component.handleManualProductSubmit(DatosFormularioMother.crearBase());

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No se encontró un buffet asociado a tu perfil',
        'error',
      );
      expect(servicioProducto.create).not.toHaveBeenCalled();
    });

    it('dado un producto sin TACC, sin azucar y sin lacteos, deberia incluir Sin TACC y Sin Azucar en la payload', () => {
      component.handleManualProductSubmit(DatosFormularioMother.crearBase());

      const payload = servicioProducto.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).toContain('15b2fc3b-ea51-45a0-b26b-b09c3fadc8f8');
      expect(payload.clasificacionesSaludIds).toContain('7e113952-93ca-4797-a80d-54f3a31b2165');
    });

    it('dado creacion exitosa, deberia cerrar el form, mostrar toast y navegar', () => {
      component.isManualProductFormVisible = true;

      component.handleManualProductSubmit(DatosFormularioMother.crearBase());

      expect(component.isManualProductFormVisible).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Producto creado exitosamente', 'success');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });

    it('dado que la creacion falla, deberia mostrar el toast de error', () => {
      servicioProducto.create.and.returnValue(throwError(() => new Error('boom')));

      component.handleManualProductSubmit(DatosFormularioMother.crearBase());

      expect(component.isSavingManualProduct).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al crear el producto', 'error');
    });
  });

  describe('onImagenError', () => {
    it('dado una imagen que falla, deberia setear el src al fallback', () => {
      const img = document.createElement('img');
      img.src = 'https://original/foto.png';

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toContain('logo_sin_fondo_ikciro');
    });
  });

  describe('closeUploadModal', () => {
    it('dado el modal abierto, cuando lo cierro, deberia esconderlo', () => {
      component.isUploadModalVisible = true;

      component.closeUploadModal();

      expect(component.isUploadModalVisible).toBeFalse();
    });
  });

  function crearPresenterMock(): PresenterMock {
    return {
      init: jasmine.createSpy('init'),
      ejecutarAccion: jasmine.createSpy('ejecutarAccion'),
      nombreKiosquero: signal(''),
      urlFotoPerfil: signal<string | null>(null),
      iniciales: signal(''),
      saludo: signal(''),
      isLoading: signal(false),
      errorMessage: signal<string | null>(null),
      hasPanelData: signal(false),
    };
  }
});
