import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { of } from 'rxjs';
import { SugerenciasPage } from './sugerencias.page';
import { SugerenciasService } from './services/sugerencias.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PromotionService } from '../../data-access/services/promociones/promotion.service';
import { ToastService } from '../../shared/services/toast.service';
import { ProductoService } from '../inventario/services/producto.service';
import { SugerenciaProducto } from './models/sugerencia-producto.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ComboPromotionModalComponent } from './components/combo-promotion-modal/combo-promotion-modal.component';

class SugerenciasIntegrationMother {
  static crearUsuario() {
    return { id: 'user-1', nombre: 'Test Kiosquero', rol: 'KIOSQUERO' };
  }

  static crearSugerencias(): SugerenciaProducto[] {
    return [
      {
        productoOriginal: 'Alfajor',
        estadisticasVenta: {
          productoId: 'p1',
          stockActual: 50,
          diasSinVenta: 15,
          ventasPeriodo: 5
        }
      } as SugerenciaProducto,
      {
        productoOriginal: 'Gaseosa',
        estadisticasVenta: {
          productoId: 'p2',
          stockActual: 20,
          diasSinVenta: 5,
          ventasPeriodo: 30
        }
      } as SugerenciaProducto
    ];
  }
}

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

@Component({
  selector: 'app-combo-promotion-modal',
  template: '',
  standalone: true
})
class ComboPromotionModalStub {
  @Input() baseProductName = '';
  @Input() suggestedProducts: unknown[] = [];
  @Output() confirmPromotion = new EventEmitter<Record<string, unknown>>();
  @Output() closeModal = new EventEmitter<void>();
}

describe('Sugerencias Integration', () => {
  let fixture: ComponentFixture<SugerenciasPage>;
  let router: jasmine.SpyObj<Router>;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioPromociones: jasmine.SpyObj<PromotionService>;
  let toast: jasmine.SpyObj<ToastService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    servicioSugerencias = jasmine.createSpyObj('SugerenciasService', ['getSugerencias']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    servicioPromociones = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioProducto = jasmine.createSpyObj('ProductoService', ['getById']);

    servicioUsuario.getUsuarioActual.and.returnValue(SugerenciasIntegrationMother.crearUsuario());
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(SugerenciasIntegrationMother.crearUsuario()));

    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: SugerenciasService, useValue: servicioSugerencias },
        { provide: PromotionService, useValue: servicioPromociones },
        { provide: ToastService, useValue: toast },
        { provide: ProductoService, useValue: servicioProducto }
      ]
    })
      .overrideComponent(SugerenciasPage, {
        remove: {
          imports: [NavbarComponent, ComboPromotionModalComponent]
        },
        add: {
          imports: [NavbarStub, ComboPromotionModalStub]
        }
      })
      .compileComponents();
  });

  it('debería renderizar los indicadores calculados por el presenter basándose en las sugerencias', () => {
    const sugerencias = SugerenciasIntegrationMother.crearSugerencias();
    servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));
    fixture = TestBed.createComponent(SugerenciasPage);
    
    fixture.detectChanges();

    const metricProductos = fixture.nativeElement.querySelector('.sg__metric--danger strong').textContent;
    const metricStock = fixture.nativeElement.querySelector('.sg__metric--warning strong').textContent;
    const metricDias = fixture.nativeElement.querySelector('.sg__metric--info strong').textContent;
    const metricCritico = fixture.nativeElement.querySelector('.sg__metric--success strong').textContent;
    expect(metricProductos).toContain('2');
    expect(metricStock).toContain('70');
    expect(metricDias).toContain('10 Días');
    expect(metricCritico).toContain('Alfajor');
  });

  it('debería graficar correctamente las barras de días sin venta ordenadas por criticidad', () => {
    const sugerencias = SugerenciasIntegrationMother.crearSugerencias();
    servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));
    fixture = TestBed.createComponent(SugerenciasPage);
    
    fixture.detectChanges();

    const barrasDias = fixture.debugElement.queryAll(By.css('.sg__hbar-row'));
    const etiquetaPrimerBarra = barrasDias[0].query(By.css('.sg__hbar-label strong')).nativeElement.textContent;
    const valorPrimerBarra = barrasDias[0].query(By.css('.sg__hbar-value')).nativeElement.textContent;
    expect(barrasDias.length).toBe(2);
    expect(etiquetaPrimerBarra).toContain('Alfajor');
    expect(valorPrimerBarra).toContain('15 días');
  });

  it('debería mostrar el empty state cuando el presenter no detecta sugerencias con baja rotación', () => {
    servicioSugerencias.getSugerencias.and.returnValue(of([]));
    fixture = TestBed.createComponent(SugerenciasPage);
    
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.sg__empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Excelente trabajo');
  });
});
