import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { KiosqueroReportesPage } from './kiosquero-reportes.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';

describe('KiosqueroReportesPage', () => {
  let component: KiosqueroReportesPage;
  let fixture: ComponentFixture<KiosqueroReportesPage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let presenterSpy: jasmine.SpyObj<HomeKiosqueroPresenter>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    presenterSpy = jasmine.createSpyObj('HomeKiosqueroPresenter', ['initReportes']);

    await TestBed.configureTestingModule({
      imports: [KiosqueroReportesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy }
      ]
    })
    .overrideComponent(KiosqueroReportesPage, {
      set: {
        providers: [
          { provide: HomeKiosqueroPresenter, useValue: presenterSpy }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(KiosqueroReportesPage);
    component = fixture.componentInstance;
  });

  it('should create and call setHomeUrl and initReportes on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    expect(presenterSpy.initReportes).toHaveBeenCalled();
  });

  it('should navigate to /kiosquero on volver()', () => {
    (component as any).volver();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  describe('onImagenError', () => {
    it('should set fallback image if current src is different', () => {
      const mockEvent = {
        target: { src: 'wrong-src' }
      } as unknown as Event;
      
      component.onImagenError(mockEvent);
      
      expect((mockEvent.target as HTMLImageElement).src).toBe((component as any).IMAGEN_FALLBACK);
    });

    it('should do nothing if current src is already the fallback image', () => {
      const mockEvent = {
        target: { src: (component as any).IMAGEN_FALLBACK }
      } as unknown as Event;
      
      component.onImagenError(mockEvent);
      
      expect((mockEvent.target as HTMLImageElement).src).toBe((component as any).IMAGEN_FALLBACK);
    });
  });
});
