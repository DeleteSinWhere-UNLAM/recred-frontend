import { SchoolRegistration } from './models/solicitud-colegio.model';

export class RecredAdminMother {
  static crearSolicitud(overrides: Partial<SchoolRegistration> = {}): SchoolRegistration {
    return {
      id: 'solicitud-1',
      schoolName: 'Instituto Técnico San José',
      schoolEmail: 'contacto@sanjose.edu.ar',
      schoolPhone: '011-4444-5555',
      schoolCue: '123456789',
      directorFirstName: 'Carlos',
      directorLastName: 'Pérez',
      directorEmail: 'cperez@sanjose.edu.ar',
      directorPhone: '011-15-2222-3333',
      directorDni: '20123456',
      directorUsername: 'carlosperez',
      status: 'PENDING',
      createdAt: '2026-06-30T10:00:00Z',
      ...overrides,
    };
  }

  static crearListaSolicitudes(): SchoolRegistration[] {
    return [
      RecredAdminMother.crearSolicitud({ id: 'solicitud-1', schoolName: 'Instituto San José' }),
      RecredAdminMother.crearSolicitud({ id: 'solicitud-2', schoolName: 'Colegio Nacional Norte' }),
    ];
  }
}
