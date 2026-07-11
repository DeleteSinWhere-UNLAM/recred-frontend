import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { FormularioProductoComponent } from './components/formulario-producto/formulario-producto.component';
import { ModalConfirmarEliminarComponent } from './components/modal-confirmar-eliminar/modal-confirmar-eliminar.component';
import { TablaProductoComponent } from './components/tabla-producto/tabla-producto.component';
import { InventarioPageComponent } from './inventario-page/inventario-page.component';
import {
  BUFFET_ID_TEST,
  CategoriaInventarioMother,
  ItemResumenInventarioMother,
} from './inventario.mother';
import { ItemResumenInventario } from './models/inventario.interface';
import { Producto } from './models/producto.interface';
import { InventarioRealtimeService } from './services/inventario-realtime.service';
import { ProductoService } from './services/producto.service';
import { RestriccionesNutricionalesService } from '../restricciones-nutricionales/services/restricciones-nutricionales.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {}

@Component({
  selector: 'app-product-table',
  template: '',
  standalone: true,
})
class TablaProductoStub {
  @Input() products: ItemResumenInventario[] = [];
  @Input() isLoading = false;
  @Input() highlightedProductIds: ReadonlySet<string> = new Set<string>();
  @Output() manageInventory = new EventEmitter<ItemResumenInventario>();
  @Output() viewHistory = new EventEmitter<ItemResumenInventario>();
  @Output() editProduct = new EventEmitter<ItemResumenInventario>();
  @Output() deleteProduct = new EventEmitter<ItemResumenInventario>();
}

@Component({
  selector: 'app-confirm-delete-modal',
  template: '',
  standalone: true,
})
class ModalConfirmarEliminarStub {
  @Input() isOpen = false;
  @Input() productName = '';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}

@Component({
  selector: 'app-product-form',
  template: '',
  standalone: true,
})
class FormularioProductoStub {
  @Input() product: Producto | null = null;
  @Input() categories: unknown[] = [];
  @Input() healthClassifications: unknown[] = [];
  @Input() isSaving = false;
  @Input() buffetId: string | null = null;
  @Input() datosIniciales: unknown = null;
  @Output() formSubmit = new EventEmitter<unknown>();
  @Output() formCancel = new EventEmitter<void>();
}

describe('Inventario Integration', () => {
  let fixture: ComponentFixture<InventarioPageComponent>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioRealtime: jasmine.SpyObj<InventarioRealtimeService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioRestricciones: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let router: Router;

  beforeEach(async () => {
    servicioProducto = jasmine.createSpyObj('ProductoService', [
      'getAll',
      'getCategories',
      'getAllByBuffetId',
      'getInventoryOverview',
      'quickStockAction',
      'updateInventoryStock',
      'getProductStockMovements',
      'getById',
      'create',
      'createBulk',
      'update',
      'delete',
    ]);
    servicioProducto.getInventoryOverview.and.returnValue(
      of([
        ItemResumenInventarioMother.crear({ productId: 'p-1', nombre: 'Alfajor' }),
        ItemResumenInventarioMother.crearBajoStock(),
      ]),
    );
    servicioProducto.getCategories.and.returnValue(of([CategoriaInventarioMother.crear()]));
    servicioProducto.getById.and.returnValue(
      of({} as Producto),
    );
    servicioProducto.delete.and.returnValue(of(void 0));

    servicioRealtime = jasmine.createSpyObj('InventarioRealtimeService', [
      'connect',
      'recordRefetch',
    ]);
    servicioRealtime.connect.and.returnValue(new AbortController());

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioRestricciones = jasmine.createSpyObj('RestriccionesNutricionalesService', ['getCatalogo']);
    servicioRestricciones.getCatalogo.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [InventarioPageComponent],
      providers: [
        { provide: ProductoService, useValue: servicioProducto },
        { provide: InventarioRealtimeService, useValue: servicioRealtime },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: ToastService, useValue: servicioToast },
        { provide: RestriccionesNutricionalesService, useValue: servicioRestricciones },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        provideRouter([]),
      ],
    })
      .overrideComponent(InventarioPageComponent, {
        remove: {
          imports: [
            NavbarComponent,
            TablaProductoComponent,
            FormularioProductoComponent,
            ModalConfirmarEliminarComponent,
          ],
        },
        add: {
          imports: [NavbarStub, TablaProductoStub, FormularioProductoStub, ModalConfirmarEliminarStub],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(InventarioPageComponent);
  });

  it('dado un buffet en el perfil, cuando se monta la page, deberia setear /kiosquero como home y cargar categorias + overview', () => {
    whenMonto();

    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    expect(servicioProducto.getCategories).toHaveBeenCalled();
    expect(servicioProducto.getInventoryOverview).toHaveBeenCalledWith(BUFFET_ID_TEST);
    expect(servicioRealtime.connect).toHaveBeenCalled();
  });

  it('dado el inventario cargado, deberia propagarlo a la tabla via input', () => {
    whenMonto();

    const tabla = obtenerTabla();
    expect(tabla.products.length).toBe(2);
    expect(tabla.products.map((p) => p.productId)).toContain('p-1');
  });

  it('dado un click en volver, deberia navegar a /kiosquero', () => {
    whenMonto();

    (queryUno('.inventario__volver') as HTMLButtonElement).click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  it('dado el conteo de items, deberia renderizar el numero de disponibles y bajo stock', () => {
    whenMonto();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Disponibles');
    expect(texto).toContain('Bajo stock');
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function obtenerTabla(): TablaProductoStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof TablaProductoStub)
      ?.componentInstance as TablaProductoStub;
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
