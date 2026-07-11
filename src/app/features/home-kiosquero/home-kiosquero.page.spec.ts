import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Perfil } from '../../data-access/models/perfil.model';
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
import { RestriccionesNutricionalesService } from '../restricciones-nutricionales/services/restricciones-nutricionales.service';
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
  @Input() planActual: 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO' = 'GRATUITO';
  @Output() closeModal = new EventEmitter<void>();
  @Output() selectIA = new EventEmitter<void>();
  @Output() selectManual = new EventEmitter<void>();
  @Output() selectBulk = new EventEmitter<void>();
  @Output() iaUpload = new EventEmitter<void>();
  @Output() manualUpload = new EventEmitter<void>();
  @Output() bulkUpload = new EventEmitter<void>();
  @Output() planBlocked = new EventEmitter<'Intermedio' | 'Avanzado'>();
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

@Component({ selector: 'app-product-form', template: '', standalone: true })
class FormularioProductoStub {
  @Input() categories: Categoria[] = [];
  @Input() healthClassifications: unknown[] = [];
  @Input() product: unknown = null;
  @Input() isSaving = false;
  @Input() buffetId: string | null = null;
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
      clasificacionesSaludIds: [],
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

class AccionKiosqueroMother {
  static cargarProductos(): AccionKiosquero {
    return {
      id: 'cargar-productos',
      titulo: 'Cargar productos',
      descripcion: 'Sumá stock',
      icono: 'fa-upload',
      ruta: '',
    };
  }

