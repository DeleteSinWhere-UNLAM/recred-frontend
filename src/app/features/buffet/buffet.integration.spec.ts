import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { BuffetPage } from './buffet.page';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ProductoCardComponent } from './components/producto-card/producto-card.component';
import { SeleccionarAlumnoModalComponent } from './components/seleccionar-alumno-modal/seleccionar-alumno-modal.component';
import { GuardarFavoritoModalComponent } from '../compra/components/guardar-favorito-modal/guardar-favorito-modal.component';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';
import { CarritoService } from '../compra/services/carrito.service';
import { CompraService } from '../compra/services/compra.service';
import { CarritosFavoritosService } from '../carritos-favoritos/services/carritos-favoritos.service';
import { BuffetService } from './services/buffet.service';
import { FavoritosService } from '../favoritos/services/favoritos.service';
import { RestriccionProductoService } from '../restriccion-producto/services/restriccion-producto.service';
import { FranjasHorariasService } from '../restricciones-horarias/services/franjas-horarias.service';
import { RestriccionesHorariasService } from '../restricciones-horarias/services/restricciones-horarias.service';
import { PresupuestoService } from '../presupuesto/services/presupuesto.service';
import { RestriccionesNutricionalesService } from '../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { PromotionService } from '../../data-access/services/promociones/promotion.service';
import { Producto } from './models/producto.model';
import { Alumno } from '../../data-access/models/alumno.model';
import { Colegio } from '../../data-access/models/colegio.model';
import { Perfil } from '../../data-access/models/perfil.model';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { BuffetMother, ProductoMother } from './buffet.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true,
})
class NavbarStub {
  @Input() userName = '';
}

@Component({
  selector: 'app-producto-card',
  template: '<div class="producto-card-stub">{{ producto?.nombre }}</div>',
  standalone: true,
})
class ProductoCardStub {
  @Input() producto: Producto | undefined;
  @Input() alumnoId = '';
  @Input() esFavorito = false;
  @Input() mostrarCandado = false;
  @Output() cambioCantidad = new EventEmitter<{ producto: Producto; cantidad: number }>();
  @Output() toggleFavorito = new EventEmitter<Producto>();
  @Output() toggleLock = new EventEmitter<Producto>();
}

@Component({
  selector: 'app-seleccionar-alumno-modal',
  template: '',
  standalone: true,
})
class SeleccionarAlumnoModalStub {
  @Input() alumnos: Alumno[] = [];
  @Input() colegios: Colegio[] = [];
  @Input() alumnoActualId = '';
  @Output() seleccionar = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();
}

@Component({
  selector: 'app-guardar-favorito-modal',
  template: '',
  standalone: true,
})
class GuardarFavoritoModalStub {
  @Input() alumnoId = '';
  @Input() items: unknown[] = [];
  @Output() cerrar = new EventEmitter<void>();
}

