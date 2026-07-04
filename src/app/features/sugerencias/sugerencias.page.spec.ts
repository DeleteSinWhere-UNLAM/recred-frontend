import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciasPage } from './sugerencias.page';
import { SugerenciasPresenter } from './presenter/sugerencias.presenter';
import { Router } from '@angular/router';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ComboPromotionModalComponent } from './components/combo-promotion-modal/combo-promotion-modal.component';
import { SugerenciasMother } from './sugerencias.mother';

@Component({
  selector: 'app-combo-promotion-modal',
  standalone: true,
  template: ''
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
  template: ''
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
    presenter = jasmine.createSpyObj('SugerenciasPresenter', [
      'initialize',
      'openComboPromotionModal',
      'generatePromotion',
      'closeComboPromotionModal',
      'seleccionarProducto'
    ]);
    
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl', 'getUsuarioActual']);
    
    servicioUsuario.getUsuarioActual.and.returnValue(SugerenciasMother.crearUsuario());
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(SugerenciasMother.crearUsuario()));

    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(SugerenciasPage, {
        remove: {
          imports: [NavbarComponent, ComboPromotionModalComponent]
        },
        add: {
          imports: [NavbarStub, ComboPromotionModalStub],
          providers: [
            { provide: SugerenciasPresenter, useValue: presenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(SugerenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería configurar la url de inicio del kiosquero al construirse', () => {
    thenHomeUrlFueConfigurada('/kiosquero');
  });

  it('debería delegar al presenter la inicialización cuando el usuario existe en sesión', () => {
    thenSeDelegoLaInicializacionAlPresenter('test-id');
  });

  it('no debería delegar la inicialización al presenter cuando el usuario no existe en sesión', () => {
    givenNoExisteUsuarioEnSesion();
    whenElComponenteInicializa();
    thenNoSeDelegoLaInicializacionAlPresenter();
  });

  it('debería delegar al router la navegación hacia el home al presionar volver', () => {
    whenElUsuarioPresionaVolver();
    thenSeNavegaHacia('/kiosquero');
  });

  it('debería delegar al presenter la selección de un producto', () => {
    const sugerencia = SugerenciasMother.crearSugerencia();
    whenSeSeleccionaUnProducto(sugerencia);
    thenSeDelegaSeleccionAlPresenter(sugerencia);
  });

  it('debería solicitar al presenter la apertura del modal promocional', () => {
    whenElUsuarioGeneraPromocion();
    thenSeSolicitaAbrirModalAlPresenter();
  });

  it('debería solicitar al presenter la generación de la promoción confirmada', () => {
    const datosPromocion = { discountPercentage: 10, startDate: 'hoy', endDate: 'manana', productIds: ['1'] };
    whenElUsuarioConfirmaPromocion(datosPromocion);
    thenSeSolicitaGenerarPromocionAlPresenter(datosPromocion);
  });

  it('debería solicitar al presenter el cierre del modal promocional', () => {
    whenElUsuarioCierraElModal();
    thenSeSolicitaCerrarModalAlPresenter();
  });

  function givenNoExisteUsuarioEnSesion(): void {
    presenter.initialize.calls.reset();
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);
  }

  function whenElComponenteInicializa(): void {
    component.ngOnInit();
  }

  function whenElUsuarioPresionaVolver(): void {
    component.volver();
  }

  function whenSeSeleccionaUnProducto(sugerencia: any): void {
    component.seleccionarProducto(sugerencia);
  }

  function whenElUsuarioGeneraPromocion(): void {
    component.onGenerarPromocion();
  }

  function whenElUsuarioConfirmaPromocion(datos: any): void {
    component.onConfirmPromotion(datos);
  }

  function whenElUsuarioCierraElModal(): void {
    component.onCloseModal();
  }

  function thenHomeUrlFueConfigurada(url: string): void {
    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith(url);
  }

  function thenSeDelegoLaInicializacionAlPresenter(id: string): void {
    expect(presenter.initialize).toHaveBeenCalledWith(id);
  }

  function thenNoSeDelegoLaInicializacionAlPresenter(): void {
    expect(presenter.initialize).not.toHaveBeenCalled();
  }

  function thenSeNavegaHacia(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }

  function thenSeDelegaSeleccionAlPresenter(sugerencia: any): void {
    expect(presenter.seleccionarProducto).toHaveBeenCalledWith(sugerencia);
  }

  function thenSeSolicitaAbrirModalAlPresenter(): void {
    expect(presenter.openComboPromotionModal).toHaveBeenCalled();
  }

  function thenSeSolicitaGenerarPromocionAlPresenter(datos: any): void {
    expect(presenter.generatePromotion).toHaveBeenCalledWith(datos);
  }

  function thenSeSolicitaCerrarModalAlPresenter(): void {
    expect(presenter.closeComboPromotionModal).toHaveBeenCalled();
  }
});