  static verPedidos(): AccionKiosquero {
    return {
      id: 'ver-pedidos',
      titulo: 'Ver pedidos',
      descripcion: 'Gestioná las órdenes',
      icono: 'fa-clipboard-list',
      ruta: '/kiosquero/pedidos',
    };
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

class PresenterMother {
  static crear(): PresenterMock {
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
  let servicioRestricciones: jasmine.SpyObj<RestriccionesNutricionalesService>;

  beforeEach(async () => {
    presenter = PresenterMother.crear();
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['setHomeUrl']);
    servicioProducto = jasmine.createSpyObj<ProductoService>('ProductoService', [
      'getCategories',
      'create',
      'createBulk',
    ]);
    servicioCargaMasiva = jasmine.createSpyObj<CargaMasivaService>('CargaMasivaService', ['uploadFile']);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['obtenerBuffetId', 'getPerfil']);
    servicioRestricciones = jasmine.createSpyObj<RestriccionesNutricionalesService>('RestriccionesNutricionalesService', ['getCatalogo']);

    servicioProducto.getCategories.and.returnValue(of([]));
    servicioProducto.create.and.returnValue(of({} as Producto));
    servicioProducto.createBulk.and.returnValue(of([] as Producto[]));
    servicioRestricciones.getCatalogo.and.resolveTo([]);
    servicioCargaMasiva.uploadFile.and.returnValue(of({ products: [] } as RespuestaCargaMasiva));
    servicioPerfil.obtenerBuffetId.and.returnValue('buffet-1');
    givenPlanVendedor('GRATUITO');

    await TestBed.configureTestingModule({
      imports: [HomeKiosqueroPage],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: CargaMasivaService, useValue: servicioCargaMasiva },
        { provide: ToastService, useValue: servicioToast },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: RestriccionesNutricionalesService, useValue: servicioRestricciones },
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
    it('dado la page, cuando corre ngOnInit, deberia setear /kiosquero como home, iniciar el presenter y cargar categorias', () => {
      component.ngOnInit();

      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
      expect(presenter.init).toHaveBeenCalled();
      expect(servicioProducto.getCategories).toHaveBeenCalled();
    });

    it('dado que la carga de categorias devuelve datos, cuando corre ngOnInit, deberia guardarlas en el componente', () => {
      const categorias: Categoria[] = [{ id: 'c1', descripcion: 'Cat', activo: true }];
      givenCategoriasDelBack(categorias);

      component.ngOnInit();

      expect(component.categories).toEqual(categorias);
    });

    it('dado que la carga de categorias falla, cuando corre ngOnInit, deberia mostrar el toast de error', () => {
      givenGetCategoriesFalla();

      component.ngOnInit();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al cargar las categorías', 'error');
    });
  });

  describe('onActionClick', () => {
    it('dado la accion cargar-productos, cuando hago click, deberia abrir el modal de seleccion de carga', () => {
      component.onActionClick(AccionKiosqueroMother.cargarProductos());

      expect(component.isUploadModalVisible).toBeTrue();
      expect(presenter.ejecutarAccion).not.toHaveBeenCalled();
    });

    it('dado otra accion, cuando hago click, deberia delegar al presenter', () => {
      const accion = AccionKiosqueroMother.verPedidos();
      component.onActionClick(accion);

      expect(presenter.ejecutarAccion).toHaveBeenCalledWith(accion);
    });
  });

  describe('planes de acciones', () => {
    it('dado vendedor intermedio y accion intermedia, deberia mostrar badge Intermedio sin bloquear', () => {
      givenPlanVendedor('INTERMEDIO');
      const accion = accionConPlan('INTERMEDIO');

      expect(homePrivado().badgePlanAccion(accion)).toBe('Intermedio');
      expect(homePrivado().accionBloqueada(accion)).toBeFalse();
    });

    it('dado vendedor avanzado y accion intermedia, deberia mostrar badge Intermedio sin bloquear', () => {
      givenPlanVendedor('AVANZADO');
      const accion = accionConPlan('INTERMEDIO');

      expect(homePrivado().badgePlanAccion(accion)).toBe('Intermedio');
      expect(homePrivado().accionBloqueada(accion)).toBeFalse();
    });

    it('dado vendedor gratuito y accion intermedia, deberia mostrar badge Intermedio bloqueado', () => {
      givenPlanVendedor('GRATUITO');
      const accion = accionConPlan('INTERMEDIO');

      expect(homePrivado().badgePlanAccion(accion)).toBe('Intermedio');
      expect(homePrivado().accionBloqueada(accion)).toBeTrue();
    });

    it('dado vendedor intermedio y accion avanzada, deberia mostrar badge Avanzado bloqueado', () => {
      givenPlanVendedor('INTERMEDIO');
      const accion = accionConPlan('AVANZADO');

      expect(homePrivado().badgePlanAccion(accion)).toBe('Avanzado');
      expect(homePrivado().accionBloqueada(accion)).toBeTrue();
    });

    it('dado accion bloqueada, cuando hago click, deberia mostrar toast y no ejecutar accion', () => {
      givenPlanVendedor('GRATUITO');
      const accion = accionConPlan('INTERMEDIO');

      component.onActionClick(accion);

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Disponible con plan Intermedio.', 'info');
      expect(presenter.ejecutarAccion).not.toHaveBeenCalled();
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

    it('dado que el upload falla, cuando lo proceso, deberia mostrar el toast de error', () => {
      servicioCargaMasiva.uploadFile.and.returnValue(throwError(() => new Error('boom')));

      component.handleFileUpload(new File([''], 'test.csv'));

      expect(component.isProcessingFile).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al procesar el archivo', 'error');
    });
  });

  describe('handleBulkProductsSave', () => {
    it('dado sin buffetId, cuando guardo bulk, deberia mostrar el toast de error y no llamar al service', () => {
      givenSinBuffetId();

      component.handleBulkProductsSave([ProductoMasivoMother.crear()]);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No se encontró un buffet asociado a tu perfil',
        'error',
      );
      expect(servicioProducto.createBulk).not.toHaveBeenCalled();
    });

    it('dado productos validos y buffetId, cuando guardo bulk, deberia armar los requests con el buffet, guardar y navegar', () => {
      const productos = [ProductoMasivoMother.crear()];

      component.handleBulkProductsSave(productos);

      const requests = servicioProducto.createBulk.calls.mostRecent().args[0];
      expect(requests[0].buffetId).toBe('buffet-1');
      expect(requests[0].nombre).toBe('Alfajor');
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Productos cargados exitosamente', 'success');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });

    it('dado una categoria NEW normalizada, cuando guardo bulk, deberia usar la misma capitalizacion para nombres iguales', () => {
      const productos = [
        ProductoMasivoMother.crear({ categoriaId: 'NEW', nuevaCategoriaNombre: '  Bebidas  ' }),
        ProductoMasivoMother.crear({ categoriaId: 'NEW', nuevaCategoriaNombre: 'bebidas' }),
      ];

      component.handleBulkProductsSave(productos);

      const requests = servicioProducto.createBulk.calls.mostRecent().args[0];
      expect(requests[0].nuevaCategoriaNombre).toBe('Bebidas');
      expect(requests[1].nuevaCategoriaNombre).toBe('Bebidas');
    });

    it('dado que createBulk falla, cuando guardo bulk, deberia mostrar el toast de error', () => {
      servicioProducto.createBulk.and.returnValue(throwError(() => new Error('boom')));

      component.handleBulkProductsSave([ProductoMasivoMother.crear()]);

      expect(component.isProcessingFile).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al guardar los productos', 'error');
    });
  });

  describe('handleManualProductSubmit', () => {
    it('dado sin buffetId, cuando guardo manual, deberia mostrar el toast de error y no llamar al service', () => {
      givenSinBuffetId();

      component.handleManualProductSubmit(DatosFormularioMother.crearBase());

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No se encontró un buffet asociado a tu perfil',
        'error',
      );
      expect(servicioProducto.create).not.toHaveBeenCalled();
    });

    it('dado un producto con clasificaciones seleccionadas, cuando guardo, deberia incluirlas en la payload', () => {
      component.handleManualProductSubmit(
        DatosFormularioMother.crearBase({
          clasificacionesSaludIds: ['sin-tacc', 'pescado'],
        }),
      );

      const payload = servicioProducto.create.calls.mostRecent().args[0];
      expect(payload.clasificacionesSaludIds).toEqual(['sin-tacc', 'pescado']);
    });

    it('dado creacion exitosa, cuando guardo manual, deberia cerrar el form, mostrar toast y navegar', () => {
      component.isManualProductFormVisible = true;

      component.handleManualProductSubmit(DatosFormularioMother.crearBase());

      expect(component.isManualProductFormVisible).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Producto creado exitosamente', 'success');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin-productos');
    });

    it('dado que la creacion falla, cuando guardo manual, deberia mostrar el toast de error', () => {
      servicioProducto.create.and.returnValue(throwError(() => new Error('boom')));

      component.handleManualProductSubmit(DatosFormularioMother.crearBase());

      expect(component.isSavingManualProduct).toBeFalse();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Error al crear el producto', 'error');
    });
  });

  describe('onImagenError', () => {
    it('dado una imagen que falla, cuando se dispara error, deberia setear el src al fallback', () => {
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

  function givenCategoriasDelBack(categorias: Categoria[]): void {
    servicioProducto.getCategories.and.returnValue(of(categorias));
  }

  function givenGetCategoriesFalla(): void {
    servicioProducto.getCategories.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenSinBuffetId(): void {
    servicioPerfil.obtenerBuffetId.and.returnValue(null);
  }

  function givenPlanVendedor(plan: 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO'): void {
    servicioPerfil.getPerfil.and.returnValue({
      id: 'usuario-1',
      email: 'vendedor@recred.com',
      nombre: 'Vendedor',
      apellido: 'Demo',
      rol: 'VENDEDOR',
      plan,
    } as Perfil);
  }

  function accionConPlan(planRequerido: 'INTERMEDIO' | 'AVANZADO'): AccionKiosquero {
    return {
      ...AccionKiosqueroMother.verPedidos(),
      planRequerido,
    };
  }

  function homePrivado(): {
    badgePlanAccion(action: AccionKiosquero): string | null;
    accionBloqueada(action: AccionKiosquero): boolean;
  } {
    return component as unknown as {
      badgePlanAccion(action: AccionKiosquero): string | null;
      accionBloqueada(action: AccionKiosquero): boolean;
    };
  }
});
