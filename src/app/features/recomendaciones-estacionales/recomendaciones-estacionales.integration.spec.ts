import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { PromotionService } from '../../data-access/services/promociones/promotion.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { ProductoInventarioMother } from '../inventario/inventario.mother';
import { ProductoService } from '../inventario/services/producto.service';
import { RecomendacionesPageComponent } from './pages/recomendaciones-page/recomendaciones-page.component';
import {
  BUFFET_ID_TEST,
  LAT_TEST,
  LNG_TEST,
  RecomendacionesResponseMother,
} from './recomendaciones-estacionales.mother';
import { RecomendacionesService } from './services/recomendaciones.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('RecomendacionesEstacionales Integration', () => {
  let fixture: ComponentFixture<RecomendacionesPageComponent>;
  let servicioRecomendaciones: jasmine.SpyObj<RecomendacionesService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;
  let servicioPromotion: jasmine.SpyObj<PromotionService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((success) => {
      (success as PositionCallback)({
        coords: { latitude: LAT_TEST, longitude: LNG_TEST },
      } as unknown as GeolocationPosition);
    });

    servicioRecomendaciones = jasmine.createSpyObj('RecomendacionesService', [
      'getSeasonalRecommendations',
    ]);
    servicioRecomendaciones.getSeasonalRecommendations.and.returnValue(
      of(RecomendacionesResponseMother.crear()),
    );

    servicioProducto = jasmine.createSpyObj('ProductoService', ['getById']);
    servicioProducto.getById.and.callFake((id: string) =>
      of(ProductoInventarioMother.crear({ id, nombre: `Producto ${id}` })),
    );

    servicioPromotion = jasmine.createSpyObj('PromotionService', ['createPromotion']);
    servicioPromotion.createPromotion.and.returnValue(
      of({ id: 'promo-new' } as unknown as import('../../data-access/services/promociones/promotion.service').Promotion),
    );

    const servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Integration',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

    await TestBed.configureTestingModule({
      imports: [RecomendacionesPageComponent],
      providers: [
        { provide: RecomendacionesService, useValue: servicioRecomendaciones },
        { provide: ProductoService, useValue: servicioProducto },
        { provide: PromotionService, useValue: servicioPromotion },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['mostrar']) },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(RecomendacionesPageComponent, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecomendacionesPageComponent);
  });

  it('dado geolocation ok y una respuesta con sugerencias, cuando se monta la page, deberia renderizar el titulo y las tarjetas', () => {
    whenMonto();

    const texto = textoRenderizado();
    expect(texto).toContain('Sugerencias de stock');
    expect(texto).toContain('Bebidas Calientes');
    expect(texto).toContain('Helados');
    expect(servicioRecomendaciones.getSeasonalRecommendations).toHaveBeenCalledWith(LAT_TEST, LNG_TEST);
  });

  it('dado un tip promocional en la respuesta, cuando se monta, deberia renderizar la tip-card', () => {
    whenMonto();

    const tipCard = (fixture.nativeElement as HTMLElement).querySelector('app-tip-card');
    expect(tipCard).toBeTruthy();
    expect(textoRenderizado()).toContain('Aprovecha el invierno');
  });

  it('dado una respuesta sin sugerencias, cuando se monta, deberia mostrar el estado vacio', () => {
    givenRecomendacionesDelBack(RecomendacionesResponseMother.crearVacio());

    whenMonto();

    expect(textoRenderizado()).toContain('No hay sugerencias disponibles');
  });

  function givenRecomendacionesDelBack(response: ReturnType<typeof RecomendacionesResponseMother.crear>): void {
    servicioRecomendaciones.getSeasonalRecommendations.and.returnValue(of(response));
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
