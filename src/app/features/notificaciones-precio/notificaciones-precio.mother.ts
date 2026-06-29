import { Usuario } from '../../data-access/models/usuario.model';
import { NotificacionPrecio } from './models/notificacion-precio.model';

export class NotificacionesPrecioMother {
  static crearUsuario(override: Partial<Usuario> = {}): Usuario {
    return {
      id: 'user-id-456',
      nombre: 'Kiosquero Test',
      ...override
    } as unknown as Usuario;
  }

  static crearNotificacion(override: Partial<NotificacionPrecio> = {}): NotificacionPrecio {
    return {
      titulo: 'Alfajor subió de precio',
      mensaje: 'El alfajor aumentó un 20%',
      productoId: 'prod-alfajor',
      razonIA: 'Inflación local',
      ...override
    } as unknown as NotificacionPrecio;
  }
}
