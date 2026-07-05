import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { KiosqueroReportesPage } from './kiosquero-reportes.page';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

interface PresenterMock {
  init: jasmine.Spy;
  initReportes: jasmine.Spy;
  nombreKiosquero: ReturnType<typeof signal<string>>;
  isLoading: ReturnType<typeof signal<boolean>>;
  errorMessage: ReturnType<typeof signal<string | null>>;
  hasPanelData: ReturnType<typeof signal<boolean>>;
  panel: ReturnType<typeof signal<unknown>>;
  selectedDate: ReturnType<typeof signal<string>>;
  selectedRangePreset: ReturnType<typeof signal<string>>;
  reportRangeFrom: ReturnType<typeof signal<string>>;
  reportRangeTo: ReturnType<typeof signal<string>>;
  reportRangeOptions: unknown[];
}

class PresenterMother {
  static crear(): PresenterMock {
    return {
      init: jasmine.createSpy('init'),
      initReportes: jasmine.createSpy('initReportes'),
      nombreKiosquero: signal(''),
      isLoading: signal(false),
      errorMessage: signal<string | null>(null),
      hasPanelData: signal(false),
      panel: signal(null),
      selectedDate: signal('2026-07-03'),
      selectedRangePreset: signal('TODAY'),
      reportRangeFrom: signal('2026-06-27'),
      reportRangeTo: signal('2026-07-03'),
      reportRangeOptions: [],
    };
  }
}

describe('KiosqueroReportesPage', () => {
  let component: KiosqueroReportesPage;
  let fixture: ComponentFixture<KiosqueroReportesPage>;
  let presenter: PresenterMock;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let router: Router;

  beforeEach(async () => {
    presenter = PresenterMother.crear();
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['setHomeUrl']);

    await TestBed.configureTestingModule({
      imports: [KiosqueroReportesPage],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(KiosqueroReportesPage, {
        remove: {
          imports: [NavbarComponent],
          providers: [HomeKiosqueroPresenter],
        },
        add: {
          imports: [NavbarStub],
          providers: [{ provide: HomeKiosqueroPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(KiosqueroReportesPage);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado la page, cuando se monta, deberia setear /kiosquero como home y llamar initReportes', () => {
      whenMonto();

      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
      expect(presenter.initReportes).toHaveBeenCalled();
    });
  });

  describe('estados', () => {
    it('dado el presenter cargando, cuando se renderiza, deberia mostrar "Cargando reportes"', () => {
      givenPresenterCargando();

      whenMonto();

      expect(textoDeLaPage()).toContain('Cargando reportes');
    });

    it('dado un error en el presenter, cuando se renderiza, deberia mostrar el mensaje', () => {
      givenErrorEnPresenter('Fallo la carga');

      whenMonto();

      expect(textoDeLaPage()).toContain('Fallo la carga');
    });
  });

  describe('volver', () => {
    it('dado el boton Volver, cuando hago click, deberia navegar a /kiosquero', () => {
      whenMonto();

      whenHagoClickEnVolver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('onImagenError', () => {
    it('dado una imagen que falla, cuando se dispara error, deberia setear el src al fallback', () => {
      const img = document.createElement('img');
      img.src = 'https://original/foto.png';
      const event = { target: img } as unknown as Event;

      component.onImagenError(event);

      expect(img.src).toContain('logo_sin_fondo_ikciro');
    });

    it('dado una imagen que ya es fallback, cuando se dispara error, no deberia cambiar el src', () => {
      const img = document.createElement('img');
      img.src =
        'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
      const originalSrc = img.src;
      const event = { target: img } as unknown as Event;

      component.onImagenError(event);

      expect(img.src).toBe(originalSrc);
    });
  });

  function givenPresenterCargando(): void {
    presenter.isLoading.set(true);
  }

  function givenErrorEnPresenter(mensaje: string): void {
    presenter.errorMessage.set(mensaje);
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function whenHagoClickEnVolver(): void {
    const boton = (fixture.nativeElement as HTMLElement).querySelector('.kr__back') as HTMLButtonElement;
    boton.click();
  }

  function textoDeLaPage(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
