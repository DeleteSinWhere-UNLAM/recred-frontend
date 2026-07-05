import {
  AlumnoMother,
  CrearHijoRequestMother,
  PerfilMother,
  StudentDtoMother,
} from './alumno.mother';

describe('Mothers de data-access', () => {
  it('PerfilMother.crear sin override deberia devolver un perfil por defecto', () => {
    const perfil = PerfilMother.crear();

    expect(perfil.rol).toBe('ALUMNO');
    expect(perfil.email).toBe('mail@recred.com');
  });

  it('PerfilMother.crearAlumnoCon deberia setear el id y rol ALUMNO', () => {
    const perfil = PerfilMother.crearAlumnoCon('alumno-123');

    expect(perfil.id).toBe('alumno-123');
    expect(perfil.rol).toBe('ALUMNO');
  });

  it('AlumnoMother.crear sin override deberia devolver el alumno por defecto', () => {
    const alumno = AlumnoMother.crear();

    expect(alumno.id).toBe('alumno-id');
    expect(alumno.saldo).toBe(0);
  });

  it('AlumnoMother.crearAlumnoActual deberia devolver el mock hardcodeado', () => {
    const alumno = AlumnoMother.crearAlumnoActual();

    expect(alumno.id).toBe('julian-garcia');
    expect(alumno.saldo).toBe(2580);
  });

  it('StudentDtoMother.crear deberia devolver el DTO por defecto y aceptar overrides', () => {
    const base = StudentDtoMother.crear();
    const custom = StudentDtoMother.crear({ id: 'x', saldo: '9999' });

    expect(base.id).toBe('a1');
    expect(custom.id).toBe('x');
    expect(custom.saldo).toBe('9999');
  });

  it('CrearHijoRequestMother.crear deberia devolver el request por defecto y aceptar overrides', () => {
    const base = CrearHijoRequestMother.crear();
    const custom = CrearHijoRequestMother.crear({ dni: '99999999' });

    expect(base.username).toBe('user');
    expect(custom.dni).toBe('99999999');
  });
});
