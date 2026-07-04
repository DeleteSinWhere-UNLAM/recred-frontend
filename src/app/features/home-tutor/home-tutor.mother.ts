import { Colegio } from '../../data-access/models/colegio.model';

export class ColegioMother {
  static crear(override: Partial<Colegio> = {}): Colegio {
    return {
      id: 'colegio-1',
      nombre: 'Instituto San José',
      ...override,
    };
  }

  static crearOtro(): Colegio {
    return ColegioMother.crear({ id: 'colegio-2', nombre: 'Colegio Los Robles' });
  }
}
