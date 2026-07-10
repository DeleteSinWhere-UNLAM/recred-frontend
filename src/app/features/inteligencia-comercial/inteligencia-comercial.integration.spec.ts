import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { PromotionService } from '../../data-access/services/promociones/promotion.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { ProductoService } from '../inventario/services/producto.service';
import { SugerenciasAgregarService } from '../sugerencias-agregar/services/sugerencias-agregar.service';
import { SugerenciaAgregarProductoMother } from '../sugerencias-agregar/sugerencias-agregar.mother';
import { SugerenciasService } from '../sugerencias/services/sugerencias.service';
import { SugerenciaProductoMother } from '../sugerencias/sugerencias.mother';
import { InteligenciaComercialPage } from './inteligencia-comercial.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('InteligenciaComercial Integration', () => {
  let fixture: ComponentFixture<InteligenciaComercialPage>;
  let servicioAgregar: jasmine.SpyObj<SugerenciasAgregarService>;
  let servicioRotacion: jasmine.SpyObj<SugerenciasService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    servicioAgregar = jasmine.createSpyObj<SugerenciasAgregarService>(
      'SugerenciasAgregarService',
      ['getSugerenciasAgregarProducto'],
    );
    servicioRotacion = jasmine.createSpyObj<SugerenciasService>('SugerenciasService', [
      'getSugerencias',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    const usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
    ]);
    usuarioService.getUsuarioActual.and.returnValue({
      id: 'u1',
      nombre: 'Test Kiosquero',
    });

    await TestBed.configureTestingModule({
      imports: [InteligenciaComercialPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: SugerenciasAgregarService, useValue: servicioAgregar },
        { provide: SugerenciasService, useValue: servicioRotacion },
        {
          provide: PromotionService,
          useValue: jasmine.createSpyObj<PromotionService>('PromotionService', ['createPromotion']),
        },
        { provide: ToastService, useValue: jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']) },
        { provide: ProductoService, useValue: jasmine.createSpyObj<ProductoService>('ProductoService', ['getById']) },
      ],
    })
      .overrideComponent(InteligenciaComercialPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();
  });

  it('dadas oportunidades y baja rotacion, deberia renderizar resumen y pestañas', () => {
    servicioAgregar.getSugerenciasAgregarProducto.and.returnValue(
      of(SugerenciaAgregarProductoMother.crearVarias()),
    );
    servicioRotacion.getSugerencias.and.returnValue(of(SugerenciaProductoMother.crearVarias()));

    fixture = TestBed.createComponent(InteligenciaComercialPage);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Diagnóstico comercial');
    expect(texto).toContain('Para incorporar');
    expect(texto).toContain('$4.000');
    expect(texto).toContain('Stock inmovilizado');
    expect(texto).toContain('30');

    const cardsAgregar = fixture.debugElement.queryAll(By.css('.si__tarjeta--exito'));
    expect(cardsAgregar.length).toBe(3);

    expect(fixture.nativeElement.textContent).toContain('Impulsar baja rotación');
    expect(fixture.nativeElement.textContent).toContain('Producto 2');
  });

  it('cuando se abre la vista completa de oportunidades, deberia navegar a la ruta existente', () => {
    servicioAgregar.getSugerenciasAgregarProducto.and.returnValue(
      of(SugerenciaAgregarProductoMother.crearVarias()),
    );
    servicioRotacion.getSugerencias.and.returnValue(of([]));

    fixture = TestBed.createComponent(InteligenciaComercialPage);
    fixture.detectChanges();

    const botonDetalle = fixture.debugElement.query(By.css('.si__boton-enlace'));
    botonDetalle.nativeElement.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/sugerencias-agregar');
  });

  it('cuando se da de alta una oportunidad, deberia navegar al alta simple con datos sugeridos', () => {
    servicioAgregar.getSugerenciasAgregarProducto.and.returnValue(
      of(SugerenciaAgregarProductoMother.crearVarias()),
    );
    servicioRotacion.getSugerencias.and.returnValue(of([]));

    fixture = TestBed.createComponent(InteligenciaComercialPage);
    fixture.detectChanges();

    const botonAlta = fixture.debugElement.query(By.css('.si__accion-tarjeta'));
    botonAlta.nativeElement.click();

    expect(router.navigate).toHaveBeenCalledWith(['/admin-productos'], {
      queryParams: {
        origen: 'oportunidad-stock',
        nombreProducto: 'Prod C',
        precioProducto: 400,
      },
    });
  });
});
