import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ProductoInventarioMother } from '../../../inventario/inventario.mother';
import { Producto } from '../../../inventario/models/producto.interface';
import { ListaEstacionalComponent } from '../../components/lista-estacional/lista-estacional.component';
import { ModalAprobarPromocionIaComponent } from '../../components/modal-aprobar-promocion-ia/modal-aprobar-promocion-ia.component';
import {
  InfoClima,
  InfoEstacion,
  PromocionSugerida,
  Sugerencia,
} from '../../models/recomendacion.model';
import {
  InfoClimaMother,
  InfoEstacionMother,
  PromocionSugeridaMother,
  SugerenciaMother,
} from '../../recomendaciones-estacionales.mother';
import { RecomendacionesPagePresenter } from './presenter/recomendaciones-page.presenter';
import { RecomendacionesPageComponent } from './recomendaciones-page.component';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-seasonal-list', template: '', standalone: true })
class ListaEstacionalStub {
  @Input() sugerencias: Sugerencia[] = [];
  @Input() tipPromocional: string | null = null;
  @Input() hasTipAction = false;
  @Input() tipActionText = '';
  @Input() tipActionIcon = '';
  @Output() tipActionClick = new EventEmitter<void>();
}

@Component({ selector: 'app-ia-promotion-approval-modal', template: '', standalone: true })
class ModalAprobarPromocionIaStub {
  @Input() suggestedPromotion!: PromocionSugerida;
  @Input() resolvedProducts: Producto[] = [];
  @Output() confirmPromotion = new EventEmitter<unknown>();
  @Output() closeModal = new EventEmitter<void>();
}

interface PresenterFake {
  loadRecommendations: jasmine.Spy<() => void>;
  volver: jasmine.Spy<() => void>;
  abrirModalPromocion: jasmine.Spy<() => void>;
  closeModal: jasmine.Spy<() => void>;
  confirmPromotion: jasmine.Spy<(f: unknown) => void>;
  isLoading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  sugerencias: WritableSignal<Sugerencia[]>;
  tipPromocional: WritableSignal<string | null>;
  shouldShowPromotionModal: WritableSignal<boolean>;
  showModal: WritableSignal<boolean>;
  suggestedPromotion: WritableSignal<PromocionSugerida | null>;
  seasonInfo: WritableSignal<InfoEstacion | null>;
  weatherInfo: WritableSignal<InfoClima | null>;
  resolvedProducts: WritableSignal<Producto[]>;
}

describe('RecomendacionesPageComponent', () => {
  let component: RecomendacionesPageComponent;
  let fixture: ComponentFixture<RecomendacionesPageComponent>;
  let presenterFake: PresenterFake;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    presenterFake = crearPresenterFake();

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Test Kiosquero',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [RecomendacionesPageComponent],
      providers: [{ provide: UsuarioService, useValue: servicioUsuario }],
    })
      .overrideComponent(RecomendacionesPageComponent, {
        remove: {
          imports: [NavbarComponent, ListaEstacionalComponent, ModalAprobarPromocionIaComponent],
        },
        add: {
          imports: [NavbarStub, ListaEstacionalStub, ModalAprobarPromocionIaStub],
          providers: [{ provide: RecomendacionesPagePresenter, useValue: presenterFake }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecomendacionesPageComponent);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado el componente al construirse, deberia setear /kiosquero como home del usuario', () => {
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    });

    it('dado el componente, cuando corre ngOnInit, deberia llamar loadRecommendations del presenter', () => {
      whenMonto();

      expect(presenterFake.loadRecommendations).toHaveBeenCalled();
    });

    it('dado el UsuarioService, deberia exponer nombreUsuario', () => {
      expect(component.nombreUsuario).toBe('Test Kiosquero');
    });
  });

  describe('render de sub-componentes', () => {
    it('dado sugerencias y tip del presenter, deberia propagarlos al ListaEstacional stub', () => {
      presenterFake.sugerencias.set([SugerenciaMother.crear(), SugerenciaMother.crearReducir()]);
      presenterFake.tipPromocional.set('Aprovecha el invierno');
      presenterFake.seasonInfo.set(InfoEstacionMother.crear());
      presenterFake.weatherInfo.set(InfoClimaMother.crear());

      whenMonto();

      const lista = fixture.debugElement.query(
        (d) => d.componentInstance instanceof ListaEstacionalStub,
      )?.componentInstance as ListaEstacionalStub;
      expect(lista.sugerencias.length).toBe(2);
      expect(lista.tipPromocional).toBe('Aprovecha el invierno');
    });

    it('dado shouldShowPromotionModal en true, deberia renderizar el modal stub con la promocion y productos resueltos', () => {
      presenterFake.suggestedPromotion.set(PromocionSugeridaMother.crear());
      presenterFake.resolvedProducts.set([ProductoInventarioMother.crear({ id: 'prod-1' })]);
      presenterFake.shouldShowPromotionModal.set(true);

      whenMonto();

      const modal = fixture.debugElement.query(
        (d) => d.componentInstance instanceof ModalAprobarPromocionIaStub,
      )?.componentInstance as ModalAprobarPromocionIaStub;
      expect(modal).toBeTruthy();
      expect(modal.suggestedPromotion.nombre).toBe('Combo Invierno');
      expect(modal.resolvedProducts.length).toBe(1);
    });

    it('dado shouldShowPromotionModal en false, no deberia renderizar el modal stub', () => {
      presenterFake.shouldShowPromotionModal.set(false);

      whenMonto();

      const modal = fixture.debugElement.query(
        (d) => d.componentInstance instanceof ModalAprobarPromocionIaStub,
      );
      expect(modal).toBeNull();
    });
  });

  function crearPresenterFake(): PresenterFake {
    const spy = jasmine.createSpyObj('RecomendacionesPagePresenter', [
      'loadRecommendations',
      'volver',
      'abrirModalPromocion',
      'closeModal',
      'confirmPromotion',
    ]);
    return Object.assign(spy, {
      isLoading: signal(false),
      error: signal<string | null>(null),
      sugerencias: signal<Sugerencia[]>([]),
      tipPromocional: signal<string | null>(null),
      shouldShowPromotionModal: signal(false),
      showModal: signal(false),
      suggestedPromotion: signal<PromocionSugerida | null>(null),
      seasonInfo: signal<InfoEstacion | null>(null),
      weatherInfo: signal<InfoClima | null>(null),
      resolvedProducts: signal<Producto[]>([]),
    }) as unknown as PresenterFake;
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
