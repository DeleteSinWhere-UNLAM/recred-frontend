import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DialogService] });
    service = TestBed.inject(DialogService);
  });

  describe('confirm', () => {
    it('dado el service, cuando llamo confirm, deberia activar el dialog con showCancel true y titulo default "Confirmar"', () => {
      whenLlamoConfirm('¿Seguro?');

      thenElDialogActivoTiene({
        title: 'Confirmar',
        message: '¿Seguro?',
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        showCancel: true,
      });
    });

    it('dado textos custom, cuando llamo confirm, deberia guardarlos en el dialog activo', () => {
      whenLlamoConfirm('Ir?', 'Salir', 'Sí, salir', 'Cancelar');

      thenElDialogActivoTiene({ title: 'Salir', confirmText: 'Sí, salir' });
    });

    it('dado un confirm abierto, cuando llamo handleConfirm, deberia resolver true y cerrar el dialog', async () => {
      const promesa = whenLlamoConfirm('¿?');

      whenHandleConfirm();

      expect(await promesa).toBeTrue();
      thenNoHayDialogActivo();
    });

    it('dado un confirm abierto, cuando llamo handleDismiss, deberia resolver false y cerrar el dialog', async () => {
      const promesa = whenLlamoConfirm('¿?');

      whenHandleDismiss();

      expect(await promesa).toBeFalse();
      thenNoHayDialogActivo();
    });
  });

  describe('alert', () => {
    it('dado el service, cuando llamo alert, deberia activar el dialog con showCancel false y titulo default "Alerta"', () => {
      whenLlamoAlert('Hola');

      thenElDialogActivoTiene({ title: 'Alerta', message: 'Hola', showCancel: false });
    });

    it('dado un titulo custom, cuando llamo alert, deberia usarlo', () => {
      whenLlamoAlert('Ok', 'Aviso');

      thenElDialogActivoTiene({ title: 'Aviso' });
    });

    it('dado un alert abierto, cuando llamo handleConfirm, deberia resolver true', async () => {
      const promesa = whenLlamoAlert('Hola');

      whenHandleConfirm();

      expect(await promesa).toBeTrue();
    });
  });

  describe('handlers sin dialog activo', () => {
    it('dado sin dialog activo, cuando llamo handleConfirm, no deberia romper', () => {
      expect(() => whenHandleConfirm()).not.toThrow();
      thenNoHayDialogActivo();
    });

    it('dado sin dialog activo, cuando llamo handleDismiss, no deberia romper', () => {
      expect(() => whenHandleDismiss()).not.toThrow();
      thenNoHayDialogActivo();
    });
  });

  function whenLlamoConfirm(mensaje: string, title?: string, confirmText?: string, cancelText?: string): Promise<boolean> {
    return service.confirm(mensaje, title, confirmText, cancelText);
  }

  function whenLlamoAlert(mensaje: string, title?: string): Promise<boolean> {
    return service.alert(mensaje, title);
  }

  function whenHandleConfirm(): void {
    service.handleConfirm();
  }

  function whenHandleDismiss(): void {
    service.handleDismiss();
  }

  function thenElDialogActivoTiene(expected: Partial<{ title: string; message: string; confirmText: string; cancelText: string; showCancel: boolean }>): void {
    const active = service.activeDialog();
    expect(active).not.toBeNull();
    if (expected.title !== undefined) expect(active?.title).toBe(expected.title);
    if (expected.message !== undefined) expect(active?.message).toBe(expected.message);
    if (expected.confirmText !== undefined) expect(active?.confirmText).toBe(expected.confirmText);
    if (expected.cancelText !== undefined) expect(active?.cancelText).toBe(expected.cancelText);
    if (expected.showCancel !== undefined) expect(active?.showCancel).toBe(expected.showCancel);
  }

  function thenNoHayDialogActivo(): void {
    expect(service.activeDialog()).toBeNull();
  }
});