describe('Buffet Integration', () => {
  let fixture: ComponentFixture<BuffetPage>;
  let router: Router;
  let servicioBuffet: jasmine.SpyObj<BuffetService>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;

  const ALUMNO = AlumnoMother.crear({
    id: 'alumno-1',
    nombre: 'Julián',
    apellido: 'García',
    colegioId: 'colegio-1',
    saldo: 25000,
  });
  const BUFFET = BuffetMother.crear();
  const PRODUCTO_DISPONIBLE = ProductoMother.crearDisponible({ id: 'prod-libre', nombre: 'Agua Mineral' });
  const PRODUCTO_BLOQUEADO_TUTOR = ProductoMother.crearBloqueadoPorTutor({ id: 'prod-tutor', nombre: 'Alfajor' });
  const PRODUCTO_BLOQUEADO_RESTRICCION = ProductoMother.crearBloqueadoPorRestriccion({
    id: 'prod-restriccion',
    nombre: 'Galletitas Oreo',
  });

  beforeEach(async () => {
    const servicioAlumnos = jasmine.createSpyObj<AlumnosService>('AlumnosService', ['getAlumnoById', 'asegurarCargados'], {
      alumnos: signal([ALUMNO]),
    });
    servicioAlumnos.getAlumnoById.and.returnValue(ALUMNO);
    servicioAlumnos.asegurarCargados.and.resolveTo([ALUMNO]);

    servicioBuffet = jasmine.createSpyObj<BuffetService>('BuffetService', ['obtenerBuffetDelAlumno', 'getProductosDelBuffet']);
    servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(of(BUFFET));
    servicioBuffet.getProductosDelBuffet.and.returnValue(
      of([PRODUCTO_DISPONIBLE, PRODUCTO_BLOQUEADO_TUTOR, PRODUCTO_BLOQUEADO_RESTRICCION]),
    );

    servicioCarrito = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'agregar',
      'setCatalog',
      'cargarPresupuestoYConsumo',
      'getSeleccionRetiro',
      'setSeleccionRetiro',
      'cantidadDe',
      'puedeAgregar',
      'validarAgregar',
    ]);
    Object.assign(servicioCarrito, {
      items: signal([]),
      budgets: signal(new Map()),
      purchases: signal(new Map()),
    });
    servicioCarrito.cantidadDe.and.returnValue(0);
    servicioCarrito.puedeAgregar.and.returnValue(true);
    servicioCarrito.validarAgregar.and.returnValue({ permitido: true });

    const servicioColegios = jasmine.createSpyObj<ColegiosService>('ColegiosService', ['getColegios']);
    servicioColegios.getColegios.and.returnValue([{ id: 'colegio-1', nombre: 'Fernando Fader' }]);

    const servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['homeUrl', 'esVistaAlumno', 'setHomeUrl'], {
      nombreNavbar: signal('Julián'),
      esVistaAlumno: signal(false),
    });
    servicioUsuario.homeUrl.and.returnValue('/tutor');

    const servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['esPlanGratuito', 'rol'], {
      perfil: signal<Perfil | null>({ plan: 'FREE' } as unknown as Perfil),
    });
    servicioPerfil.esPlanGratuito.and.returnValue(true);
    servicioPerfil.rol.and.returnValue('PADRE');

    const servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    const servicioFavoritos = jasmine.createSpyObj<FavoritosService>('FavoritosService', ['getFavoritos', 'agregarFavorito', 'removerFavorito']);
    servicioFavoritos.getFavoritos.and.returnValue(of([]));
    servicioFavoritos.agregarFavorito.and.returnValue(of(undefined));
    servicioFavoritos.removerFavorito.and.returnValue(of(undefined));

    const servicioCompra = jasmine.createSpyObj<CompraService>('CompraService', ['iniciarOrden', 'procesarPago']);

    const servicioCarritosFavoritos = jasmine.createSpyObj<CarritosFavoritosService>('CarritosFavoritosService', ['getCarritosFavoritos']);
    servicioCarritosFavoritos.getCarritosFavoritos.and.returnValue(of([]));

    const servicioRestriccionProducto = jasmine.createSpyObj<RestriccionProductoService>('RestriccionProductoService', [
      'bloquearProducto',
      'desbloquearProducto',
    ]);
    const servicioFranjas = jasmine.createSpyObj<FranjasHorariasService>('FranjasHorariasService', ['getFranjasHorarias']);
    servicioFranjas.getFranjasHorarias.and.resolveTo([]);
    const servicioRestriccionesHorarias = jasmine.createSpyObj<RestriccionesHorariasService>('RestriccionesHorariasService', [
      'getRestriccionesPorAlumno',
    ]);
    servicioRestriccionesHorarias.getRestriccionesPorAlumno.and.resolveTo([]);
    const servicioPresupuesto = jasmine.createSpyObj<PresupuestoService>('PresupuestoService', ['checkBudgetDates', 'getPresupuesto']);
    servicioPresupuesto.checkBudgetDates.and.resolveTo([]);
    const servicioRestriccionesNutricionales = jasmine.createSpyObj<RestriccionesNutricionalesService>('RestriccionesNutricionalesService', [
      'getRestriccionesAlumno',
    ]);
    servicioRestriccionesNutricionales.getRestriccionesAlumno.and.resolveTo([]);
    const servicioPromotion = jasmine.createSpyObj<PromotionService>('PromotionService', ['getPromotions']);
    servicioPromotion.getPromotions.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [BuffetPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AlumnoContextoService, useValue: { alumnoId: signal('alumno-1') } },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: BuffetService, useValue: servicioBuffet },
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: ToastService, useValue: servicioToast },
        { provide: FavoritosService, useValue: servicioFavoritos },
        { provide: CompraService, useValue: servicioCompra },
        { provide: CarritosFavoritosService, useValue: servicioCarritosFavoritos },
        { provide: RestriccionProductoService, useValue: servicioRestriccionProducto },
        { provide: FranjasHorariasService, useValue: servicioFranjas },
        { provide: RestriccionesHorariasService, useValue: servicioRestriccionesHorarias },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        { provide: RestriccionesNutricionalesService, useValue: servicioRestriccionesNutricionales },
        { provide: PromotionService, useValue: servicioPromotion },
      ],
    })
      .overrideComponent(BuffetPage, {
        remove: {
          imports: [NavbarComponent, ProductoCardComponent, SeleccionarAlumnoModalComponent, GuardarFavoritoModalComponent],
        },
        add: {
          imports: [NavbarStub, ProductoCardStub, SeleccionarAlumnoModalStub, GuardarFavoritoModalStub],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(BuffetPage);
  });

  it('dado los productos del back, cuando monto la pagina, deberia renderizar un ProductoCard por producto a traves del presenter real', fakeAsync(() => {
    whenMontoLaPagina();

    const cards = obtenerCardsDeProducto();
    expect(cards.length).toBe(3);
    const nombres = cards.map((c) => c.producto?.nombre);
    expect(nombres).toContain('Agua Mineral');
    expect(nombres).toContain('Alfajor');
    expect(nombres).toContain('Galletitas Oreo');
  }));

  it('dado un alumno cargado, cuando monto la pagina, deberia mostrar el nombre y el saldo en el header', fakeAsync(() => {
    whenMontoLaPagina();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Julián');
    expect(root.textContent).toContain('Fernando Fader');
    expect(root.textContent).toContain('25.000');
  }));

  it('dado la pagina montada, cuando hago click en volver, deberia navegar al home del rol', fakeAsync(() => {
    whenMontoLaPagina();

    whenHagoClickEnVolver();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
  }));

  it('dado un ProductoCard renderizado, cuando emite toggleFavorito, deberia llamar al servicio de favoritos a traves del presenter real', fakeAsync(() => {
    whenMontoLaPagina();
    const card = obtenerCardsDeProducto()[0];

    card.toggleFavorito.emit(PRODUCTO_DISPONIBLE);
    tick();

    expect(TestBed.inject(FavoritosService).agregarFavorito).toHaveBeenCalled();
  }));

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function whenHagoClickEnVolver(): void {
    const volver = (fixture.nativeElement as HTMLElement).querySelector('.buffet__volver') as HTMLButtonElement;
    volver.click();
  }

  function obtenerCardsDeProducto(): ProductoCardStub[] {
    return fixture.debugElement
      .queryAll(By.directive(ProductoCardStub))
      .map((d) => d.componentInstance as ProductoCardStub);
  }
});
