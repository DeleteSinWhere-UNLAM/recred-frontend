import { ColegioMother } from './home-tutor.mother';

describe('ColegioMother', () => {
  it('crear deberia devolver el colegio por defecto', () => {
    const colegio = ColegioMother.crear();

    expect(colegio.id).toBe('colegio-1');
    expect(colegio.nombre).toBe('Instituto San José');
  });

  it('crear con override deberia mergear', () => {
    const colegio = ColegioMother.crear({ nombre: 'Otro' });

    expect(colegio.nombre).toBe('Otro');
    expect(colegio.id).toBe('colegio-1');
  });

  it('crearOtro deberia devolver el segundo colegio hardcodeado', () => {
    const colegio = ColegioMother.crearOtro();

    expect(colegio.id).toBe('colegio-2');
    expect(colegio.nombre).toBe('Colegio Los Robles');
  });
});
