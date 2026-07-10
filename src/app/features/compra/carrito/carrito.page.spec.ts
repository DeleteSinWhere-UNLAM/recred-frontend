import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { CarritoFavoritoResponse } from '../../carritos-favoritos/models/carritos-favoritos.model';
import { CarritosFavoritosService } from '../../carritos-favoritos/services/carritos-favoritos.service';
import {
  ItemCarritoMother,
  OrdenAlumnoMother,
} from '../compra.mother';
import { GuardarFavoritoModalComponent } from '../components/guardar-favorito-modal/guardar-favorito-modal.component';
import { OrdenAlumnoCardComponent } from '../components/orden-alumno-card/orden-alumno-card.component';
import {
  ResumenLinea,
  ResumenOrdenCardComponent,
} from '../components/resumen-orden-card/resumen-orden-card.component';
import { SugerenciasCarritoComponent } from '../components/sugerencias-carrito/sugerencias-carrito.component';
import { CarritoPage } from './carrito.page';
import { CarritoPresenter } from './presenter/carrito.presenter';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-orden-alumno-card', template: '', standalone: true })
class OrdenAlumnoCardStub {
  @Input() alumno!: unknown;
  @Input() items: unknown[] = [];
  @Input() seleccionado = false;
  @Input() fecha = '';
  @Input() recreo = '';
  @Input() recreosDisponibles: unknown[] = [];
  @Input() fechaMinima = '';
  @Input() motivoBloqueoPresupuesto?: string;
  @Input() modoSoloLectura = false;
  @Input() favoritoDeshabilitado = false;
  @Output() toggleSeleccion = new EventEmitter<void>();
  @Output() fechaCambia = new EventEmitter<string>();
  @Output() recreoCambia = new EventEmitter<string>();
  @Output() sumarItem = new EventEmitter<string>();
  @Output() restarItem = new EventEmitter<string>();
  @Output() eliminarItem = new EventEmitter<string>();
  @Output() guardarFavorito = new EventEmitter<void>();
  @Output() editarRetiro = new EventEmitter<void>();
}

@Component({ selector: 'app-resumen-orden-card', template: '', standalone: true })
class ResumenOrdenCardStub {
  @Input() lineas: ResumenLinea[] = [];
  @Input() total = 0;
  @Input() ctaLabel = '';
  @Input() ctaDeshabilitado = false;
  @Input() cargando = false;
  @Input() advertencia: string | null = null;
  @Output() accion = new EventEmitter<void>();
}

@Component({ selector: 'app-sugerencias-carrito', template: '', standalone: true })
class SugerenciasCarritoStub {
  @Input() sugerencias: unknown[] = [];
  @Input() cargando = false;
  @Output() agregar = new EventEmitter<unknown>();
}

