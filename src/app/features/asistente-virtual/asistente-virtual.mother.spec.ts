import { MensajeAsistenteMother, SugerenciaRespuestaMother } from './asistente-virtual.mother';

describe('AsistenteVirtual mothers', () => {
  it('SugerenciaRespuestaMother.crear deberia devolver la sugerencia default y aceptar overrides', () => {
    const base = SugerenciaRespuestaMother.crear();
    const custom = SugerenciaRespuestaMother.crear({ label: 'Otra' });

    expect(base.label).toBe('Ver pedidos');
    expect(custom.label).toBe('Otra');
  });

  it('MensajeAsistenteMother.crearUsuario deberia devolver un mensaje del usuario', () => {
    const mensaje = MensajeAsistenteMother.crearUsuario();

    expect(mensaje.rol).toBe('usuario');
    expect(mensaje.texto).toBe('Hola');
  });

  it('MensajeAsistenteMother.crearCred deberia devolver un mensaje de RECRED con IA', () => {
    const mensaje = MensajeAsistenteMother.crearCred();

    expect(mensaje.rol).toBe('cred');
    expect(mensaje.generadoPorIa).toBeTrue();
  });
});
