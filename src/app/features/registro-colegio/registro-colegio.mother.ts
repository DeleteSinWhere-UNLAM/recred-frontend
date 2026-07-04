import { SchoolRegistrationPayload } from './models/registro-colegio.model';

export class RegistroColegioMother {
  static crearPayload(overrides: Partial<SchoolRegistrationPayload> = {}): SchoolRegistrationPayload {
    return {
      schoolName: 'Instituto Técnico San José',
      schoolEmail: 'contacto@sanjose.edu.ar',
      schoolPhone: '011-4444-5555',
      schoolCue: '123456789',
      schoolLevel: { id: 'secundario' },
      directorFirstName: 'Carlos',
      directorLastName: 'Pérez',
      directorEmail: 'cperez@sanjose.edu.ar',
      directorPhone: '011-15-2222-3333',
      directorDni: '20123456',
      directorUsername: 'carlosperez',
      ...overrides,
    };
  }
}
