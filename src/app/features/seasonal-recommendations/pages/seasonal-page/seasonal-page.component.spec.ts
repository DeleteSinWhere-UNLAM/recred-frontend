import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonalPageComponent } from './seasonal-page.component';
import { SeasonalPagePresenter } from './presenter/seasonal-page.presenter';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('SeasonalPageComponent', () => {
  let component: SeasonalPageComponent;
  let fixture: ComponentFixture<SeasonalPageComponent>;
  let presenterSpy: jasmine.SpyObj<SeasonalPagePresenter>;

  beforeEach(async () => {
    presenterSpy = jasmine.createSpyObj('SeasonalPagePresenter', ['loadRecommendations']);
    Object.defineProperty(presenterSpy, 'isLoading', { value: signal(false) });
    Object.defineProperty(presenterSpy, 'error', { value: signal(null) });
    Object.defineProperty(presenterSpy, 'sugerencias', { value: signal([]) });
    Object.defineProperty(presenterSpy, 'tipPromocional', { value: signal(null) });
    Object.defineProperty(presenterSpy, 'promotion', { value: signal(null) });
    Object.defineProperty(presenterSpy, 'resolvedProducts', { value: signal([]) });
    Object.defineProperty(presenterSpy, 'shouldShowPromotionModal', { value: signal(false) });

    await TestBed.configureTestingModule({
      imports: [SeasonalPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .overrideProvider(SeasonalPagePresenter, { useValue: presenterSpy })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeasonalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, deberia llamar a loadRecommendations en el presenter', () => {
    component.ngOnInit();
    expect(presenterSpy.loadRecommendations).toHaveBeenCalled();
  });
});
