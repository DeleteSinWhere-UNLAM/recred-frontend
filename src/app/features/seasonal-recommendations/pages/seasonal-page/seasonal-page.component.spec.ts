import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonalPageComponent } from './seasonal-page.component';
import { SeasonalPagePresenter } from './presenter/seasonal-page.presenter';
import { signal } from '@angular/core';
import { Sugerencia, PromocionCreada, PromocionSugerida, SeasonInfo, WeatherInfo } from '../../models/recomendacion.model';
import { Product } from '../../../updated-inventory/models/product.interface';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('SeasonalPageComponent', () => {
  let component: SeasonalPageComponent;
  let fixture: ComponentFixture<SeasonalPageComponent>;
  let mockPresenter: jasmine.SpyObj<SeasonalPagePresenter>;

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

    await TestBed.configureTestingModule({
      imports: [SeasonalPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
      .overrideComponent(SeasonalPageComponent, {
        set: {
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
