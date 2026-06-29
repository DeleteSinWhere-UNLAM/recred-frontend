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
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ComboPromotionModalComponent } from './components/combo-promotion-modal/combo-promotion-modal.component';
import { SugerenciasMother } from './sugerencias.mother';



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

    servicioUsuario.getUsuarioActual.and.returnValue(SugerenciasMother.crearUsuario({ rol: 'KIOSQUERO' } as unknown as Parameters<typeof SugerenciasMother.crearUsuario>[0]));
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(SugerenciasMother.crearUsuario({ rol: 'KIOSQUERO' } as unknown as Parameters<typeof SugerenciasMother.crearUsuario>[0])));

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
    const sugerencias = SugerenciasMother.crearSugerencias();
    servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));
    fixture = TestBed.createComponent(SugerenciasPage);
    
    fixture.detectChanges();

    const metricProductos = fixture.nativeElement.querySelector('.sg__metric--danger strong').textContent;
    const metricStock = fixture.nativeElement.querySelector('.sg__metric--warning strong').textContent;
    const metricDias = fixture.nativeElement.querySelector('.sg__metric--info strong').textContent;
    const metricCritico = fixture.nativeElement.querySelector('.sg__metric--success strong').textContent;
    expect(metricProductos).toContain('2');
    expect(metricStock).toContain('30');
    expect(metricDias).toContain('8');
    expect(metricCritico).toContain('Producto 2');
  });

  it('debería graficar correctamente las barras de días sin venta ordenadas por criticidad', () => {
    const sugerencias = SugerenciasMother.crearSugerencias();
    servicioSugerencias.getSugerencias.and.returnValue(of(sugerencias));
    fixture = TestBed.createComponent(SugerenciasPage);
    
    fixture.detectChanges();

    const barrasDias = fixture.debugElement.queryAll(By.css('.sg__hbar-row'));
    const etiquetaPrimerBarra = barrasDias[0].query(By.css('.sg__hbar-label strong')).nativeElement.textContent;
    const valorPrimerBarra = barrasDias[0].query(By.css('.sg__hbar-value')).nativeElement.textContent;
    expect(barrasDias.length).toBe(2);
    expect(etiquetaPrimerBarra).toContain('Producto 2');
    expect(valorPrimerBarra).toContain('10');
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
