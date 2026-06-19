import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecomendacionesEstacionalesPage } from './recomendaciones-estacionales.page';
import { RecomendacionesEstacionalesPresenter } from './presenter/recomendaciones-estacionales.presenter';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('RecomendacionesEstacionalesPage', () => {
  let component: RecomendacionesEstacionalesPage;
  let fixture: ComponentFixture<RecomendacionesEstacionalesPage>;
  let presenterSpy: jasmine.SpyObj<RecomendacionesEstacionalesPresenter>;

  beforeEach(async () => {
    presenterSpy = jasmine.createSpyObj('RecomendacionesEstacionalesPresenter', ['loadRecommendations']);
    Object.defineProperty(presenterSpy, 'isLoading', { value: signal(false) });
    Object.defineProperty(presenterSpy, 'error', { value: signal(null) });
    Object.defineProperty(presenterSpy, 'sugerencias', { value: signal([]) });
    Object.defineProperty(presenterSpy, 'tipPromocional', { value: signal(null) });
    Object.defineProperty(presenterSpy, 'promotion', { value: signal(null) });
    Object.defineProperty(presenterSpy, 'resolvedProducts', { value: signal([]) });
    Object.defineProperty(presenterSpy, 'shouldShowPromotionModal', { value: signal(false) });

    await TestBed.configureTestingModule({
      imports: [RecomendacionesEstacionalesPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .overrideProvider(RecomendacionesEstacionalesPresenter, { useValue: presenterSpy })
    .compileComponents();

    fixture = TestBed.createComponent(RecomendacionesEstacionalesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, deberia llamar a loadRecommendations en el presenter', () => {
    component.ngOnInit();
    expect(presenterSpy.loadRecommendations).toHaveBeenCalled();
  });
});
