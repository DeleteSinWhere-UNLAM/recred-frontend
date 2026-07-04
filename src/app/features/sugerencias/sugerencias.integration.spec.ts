import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PromotionService } from '../../data-access/services/promociones/promotion.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ProductoService } from '../inventario/services/producto.service';
import { ComboPromotionModalComponent } from './components/combo-promotion-modal/combo-promotion-modal.component';
import { SugerenciasService } from './services/sugerencias.service';
import { SugerenciaProductoMother, UsuarioMother } from './sugerencias.mother';
import { SugerenciasPage } from './sugerencias.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-combo-promotion-modal', template: '', standalone: true })
class ComboPromotionModalStub {
  @Input() baseProductName = '';
  @Input() suggestedProducts: unknown[] = [];
  @Output() confirmPromotion = new EventEmitter<Record<string, unknown>>();
  @Output() closeModal = new EventEmitter<void>();
}

describe('Sugerencias Integration', () => {
  let fixture: ComponentFixture<SugerenciasPage>;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioSugerencias = jasmine.createSpyObj<SugerenciasService>('SugerenciasService', [
      'getSugerencias',
    ]);
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue(UsuarioMother.crear());
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(UsuarioMother.crear()));

    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigateByUrl']) },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: SugerenciasService, useValue: servicioSugerencias },
        {
          provide: PromotionService,
          useValue: jasmine.createSpyObj<PromotionService>('PromotionService', ['createPromotion']),
        },
        { provide: ToastService, useValue: jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']) },
        {
          provide: ProductoService,
          useValue: jasmine.createSpyObj<ProductoService>('ProductoService', ['getById']),
        },
      ],
    })
      .overrideComponent(SugerenciasPage, {
        remove: { imports: [NavbarComponent, ComboPromotionModalComponent] },
        add: { imports: [NavbarStub, ComboPromotionModalStub] },
      })
      .compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('dadas dos sugerencias, cuando se monta la page, deberia mostrar los indicadores calculados por el presenter', () => {
    servicioSugerencias.getSugerencias.and.returnValue(of(SugerenciaProductoMother.crearVarias()));

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

  it('dadas dos sugerencias, cuando se monta la page, deberia graficar las barras de dias sin venta ordenadas por criticidad', () => {
    servicioSugerencias.getSugerencias.and.returnValue(of(SugerenciaProductoMother.crearVarias()));

    fixture = TestBed.createComponent(SugerenciasPage);
    fixture.detectChanges();

    const barras = fixture.debugElement.queryAll(By.css('.sg__hbar-row'));
    expect(barras.length).toBe(2);
    expect(barras[0].query(By.css('.sg__hbar-label strong')).nativeElement.textContent).toContain(
      'Producto 2',
    );
    expect(barras[0].query(By.css('.sg__hbar-value')).nativeElement.textContent).toContain('10');
  });

  it('dado que no hay sugerencias, cuando se monta la page, deberia mostrar el empty state', () => {
    servicioSugerencias.getSugerencias.and.returnValue(of([]));

    fixture = TestBed.createComponent(SugerenciasPage);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.sg__empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Excelente trabajo');
  });
});
