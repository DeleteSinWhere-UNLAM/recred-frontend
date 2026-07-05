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
      void service.confirm('¿Seguro?');

      const active = service.activeDialog();
      expect(active).not.toBeNull();
      expect(active?.title).toBe('Confirmar');
      expect(active?.message).toBe('¿Seguro?');
      expect(active?.confirmText).toBe('Aceptar');
      expect(active?.cancelText).toBe('Cancelar');
      expect(active?.showCancel).toBeTrue();
    });

    it('dado textos custom, deberia guardarlos en el dialog activo', () => {
      void service.confirm('Ir?', 'Salir', 'Sí, salir', 'Cancelar');

      const active = service.activeDialog();
      expect(active?.title).toBe('Salir');
      expect(active?.confirmText).toBe('Sí, salir');
    });

    it('dado un confirm abierto, cuando llamo handleConfirm, deberia resolver true y cerrar el dialog', async () => {
      const promesa = service.confirm('¿?');

      service.handleConfirm();

      expect(await promesa).toBeTrue();
      expect(service.activeDialog()).toBeNull();
    });

    it('dado un confirm abierto, cuando llamo handleDismiss, deberia resolver false y cerrar el dialog', async () => {
      const promesa = service.confirm('¿?');

      service.handleDismiss();

      expect(await promesa).toBeFalse();
      expect(service.activeDialog()).toBeNull();
    });
  });

  describe('alert', () => {
    it('dado el service, cuando llamo alert, deberia activar el dialog con showCancel false y titulo default "Alerta"', () => {
      void service.alert('Hola');

      const active = service.activeDialog();
      expect(active?.title).toBe('Alerta');
      expect(active?.message).toBe('Hola');
      expect(active?.showCancel).toBeFalse();
    });

    it('dado titulo custom, deberia usarlo', () => {
      void service.alert('Ok', 'Aviso');

      expect(service.activeDialog()?.title).toBe('Aviso');
    });

    it('dado un alert abierto, cuando llamo handleConfirm, deberia resolver true', async () => {
      const promesa = service.alert('Hola');

      service.handleConfirm();

      expect(await promesa).toBeTrue();
    });
  });

  describe('handlers sin dialog activo', () => {
    it('dado sin dialog activo, cuando llamo handleConfirm, no deberia romper', () => {
      expect(() => service.handleConfirm()).not.toThrow();
      expect(service.activeDialog()).toBeNull();
    });

    it('dado sin dialog activo, cuando llamo handleDismiss, no deberia romper', () => {
      expect(() => service.handleDismiss()).not.toThrow();
      expect(service.activeDialog()).toBeNull();
    });
  });
});
