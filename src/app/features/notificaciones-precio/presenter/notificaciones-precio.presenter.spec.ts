import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificacionesPrecioPresenter } from './notificaciones-precio.presenter';
import { NotificacionesPrecioService } from '../services/notificaciones-precio.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { NotificacionPrecio } from '../models/notificacion-precio.model';
import { NotificacionesPrecioMother } from '../notificaciones-precio.mother';

describe('NotificacionesPrecioPresenter', () => {
  let presenter: NotificacionesPrecioPresenter;
  let notificacionesServiceSpy: jasmine.SpyObj<NotificacionesPrecioService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  beforeEach(() => {
    notificacionesServiceSpy = jasmine.createSpyObj('NotificacionesPrecioService', ['getNotificaciones']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);

    TestBed.configureTestingModule({
      providers: [
        NotificacionesPrecioPresenter,
        { provide: NotificacionesPrecioService, useValue: notificacionesServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy }
      ]
    });

    presenter = TestBed.inject(NotificacionesPrecioPresenter);
  });

  describe('Inicialización', () => {
    it('debería emitir un error si no hay usuario en sesión', () => {
      usuarioServiceSpy.getUsuarioActual.and.returnValue(null as unknown as ReturnType<UsuarioService['getUsuarioActual']>);
      let errorEmitido: string | null | undefined;
      presenter.error$.subscribe(val => errorEmitido = val);

      presenter.initialize();

      expect(errorEmitido).toBe('Usuario no autenticado.');
      expect(notificacionesServiceSpy.getNotificaciones).not.toHaveBeenCalled();
    });

    it('debería solicitar las notificaciones al servicio y actualizar el estado cuando sea exitoso', () => {
      const usuario = NotificacionesPrecioMother.crearUsuario();
      usuarioServiceSpy.getUsuarioActual.and.returnValue(usuario);
      const notificacionesEsperadas = [
        NotificacionesPrecioMother.crearNotificacion(),
        NotificacionesPrecioMother.crearNotificacion({ titulo: 'Notificacion 2' })
      ];
      notificacionesServiceSpy.getNotificaciones.and.returnValue(of(notificacionesEsperadas));
      let notificacionesEmitidas: NotificacionPrecio[] = [];
      let isLoadingEmitido = true;
      let errorEmitido: string | null | undefined;
      presenter.notificaciones$.subscribe(val => notificacionesEmitidas = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);
      presenter.error$.subscribe(val => errorEmitido = val);

      presenter.initialize();

      expect(notificacionesServiceSpy.getNotificaciones).toHaveBeenCalledWith(usuario.id);
      expect(notificacionesEmitidas).toEqual(notificacionesEsperadas);
      expect(isLoadingEmitido).toBeFalse();
      expect(errorEmitido).toBeNull();
    });

    it('debería actualizar el estado de error cuando el servicio falle', () => {
      const usuario = NotificacionesPrecioMother.crearUsuario();
      usuarioServiceSpy.getUsuarioActual.and.returnValue(usuario);
      notificacionesServiceSpy.getNotificaciones.and.returnValue(throwError(() => new Error('Error de red')));
      let notificacionesEmitidas: NotificacionPrecio[] | undefined;
      let errorEmitido: string | null | undefined;
      let isLoadingEmitido = true;
      presenter.notificaciones$.subscribe(val => notificacionesEmitidas = val);
      presenter.error$.subscribe(val => errorEmitido = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);

      presenter.initialize();

      expect(notificacionesEmitidas).toEqual([]);
      expect(errorEmitido).toBe('Error al cargar las notificaciones.');
      expect(isLoadingEmitido).toBeFalse();
    });
  });
});
