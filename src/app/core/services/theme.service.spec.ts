import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  });

  function instanciar(): ThemeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ThemeService] });
    return TestBed.inject(ThemeService);
  }

  describe('estado inicial', () => {
    it('dado localStorage con "light", deberia inicializar en light', () => {
      localStorage.setItem('theme', 'light');

      const service = instanciar();

      expect(service.theme()).toBe('light');
    });

    it('dado localStorage con "dark", deberia inicializar en dark', () => {
      localStorage.setItem('theme', 'dark');

      const service = instanciar();

      expect(service.theme()).toBe('dark');
    });

    it('dado localStorage vacio y prefers-color-scheme dark, deberia inicializar en dark', () => {
      spyOn(window, 'matchMedia').and.returnValue({
        matches: true,
      } as MediaQueryList);

      const service = instanciar();

      expect(service.theme()).toBe('dark');
    });

    it('dado localStorage vacio y prefers-color-scheme light, deberia inicializar en light', () => {
      spyOn(window, 'matchMedia').and.returnValue({
        matches: false,
      } as MediaQueryList);

      const service = instanciar();

      expect(service.theme()).toBe('light');
    });
  });

  describe('effect', () => {
    it('dado el service, al instanciarse deberia setear data-theme en el documentElement y guardar en localStorage', () => {
      localStorage.setItem('theme', 'dark');

      const service = instanciar();
      TestBed.tick();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('theme')).toBe(service.theme());
    });
  });

  describe('toggleTheme', () => {
    it('dado theme light, cuando hago toggle, deberia pasar a dark', () => {
      localStorage.setItem('theme', 'light');
      const service = instanciar();

      service.toggleTheme();

      expect(service.theme()).toBe('dark');
    });

    it('dado theme dark, cuando hago toggle, deberia pasar a light', () => {
      localStorage.setItem('theme', 'dark');
      const service = instanciar();

      service.toggleTheme();

      expect(service.theme()).toBe('light');
    });
  });
});
