import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HomeKiosqueroPage } from './home-kiosquero.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';

describe('HomeKiosqueroPage', () => {
  let component: HomeKiosqueroPage;
  let fixture: ComponentFixture<HomeKiosqueroPage>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let presenterSpy: jasmine.SpyObj<HomeKiosqueroPresenter>;

  beforeEach(async () => {
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    presenterSpy = jasmine.createSpyObj('HomeKiosqueroPresenter', ['init']);

    await TestBed.configureTestingModule({
      imports: [HomeKiosqueroPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsuarioService, useValue: usuarioServiceSpy }
      ]
    })
    .overrideComponent(HomeKiosqueroPage, {
      set: {
        providers: [
          { provide: HomeKiosqueroPresenter, useValue: presenterSpy }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeKiosqueroPage);
    component = fixture.componentInstance;
  });

  it('should create and call setHomeUrl and init on ngOnInit', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    expect(presenterSpy.init).toHaveBeenCalled();
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
