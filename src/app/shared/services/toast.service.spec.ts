import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, ToastVariante } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  describe('mostrar', () => {
    it('dado el service recien creado, cuando muestro un toast, deberia agregarlo con id 1', () => {
      whenMuestroToast('Guardado');

      thenHayToastsCon(['Guardado']);
      expect(service.toasts()[0].id).toBe(1);
      expect(service.toasts()[0].variante).toBe('success');
    });

    it('dado una variante error, cuando muestro, deberia guardarla en el toast', () => {
      whenMuestroToast('Fallo', 'error');

      expect(service.toasts()[0].variante).toBe('error');
    });

    it('dado varios llamados a mostrar, cuando los inspecciono, deberia acumular los toasts con ids incrementales', () => {
      whenMuestroToast('Uno');
      whenMuestroToast('Dos');
      whenMuestroToast('Tres');

      thenHayToastsCon(['Uno', 'Dos', 'Tres']);
      expect(service.toasts().map((t) => t.id)).toEqual([1, 2, 3]);
    });

    it('dado la duracion default, cuando pasa el tiempo, deberia cerrar el toast solo', fakeAsync(() => {
      whenMuestroToast('Efímero');

      expect(service.toasts().length).toBe(1);
      tick(4000);
      thenHayToastsCon([]);
    }));

    it('dado una duracion custom, cuando pasa ese tiempo, deberia respetarla', fakeAsync(() => {
      whenMuestroToast('Rápido', 'info', 100);

      tick(50);
      expect(service.toasts().length).toBe(1);
      tick(50);
      thenHayToastsCon([]);
    }));
  });

  describe('cerrar', () => {
    it('dado varios toasts activos, cuando cierro uno por id, deberia sacar solo ese', () => {
      whenMuestroToast('A');
      whenMuestroToast('B');
      whenMuestroToast('C');

      whenCierroToast(2);

      thenHayToastsCon(['A', 'C']);
    });

    it('dado un id que no existe, cuando cierro, no deberia cambiar la lista', () => {
      whenMuestroToast('A');

      whenCierroToast(999);

      thenHayToastsCon(['A']);
    });
  });

  function whenMuestroToast(mensaje: string, variante?: ToastVariante, duracionMs?: number): void {
    service.mostrar(mensaje, variante, duracionMs);
  }

  function whenCierroToast(id: number): void {
    service.cerrar(id);
  }

  function thenHayToastsCon(mensajes: string[]): void {
    expect(service.toasts().map((t) => t.mensaje)).toEqual(mensajes);
  }
});
