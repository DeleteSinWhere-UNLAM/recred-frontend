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

  it('debería setear la URL de inicio para kiosquero en el servicio y luego inicializar el presenter al cargar la vista', () => {
      
    fixture.detectChanges();

    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    expect(presenter.initialize).toHaveBeenCalled();
  });


  it('debería delegar al router la navegación hacia el home al presionar volver', () => {
    
    const urlDestino = '/kiosquero';
    
    component.volver();
    
    expect(router.navigateByUrl).toHaveBeenCalledWith(urlDestino);
  });

  it('debería delegar al presenter la selección de un producto', () => {
    
    const sugerencia = SugerenciasMother.crearSugerencia();
    
    component.seleccionarProducto(sugerencia);
    
    expect(presenter.seleccionarProducto).toHaveBeenCalledWith(sugerencia);
  });

  it('debería solicitar al presenter la apertura del modal promocional', () => {
    
    component.onGenerarPromocion();
    
    expect(presenter.openComboPromotionModal).toHaveBeenCalled();
  });

  it('debería solicitar al presenter la generación de la promoción confirmada', () => {
    
    const datosPromocion = { discountPercentage: 10, startDate: 'hoy', endDate: 'manana', productIds: ['1'] };
    
    component.onConfirmPromotion(datosPromocion);
    
    expect(presenter.generatePromotion).toHaveBeenCalledWith(datosPromocion);
  });

  it('debería solicitar al presenter el cierre del modal promocional', () => {
    
    component.onCloseModal();
    
    expect(presenter.closeComboPromotionModal).toHaveBeenCalled();
  });
});