@Component({ selector: 'app-guardar-favorito-modal', template: '', standalone: true })
class GuardarFavoritoModalStub {
  @Input() cartId: string | null = null;
  @Input() initialNombre = '';
  @Input() initialAlumnoId = '';
  @Input() items: unknown[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
}

interface PerfilTest {
  id: string;
  nombre: string;
  plan?: string;
}

class PerfilTestMother {
  static intermedio(): PerfilTest {
    return { id: 'p-1', nombre: 'Tutor', plan: 'INTERMEDIO' };
  }
  static gratuito(): PerfilTest {
    return { id: 'p-1', nombre: 'Tutor', plan: 'GRATUITO' };
  }
}

describe('CarritoPage', () => {
  let fixture: ComponentFixture<CarritoPage>;
  let component: CarritoPage;
  let carritosFavoritosService: jasmine.SpyObj<CarritosFavoritosService>;
  let perfilSignal: ReturnType<typeof signal<PerfilTest | null>>;

  describe('ngOnInit', () => {
    it('cuando se monta la page, deberia iniciar el presenter y pedir los carritos favoritos', async () => {
      await givenPageConfigurada();

      whenMonto();

      expect(carritosFavoritosService.getCarritosFavoritos).toHaveBeenCalled();
      expect(component['cantCarritos']()).toBe(0);
    });

    it('dado que falla la carga de carritos, cuando se monta, deberia loguear el error sin romper', async () => {
      spyOn(console, 'error');
      await givenPageConfigurada();
      carritosFavoritosService.getCarritosFavoritos.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('lineasResumen', () => {
    it('dado vista alumno, cada linea deberia mostrar "nombre apellido"', async () => {
      await givenPageConfigurada();
      const usuarioService = TestBed.inject(UsuarioService) as unknown as {
        esVistaAlumno: WritableSignal<boolean>;
      };
      usuarioService.esVistaAlumno.set(true);
      whenMonto();

      const lineas = (component as unknown as { lineasResumen(): { nombre: string }[] }).lineasResumen();

      expect(lineas[0].nombre).toContain(' ');
    });

    it('dado vista tutor, cada linea deberia mostrar solo el nombre', async () => {
      await givenPageConfigurada();
      whenMonto();

      const lineas = (component as unknown as { lineasResumen(): { nombre: string }[] }).lineasResumen();

      expect(lineas[0].nombre.includes(' ')).toBeFalse();
    });
  });

  describe('esPremium / esPlanGratuito / limiteCarritosAlcanzado', () => {
    it('dado plan INTERMEDIO, cuando consulto el plan, esPremium true y sin limite', async () => {
      await givenPageConfigurada(PerfilTestMother.intermedio());
      whenMonto();

      expect(component['esPremium']()).toBeTrue();
      expect(component['esPlanGratuito']()).toBeFalse();
      expect(component['limiteCarritosAlcanzado']()).toBeFalse();
    });

    it('dado plan GRATUITO con 5 carritos, cuando consulto el limite, deberia ser true', async () => {
      await givenPageConfigurada(PerfilTestMother.gratuito());
      carritosFavoritosService.getCarritosFavoritos.and.returnValue(
        of([{}, {}, {}, {}, {}] as unknown as CarritoFavoritoResponse[]),
      );

      whenMonto();

      expect(component['limiteCarritosAlcanzado']()).toBeTrue();
    });
  });

  describe('modal favorito', () => {
    beforeEach(async () => {
      await givenPageConfigurada();
      whenMonto();
    });

    it('cuando abro el modal, deberia setear items mapeados desde los ItemCarrito y prender la flag', () => {
      const items = [
        ItemCarritoMother.crear({ id: 'i-1', cantidad: 2 }),
        ItemCarritoMother.crear({ id: 'i-2', cantidad: 3 }),
      ];

      component.abrirModalFavorito('alumno-1', items);

      expect(component.mostrarModalFavorito).toBeTrue();
      expect(component.favoritoModalAlumnoId).toBe('alumno-1');
      expect(component.favoritoModalItems.length).toBe(2);
      expect(component.favoritoModalItems[0].quantity).toBe(2);
      expect(component.favoritoModalItems[0].productId).toBe(items[0].producto.id);
    });

    it('cuando cierro el modal, deberia limpiar la flag, alumnoId y items', () => {
      component.mostrarModalFavorito = true;
      component.favoritoModalAlumnoId = 'alumno-1';
      component.favoritoModalItems = [{ productId: 'p1', productName: 'A', price: 1, quantity: 1 }];

      component.cerrarModalFavorito();

      expect(component.mostrarModalFavorito).toBeFalse();
      expect(component.favoritoModalAlumnoId).toBe('');
      expect(component.favoritoModalItems).toEqual([]);
    });
  });

  async function givenPageConfigurada(perfil: PerfilTest | null = PerfilTestMother.intermedio()): Promise<void> {
    perfilSignal = signal<PerfilTest | null>(perfil);
    const esPlanGratuito = () => {
      const plan = perfilSignal()?.plan?.toUpperCase();
      return plan !== 'INTERMEDIO' && plan !== 'AVANZADO';
    };

    const presenter = {
      init: jasmine.createSpy('init'),
      grupos: signal([{ alumno: OrdenAlumnoMother.crear().alumno, items: [], subtotal: 0, seleccionado: true, fecha: '', recreo: 'PRIMER_RECREO' }]),
      carritoVacio: signal(false),
      totalSeleccionado: signal(0),
      haySeleccion: signal(false),
      hayFechaFaltante: signal(false),
      hayRecreoBloqueadoSeleccionado: signal(false),
      avanzarPosible: signal(false),
      advertencia: signal(null),
      sugerencias: signal([]),
      cargandoSugerencias: signal(false),
      mostrarSugerencias: signal(false),
      recreosDisponiblesMap: signal({}),
      fechaMinimaMap: signal({}),
      fechaMinima: '2026-01-01',
      budgetBlockReasons: signal({}),
      esModoSoloLectura: signal(true),
      blockedRecreos: signal({}),
      agregarSugerencia: jasmine.createSpy('agregarSugerencia'),
      toggleSeleccion: jasmine.createSpy('toggleSeleccion'),
      eliminarItem: jasmine.createSpy('eliminarItem'),
      sumar: jasmine.createSpy('sumar'),
      restar: jasmine.createSpy('restar'),
      cambiarFecha: jasmine.createSpy('cambiarFecha'),
      cambiarRecreo: jasmine.createSpy('cambiarRecreo'),
      irConfirmar: jasmine.createSpy('irConfirmar'),
      volver: jasmine.createSpy('volver'),
      editarRetiro: jasmine.createSpy('editarRetiro'),
    };

    carritosFavoritosService = jasmine.createSpyObj<CarritosFavoritosService>('CarritosFavoritosService', [
      'getCarritosFavoritos',
    ]);
    carritosFavoritosService.getCarritosFavoritos.and.returnValue(of([]));

    const usuarioService = {
      nombreNavbar: signal('Tutor Test'),
      esVistaAlumno: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [CarritoPage],
      providers: [
        { provide: UsuarioService, useValue: usuarioService },
        { provide: PerfilService, useValue: { perfil: perfilSignal, esPlanGratuito } },
        { provide: CarritosFavoritosService, useValue: carritosFavoritosService },
      ],
    })
      .overrideComponent(CarritoPage, {
        remove: {
          imports: [
            NavbarComponent,
            OrdenAlumnoCardComponent,
            ResumenOrdenCardComponent,
            SugerenciasCarritoComponent,
            GuardarFavoritoModalComponent,
          ],
        },
        add: {
          imports: [
            NavbarStub,
            OrdenAlumnoCardStub,
            ResumenOrdenCardStub,
            SugerenciasCarritoStub,
            GuardarFavoritoModalStub,
          ],
          providers: [{ provide: CarritoPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CarritoPage);
    component = fixture.componentInstance;
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
