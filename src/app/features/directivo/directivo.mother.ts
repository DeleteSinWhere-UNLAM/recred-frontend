import { Perfil } from '../../data-access/models/perfil.model';

export class DirectivoMother {
  public static perfilDirectivo(modificaciones?: Partial<Perfil>): Perfil {
    return {
      id: 'dir-123',
      email: 'directivo@colegio.com',
      nombre: 'Maria',
      apellido: 'Gonzalez',
      rol: 'DIRECTIVO_COLEGIO',
      ...modificaciones,
    };
  }
}
