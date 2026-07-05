import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  describe('mostrar', () => {
    it('dado el service recien creado, cuando llamo mostrar, deberia agregar un toast con id 1', () => {
      service.mostrar('Guardado');

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].id).toBe(1);
      expect(toasts[0].mensaje).toBe('Guardado');
      expect(toasts[0].variante).toBe('success');
    });

    it('dado una variante error, deberia guardarla en el toast', () => {
      service.mostrar('Fallo', 'error');

      expect(service.toasts()[0].variante).toBe('error');
    });

    it('dado varios llamados a mostrar, deberia acumular los toasts con ids incrementales', () => {
      service.mostrar('Uno');
      service.mostrar('Dos');
      service.mostrar('Tres');

      const toasts = service.toasts();
      expect(toasts.length).toBe(3);
      expect(toasts.map((t) => t.id)).toEqual([1, 2, 3]);
    });

    it('dado la duracion default, cuando pasa el tiempo, deberia cerrar el toast solo', fakeAsync(() => {
      service.mostrar('Efímero');

      expect(service.toasts().length).toBe(1);
      tick(4000);
      expect(service.toasts().length).toBe(0);
    }));

    it('dado una duracion custom, deberia respetarla', fakeAsync(() => {
      service.mostrar('Rápido', 'info', 100);

      tick(50);
      expect(service.toasts().length).toBe(1);
      tick(50);
      expect(service.toasts().length).toBe(0);
    }));
  });

  describe('cerrar', () => {
    it('dado varios toasts activos, cuando cierro uno por id, deberia sacar solo ese', () => {
      service.mostrar('A');
      service.mostrar('B');
      service.mostrar('C');

      service.cerrar(2);

      const restantes = service.toasts();
      expect(restantes.length).toBe(2);
      expect(restantes.map((t) => t.mensaje)).toEqual(['A', 'C']);
    });

    it('dado un id que no existe, cuando cierro, no deberia cambiar la lista', () => {
      service.mostrar('A');

      service.cerrar(999);

      expect(service.toasts().length).toBe(1);
    });
  });
});
