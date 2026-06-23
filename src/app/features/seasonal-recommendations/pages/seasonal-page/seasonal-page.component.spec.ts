import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonalPageComponent } from './seasonal-page.component';
import { SeasonalPagePresenter } from './presenter/seasonal-page.presenter';
import { Component, Input, signal } from '@angular/core';
import { Sugerencia, PromocionCreada, PromocionSugerida, SeasonInfo, WeatherInfo } from '../../models/recomendacion.model';
import { Product } from '../../../updated-inventory/models/product.interface';
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

describe('SeasonalPageComponent', () => {
  let component: SeasonalPageComponent;
  let fixture: ComponentFixture<SeasonalPageComponent>;
  let mockPresenter: jasmine.SpyObj<SeasonalPagePresenter>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('SeasonalPagePresenter', [
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
      seasonInfo: signal<SeasonInfo | null>(null),
      weatherInfo: signal<WeatherInfo | null>(null),
      resolvedProducts: signal<Product[]>([])
    });
    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    mockUsuarioService.getUsuarioActual.and.returnValue({ id: 'user-1', nombre: 'Test Kiosquero', rol: 'KIOSQUERO' } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [SeasonalPageComponent],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
      .overrideComponent(SeasonalPageComponent, {
        remove: {
          imports: [NavbarComponent]
        },
        add: {
          imports: [MockNavbarComponent],
          providers: [
            { provide: SeasonalPagePresenter, useValue: mockPresenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(SeasonalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Dado que se crea el componente, debería inicializarse llamando a loadRecommendations', () => {
    expect(component).toBeTruthy();
  });
});
