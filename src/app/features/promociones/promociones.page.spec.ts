import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import {
  PromocionesPagePresenter,
  PromotionWithProducts,
} from './presenter/promociones.presenter';
import { PromocionesPageComponent } from './promociones.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

interface PresenterMock {
  promotions: ReturnType<typeof signal<PromotionWithProducts[]>>;
  isLoading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string | null>>;
  hasPromotions: ReturnType<typeof signal<boolean>>;
  filter: ReturnType<typeof signal<string>>;
  sort: ReturnType<typeof signal<string>>;
  filteredPromotions: ReturnType<typeof signal<PromotionWithProducts[]>>;
  loadPromotions: jasmine.Spy;
  volver: jasmine.Spy;
  nuevaPromocion: jasmine.Spy;
  toggleStatus: jasmine.Spy;
  setFilter: jasmine.Spy;
  setSort: jasmine.Spy;
  getPromotionStateClass: jasmine.Spy;
  isExpiringSoon: jasmine.Spy;
  getStatusLabel: jasmine.Spy;
  getOriginalTotal: jasmine.Spy;
  getDiscountedTotal: jasmine.Spy;
  getVisibleProducts: jasmine.Spy;
  getHiddenProductsCount: jasmine.Spy;
}

describe('PromocionesPageComponent', () => {
  let component: PromocionesPageComponent;
  let fixture: ComponentFixture<PromocionesPageComponent>;
  let presenter: PresenterMock;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    presenter = crearPresenterMock();

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Kiosquero Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [PromocionesPageComponent],
      providers: [
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(PromocionesPageComponent, {
        remove: {
          imports: [NavbarComponent],
          providers: [PromocionesPagePresenter],
        },
        add: {
          imports: [NavbarStub],
          providers: [{ provide: PromocionesPagePresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PromocionesPageComponent);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado que se instancia la page, deberia setear /kiosquero como home', () => {
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    });

    it('dado el componente, cuando se monta, deberia pedir las promociones al presenter', () => {
      whenMonto();

      expect(presenter.loadPromotions).toHaveBeenCalled();
    });

    it('dado el usuario logueado, deberia exponer su nombre para el navbar', () => {
      expect(component.nombreUsuario).toBe('Kiosquero Test');
    });
  });

  describe('render segun estado del presenter', () => {
    it('dado que el presenter esta cargando, deberia mostrar el estado de carga', () => {
      presenter.isLoading.set(true);

      whenMonto();

      const texto = thenTexto();
      expect(texto).toContain('Cargando promociones');
    });

    it('dado un error en el presenter, deberia mostrar el mensaje de error', () => {
      presenter.error.set('Explotó todo');

      whenMonto();

      const texto = thenTexto();
      expect(texto).toContain('Explotó todo');
      expect(texto).toContain('hubo un problema');
    });

    it('dado que no hay promociones, deberia mostrar el estado vacio', () => {
      presenter.hasPromotions.set(false);

      whenMonto();

      const texto = thenTexto();
      expect(texto).toContain('Aún no hay promociones');
    });

    it('dado promociones cargadas, deberia renderizar una card por promocion', () => {
      const promo = crearPromocion({ id: 'p-1', name: 'Combo desayuno' });
      presenter.promotions.set([promo]);
      presenter.hasPromotions.set(true);
      presenter.getVisibleProducts.and.returnValue([]);
      presenter.getHiddenProductsCount.and.returnValue(0);
      presenter.getStatusLabel.and.returnValue('Activa');

      whenMonto();

      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.promotion-card');
      expect(cards.length).toBe(1);
      const texto = thenTexto();
      expect(texto).toContain('Combo desayuno');
    });
  });

  describe('acciones', () => {
    beforeEach(() => {
      presenter.hasPromotions.set(false);
      whenMonto();
    });

    it('dado el header, cuando hago click en Volver, deberia llamar presenter.volver()', () => {
      const boton = (fixture.nativeElement as HTMLElement).querySelector('.btn-volver') as HTMLButtonElement;
      boton.click();

      expect(presenter.volver).toHaveBeenCalled();
    });

    it('dado el header, cuando hago click en Nueva Promocion, deberia llamar presenter.nuevaPromocion()', () => {
      const boton = (fixture.nativeElement as HTMLElement).querySelector('.btn-primary') as HTMLButtonElement;
      boton.click();

      expect(presenter.nuevaPromocion).toHaveBeenCalled();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function thenTexto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function crearPresenterMock(): PresenterMock {
    const promotions = signal<PromotionWithProducts[]>([]);
    const isLoading = signal(false);
    const error = signal<string | null>(null);
    const hasPromotions = signal(false);

    const filter = signal<string>('ALL');
    const sort = signal<string>('DATE_DESC');
    const filteredPromotions = promotions; // alias

    return {
      promotions,
      isLoading,
      error,
      hasPromotions,
      filter,
      sort,
      filteredPromotions,
      loadPromotions: jasmine.createSpy('loadPromotions'),
      volver: jasmine.createSpy('volver'),
      nuevaPromocion: jasmine.createSpy('nuevaPromocion'),
      toggleStatus: jasmine.createSpy('toggleStatus'),
      setFilter: jasmine.createSpy('setFilter'),
      setSort: jasmine.createSpy('setSort'),
      getPromotionStateClass: jasmine.createSpy('getPromotionStateClass').and.returnValue(''),
      isExpiringSoon: jasmine.createSpy('isExpiringSoon').and.returnValue(false),
      getStatusLabel: jasmine.createSpy('getStatusLabel').and.returnValue(''),
      getOriginalTotal: jasmine.createSpy('getOriginalTotal').and.returnValue(0),
      getDiscountedTotal: jasmine.createSpy('getDiscountedTotal').and.returnValue(0),
      getVisibleProducts: jasmine.createSpy('getVisibleProducts').and.returnValue([]),
      getHiddenProductsCount: jasmine.createSpy('getHiddenProductsCount').and.returnValue(0),
    };
  }

  function crearPromocion(override: Partial<PromotionWithProducts> = {}): PromotionWithProducts {
    return {
      id: 'promo-1',
      name: 'Promo test',
      discountPercentage: 10,
      productIds: [],
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T00:00:00Z',
      status: 'ACTIVE',
      imageUrl: undefined,
      products: [],
      ...override,
    };
  }
});
