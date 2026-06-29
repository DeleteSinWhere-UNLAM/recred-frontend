import { Usuario } from '../../data-access/models/usuario.model';
import { PreferenciaDetectada } from './models/preferencia-detectada.model';

export class PreferenciasDetectadasMother {
  static crearUsuario(override: Partial<Usuario> = {}): Usuario {
    return {
      id: 'user-id-123',
      nombre: 'Test User',
      ...override
    } as unknown as Usuario;
  }

  static crearPreferencia(override: Partial<PreferenciaDetectada> = {}): PreferenciaDetectada {
    return {
      sugerenciaId: 'sug-1',
      alumnoId: 'al-1',
      alumnoUserId: 'user-al-1',
      alumnoNombre: 'Juancito',
      tipo: 'COMPRA',
      titulo: 'Le gustan los alfajores',
      mensaje: 'Compra muchos alfajores',
      productoId: 'prod-1',
      razonIA: 'Por frecuencia',
      ...override
    } as unknown as PreferenciaDetectada;
  }
}
