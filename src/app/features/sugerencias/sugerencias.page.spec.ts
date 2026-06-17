import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciasPage } from './sugerencias.page';
import { SugerenciasPresenter } from './presenter/sugerencias.presenter';
import { Router } from '@angular/router';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { Product } from '../updated-inventory/models/product.interface';
import { SugerenciaProducto } from './models/sugerencia-producto.model';

@Component({
  selector: 'app-combo-promotion-modal',
  standalone: true,
  template: ''
})
class MockComboPromotionModalComponent {
  @Input() baseProductName!: string;
  @Input() suggestedProducts: Product[] = [];
  @Output() confirmPromotion = new EventEmitter<{ discountPercentage: number, startDate: string, endDate: string, productIds: string[] }>();
  @Output() closeModal = new EventEmitter<void>();
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: ''
})
class MockNavbarComponent {
  @Input() userName!: string;
}

describe('SugerenciasPage', () => {
  let component: SugerenciasPage;
  let fixture: ComponentFixture<SugerenciasPage>;
  let mockPresenter: jasmine.SpyObj<SugerenciasPresenter>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('SugerenciasPresenter', [
      'initialize',
      'openComboPromotionModal',
      'generatePromotion',
      'closeComboPromotionModal',
      'seleccionarProducto'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['setHomeUrl', 'getUsuarioActual']);
    mockUsuarioService.getUsuarioActual.and.returnValue({ nombre: 'Test User', id: 'test-id' });

    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'test-id' }));

    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: UsuarioService, useValue: mockUsuarioService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(SugerenciasPage, {
        set: {
          imports: [CommonModule, MockNavbarComponent, MockComboPromotionModalComponent],
          providers: [
            { provide: SugerenciasPresenter, useValue: mockPresenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(SugerenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear la página', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el presenter con el ID de usuario del localStorage', () => {
    expect(mockPresenter.initialize).toHaveBeenCalledWith('test-id');
  });

  it('volver debería navegar a /kiosquero', () => {
    component.volver();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  it('seleccionarProducto debería llamar a seleccionarProducto en el presenter', () => {
    const mockSugerencia = {} as SugerenciaProducto;
    component.seleccionarProducto(mockSugerencia);
    expect(mockPresenter.seleccionarProducto).toHaveBeenCalledWith(mockSugerencia);
  });

  it('onGenerarPromocion debería abrir el modal', () => {
    component.onGenerarPromocion();
    expect(mockPresenter.openComboPromotionModal).toHaveBeenCalled();
  });

  it('onConfirmPromotion debería llamar a generatePromotion en el presenter', () => {
    const mockData = {} as { discountPercentage: number, startDate: string, endDate: string, productIds: string[] };
    component.onConfirmPromotion(mockData);
    expect(mockPresenter.generatePromotion).toHaveBeenCalledWith(mockData);
  });

  it('onCloseModal debería cerrar el modal', () => {
    component.onCloseModal();
    expect(mockPresenter.closeComboPromotionModal).toHaveBeenCalled();
  });
});
