import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ComboPromotionModalComponent } from './components/combo-promotion-modal/combo-promotion-modal.component';
import { SugerenciasPresenter } from './presenter/sugerencias.presenter';
import {
  SugerenciaProductoMother,
  USUARIO_ID_TEST,
  UsuarioMother,
} from './sugerencias.mother';
import { SugerenciasPage } from './sugerencias.page';

@Component({
  selector: 'app-combo-promotion-modal',
  standalone: true,
  template: '',
})
class ComboPromotionModalStub {
  @Input() baseProductName!: string;
  @Input() suggestedProducts: unknown[] = [];
  @Output() confirmPromotion = new EventEmitter<Record<string, unknown>>();
  @Output() closeModal = new EventEmitter<void>();
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: '',
})
class NavbarStub {
  @Input() userName!: string;
}

describe('SugerenciasPage', () => {
  let component: SugerenciasPage;
  let fixture: ComponentFixture<SugerenciasPage>;
  let presenter: jasmine.SpyObj<SugerenciasPresenter>;
  let router: jasmine.SpyObj<Router>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    presenter = jasmine.createSpyObj<SugerenciasPresenter>('SugerenciasPresenter', [
      'initialize',
      'openComboPromotionModal',
      'generatePromotion',
      'closeComboPromotionModal',
      'seleccionarProducto',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'setHomeUrl',
      'getUsuarioActual',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue(UsuarioMother.crear());

    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(SugerenciasPage, {
        remove: { imports: [NavbarComponent, ComboPromotionModalComponent] },
        add: {
          imports: [NavbarStub, ComboPromotionModalStub],
          providers: [{ provide: SugerenciasPresenter, useValue: presenter }],
        },
      })
      .compileComponents();
  });

  afterEach(() => localStorage.clear());

  describe('constructor', () => {
    it('cuando se construye la page, deberia setear la homeUrl del kiosquero', () => {
      givenUsuarioEnLocalStorage();

      whenMonto();

      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('ngOnInit', () => {
    it('dado un usuario en localStorage, cuando se monta la page, deberia inicializar el presenter con su id', () => {
      givenUsuarioEnLocalStorage();

      whenMonto();

      expect(presenter.initialize).toHaveBeenCalledWith(USUARIO_ID_TEST);
    });

    it('dado que no hay usuario en localStorage, cuando se monta la page, no deberia inicializar el presenter', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      whenMonto();

      expect(presenter.initialize).not.toHaveBeenCalled();
    });
  });

  describe('volver', () => {
    it('cuando hago click en volver, deberia navegar a inteligencia comercial', () => {
      givenUsuarioEnLocalStorage();
      whenMonto();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/inteligencia-comercial');
    });
  });

  describe('seleccionarProducto', () => {
    it('cuando selecciono una sugerencia, deberia delegar al presenter', () => {
      givenUsuarioEnLocalStorage();
      whenMonto();

      const sugerencia = SugerenciaProductoMother.crear();
      component.seleccionarProducto(sugerencia);

      expect(presenter.seleccionarProducto).toHaveBeenCalledWith(sugerencia);
    });
  });

  describe('onGenerarPromocion', () => {
    it('cuando hago click en generar promocion, deberia pedirle al presenter abrir el modal', () => {
      givenUsuarioEnLocalStorage();
      whenMonto();

      component.onGenerarPromocion();

      expect(presenter.openComboPromotionModal).toHaveBeenCalled();
    });
  });

  describe('onConfirmPromotion', () => {
    it('cuando el modal confirma la promocion, deberia delegar al presenter los datos', () => {
      givenUsuarioEnLocalStorage();
      whenMonto();
      const datos = {
        discountPercentage: 10,
        startDate: 'hoy',
        endDate: 'manana',
        productIds: ['1'],
      };

      component.onConfirmPromotion(datos);

      expect(presenter.generatePromotion).toHaveBeenCalledWith(datos);
    });
  });

  describe('onCloseModal', () => {
    it('cuando el modal se cierra, deberia pedirle al presenter cerrarlo', () => {
      givenUsuarioEnLocalStorage();
      whenMonto();

      component.onCloseModal();

      expect(presenter.closeComboPromotionModal).toHaveBeenCalled();
    });
  });

  function givenUsuarioEnLocalStorage(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(UsuarioMother.crear()));
  }

  function whenMonto(): void {
    fixture = TestBed.createComponent(SugerenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }
});
