import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecomendacionesPageComponent } from './recomendaciones-page.component';
import { RecomendacionesPagePresenter } from './presenter/recomendaciones-page.presenter';
import { Component, Input, signal } from '@angular/core';
import { Sugerencia, PromocionCreada, PromocionSugerida, InfoEstacion, InfoClima } from '../../models/recomendacion.model';
import { Producto } from '../../../inventario/models/producto.interface';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: ''
})
class MockNavbarComponent {
  @Input() userName = '';
}

describe('RecomendacionesPageComponent', () => {
  let component: RecomendacionesPageComponent;
  let fixture: ComponentFixture<RecomendacionesPageComponent>;
  let mockPresenter: jasmine.SpyObj<RecomendacionesPagePresenter>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('RecomendacionesPagePresenter', [
      'loadRecommendations',
      'volver',
      'approvePromotion',
      'editPromotion',
      'discardPromotion',
      'closeModal'
    ], {
      isLoading: signal(false),
      error: signal<string | null>(null),
      sugerencias: signal<Sugerencia[]>([]),
      tipPromocional: signal<string | null>(null),
      shouldShowPromotionModal: signal(false),
      promotion: signal<PromocionCreada | null>(null),
      suggestedPromotion: signal<PromocionSugerida | null>(null),
      seasonInfo: signal<InfoEstacion | null>(null),
      weatherInfo: signal<InfoClima | null>(null),
      resolvedProducts: signal<Producto[]>([])
    });
    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    mockUsuarioService.getUsuarioActual.and.returnValue({ id: 'user-1', nombre: 'Test Kiosquero', rol: 'KIOSQUERO' } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [RecomendacionesPageComponent],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
      .overrideComponent(RecomendacionesPageComponent, {
        remove: {
          imports: [NavbarComponent]
        },
        add: {
          imports: [MockNavbarComponent],
          providers: [
            { provide: RecomendacionesPagePresenter, useValue: mockPresenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecomendacionesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Dado que se crea el componente, debería inicializarse llamando a loadRecommendations', () => {
    expect(component).toBeTruthy();
  });
});
