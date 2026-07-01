import { TestBed } from '@angular/core/testing';
import { RolUsuario } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { HomeAlumnoService } from '../../home-alumno/services/home-alumno.service';
import { AsistenteVirtualService } from '../services/asistente-virtual.service';
import { AsistenteVirtualPresenter } from './asistente-virtual.presenter';
import { RespuestaAsistente } from '../models/respuesta-asistente.model';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import {
  AccionAsistenteMother,
  MensajeAsistenteResponseMother,
  RespuestaAsistenteMother,
  SesionAsistenteResponseMother,
  SugerenciaRespuestaMother,
} from '../asistente-virtual.mother';

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('AsistenteVirtualPresenter', () => {
  let presenter: AsistenteVirtualPresenter;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioAsistente: jasmine.SpyObj<AsistenteVirtualService>;
  let servicioHomeAlumno: jasmine.SpyObj<HomeAlumnoService>;

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['rol', 'getPerfil', 'obtenerAlumnoId']);
    servicioPerfil.rol.and.returnValue('ALUMNO');
    servicioPerfil.getPerfil.and.returnValue(PerfilMother.crear({ rol: 'ALUMNO' }));
    servicioPerfil.obtenerAlumnoId.and.returnValue(null);

    servicioAsistente = jasmine.createSpyObj('AsistenteVirtualService', [
      'enviarMensaje',
      'listarSesiones',
      'obtenerMensajes',
      'cerrarSesion',
      'eliminarSesion',
    ]);
    servicioAsistente.listarSesiones.and.resolveTo([]);
    servicioAsistente.obtenerMensajes.and.resolveTo([]);
    servicioAsistente.cerrarSesion.and.resolveTo();

    servicioHomeAlumno = jasmine.createSpyObj('HomeAlumnoService', ['cargarPedidoEnCurso']);
    servicioHomeAlumno.cargarPedidoEnCurso.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        AsistenteVirtualPresenter,
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: AsistenteVirtualService, useValue: servicioAsistente },
        { provide: HomeAlumnoService, useValue: servicioHomeAlumno },
      ],
    });

    presenter = TestBed.inject(AsistenteVirtualPresenter);
  });

  describe('Estado inicial', () => {
    it('dado el presenter recien creado, deberia arrancar cerrado, sin mensajes y sin procesar', () => {
      expect(presenter.abierto()).toBeFalse();
      expect(presenter.mensajes()).toEqual([]);
      expect(presenter.enviando()).toBeFalse();
      expect(presenter.procesando()).toBeFalse();
    });

    it('dado un rol ALUMNO, cuando leo las opciones disponibles, deberia exponer las sugerencias del rol', () => {
      const opciones = presenter.opcionesDisponibles();

      expect(opciones.length).toBeGreaterThan(0);
      expect(opciones[0].id).toBe('saldo');
    });

    it('dado que no hay rol en el perfil, cuando leo las opciones, deberia devolver una lista vacia', () => {
      givenRol(null);

      expect(presenter.opcionesDisponibles()).toEqual([]);
    });
  });

  describe('abrir / cerrar / toggle', () => {
    it('dado un rol ALUMNO, cuando abro el asistente, deberia agregar la bienvenida del rol', () => {
      whenAbro();

      expect(presenter.abierto()).toBeTrue();
      thenElUltimoMensajeContiene('saldo, compras, menu y pedidos');
    });

    it('dado un rol PADRE, cuando abro el asistente, deberia usar el mensaje de bienvenida del PADRE', () => {
      givenRol('PADRE');

      whenAbro();

      thenElUltimoMensajeContiene('hijos, presupuestos, restricciones y eventos');
    });

    it('dado que no hay rol ni perfil, cuando abro el asistente, deberia usar el mensaje default', () => {
      givenRol(null);
      servicioPerfil.getPerfil.and.returnValue(null);

      whenAbro();

      expect(presenter.mensajes()[0].texto).toBe('Hola. Soy Recredito. En que te puedo ayudar?');
    });

    it('dado el asistente abierto, cuando lo cierro, deberia quedar cerrado', () => {
      whenAbro();

      presenter.cerrar();

      expect(presenter.abierto()).toBeFalse();
    });

    it('dado el asistente cerrado, cuando hago toggle dos veces, deberia abrirse y cerrarse', () => {
      presenter.toggle();
      const luegoDeAbrir = presenter.abierto();
      presenter.toggle();
      const luegoDeCerrar = presenter.abierto();

      expect(luegoDeAbrir).toBeTrue();
      expect(luegoDeCerrar).toBeFalse();
    });
  });

  describe('enviar', () => {
    it('dado un texto vacio o con solo espacios, cuando envio, no deberia hacer nada', async () => {
      await whenEnvio('   ');

      expect(servicioAsistente.enviarMensaje).not.toHaveBeenCalled();
      expect(presenter.mensajes()).toEqual([]);
    });

    it('dado que el back responde, cuando envio, deberia agregar el mensaje del usuario y la respuesta del asistente en orden', async () => {
      givenRespuestaDelBack(RespuestaAsistenteMother.crear({ respuesta: 'Tu saldo es de $ 1500' }));

      await whenEnvio('saldo');

      const mensajes = presenter.mensajes();
      expect(mensajes.length).toBe(2);
      expect(mensajes[0].rol).toBe('usuario');
      expect(mensajes[0].texto).toBe('saldo');
      expect(mensajes[1].rol).toBe('cred');
      expect(mensajes[1].texto).toBe('Tu saldo es de $ 1500');
    });

    it('dado que ya hay una sesion abierta, cuando envio otro mensaje, deberia incluir la sesionId y el rol en la llamada', async () => {
      givenRespuestaDelBack(RespuestaAsistenteMother.crear({ sesionId: 'sesion-nueva' }));
      await whenEnvio('saldo');
      servicioAsistente.enviarMensaje.calls.reset();
      givenRespuestaDelBack(RespuestaAsistenteMother.crear({ sesionId: 'sesion-nueva' }));

      await whenEnvio('eventos');

      expect(servicioAsistente.enviarMensaje).toHaveBeenCalledWith(
        { rol: 'ALUMNO' },
        'eventos',
        'sesion-nueva',
      );
    });

    it('dado que el back falla, cuando envio, deberia agregar un mensaje de error', async () => {
      spyOn(console, 'error');
      givenQueElBackFalla();

      await whenEnvio('saldo');

      thenElUltimoMensajeEs('No pude responder en este momento. Proba de nuevo en unos minutos.');
      expect(presenter.enviando()).toBeFalse();
    });

    it('dado que no hay perfil cargado, cuando envio, deberia agregar el mensaje de error sin pegarle al back', async () => {
      spyOn(console, 'error');
      servicioPerfil.getPerfil.and.returnValue(null);

      await whenEnvio('saldo');

      thenElUltimoMensajeEs('No pude responder en este momento. Proba de nuevo en unos minutos.');
      expect(servicioAsistente.enviarMensaje).not.toHaveBeenCalled();
    });
  });

  describe('sugerencias dinamicas segun la respuesta del asistente', () => {
    it('dado una accion esperando confirmacion, cuando envio, deberia exponer las sugerencias de compra pendiente', async () => {
      givenRespuestaDelBack(
        RespuestaAsistenteMother.crear({ accion: AccionAsistenteMother.crearEsperandoConfirmacion() }),
      );

      await whenEnvio('comprame lo de siempre');

      const sugerencias = presenter.sugerencias();
      expect(sugerencias.map((s) => s.id)).toEqual(['confirmar-compra', 'cancelar-compra']);
    });

    it('dado sugerencias del backend sin accion, cuando envio, deberia mapearlas', async () => {
      givenRespuestaDelBack(
        RespuestaAsistenteMother.crear({
          sugerencias: [SugerenciaRespuestaMother.crear({ label: 'Ver más', mensaje: 'mostrame mas' })],
        }),
      );

      await whenEnvio('saldo');

      const sugerencias = presenter.sugerencias();
      expect(sugerencias.length).toBe(1);
      expect(sugerencias[0].label).toBe('Ver más');
      expect(sugerencias[0].prompt).toBe('mostrame mas');
      expect(sugerencias[0].tipo).toBe('backend');
    });

    it('dado sugerencias del backend con label o mensaje vacio, cuando envio, deberia ignorarlas', async () => {
      givenRespuestaDelBack(
        RespuestaAsistenteMother.crear({
          sugerencias: [
            SugerenciaRespuestaMother.crear({ label: '', mensaje: 'algo' }),
            SugerenciaRespuestaMother.crear({ label: 'Algo', mensaje: '' }),
            SugerenciaRespuestaMother.crear({ label: 'Válida', mensaje: 'va' }),
          ],
        }),
      );

      await whenEnvio('saldo');

      expect(presenter.sugerencias().length).toBe(1);
    });

    it('dado una respuesta sin accion ni sugerencias, cuando envio, deberia devolver una lista vacia', async () => {
      givenRespuestaDelBack(RespuestaAsistenteMother.crear());

      await whenEnvio('saldo');

      expect(presenter.sugerencias()).toEqual([]);
    });
  });

  describe('Refresco del pedido del alumno tras una accion ejecutada', () => {
    it('dado una accion ejecutada con compraId y rol ALUMNO, cuando envio, deberia pedirle al HomeAlumnoService que recargue el pedido', async () => {
      servicioPerfil.obtenerAlumnoId.and.returnValue('alumno-1');
      givenRespuestaDelBack(
        RespuestaAsistenteMother.crear({ accion: AccionAsistenteMother.crearEjecutadaConCompra() }),
      );

      await whenEnvio('confirmar');

      expect(servicioHomeAlumno.cargarPedidoEnCurso).toHaveBeenCalledWith('alumno-1');
    });

    it('dado una accion ejecutada con rol PADRE, cuando envio, no deberia refrescar el pedido', async () => {
      givenRol('PADRE');
      servicioPerfil.getPerfil.and.returnValue(PerfilMother.crearTutor());
      givenRespuestaDelBack(
        RespuestaAsistenteMother.crear({ accion: AccionAsistenteMother.crearEjecutadaConCompra() }),
      );

      await whenEnvio('confirmar');

      expect(servicioHomeAlumno.cargarPedidoEnCurso).not.toHaveBeenCalled();
    });
  });

  describe('nuevaConversacion', () => {
    it('dado un historial de mensajes, cuando inicio una nueva conversacion, deberia resetear a solo la bienvenida', async () => {
      givenRespuestaDelBack(RespuestaAsistenteMother.crear());
      await whenEnvio('saldo');

      await presenter.nuevaConversacion();

      expect(presenter.mensajes().length).toBe(1);
      expect(presenter.mensajes()[0].rol).toBe('cred');
      thenElUltimoMensajeContiene('saldo, compras, menu y pedidos');
    });

    it('dado una sesion abierta, cuando inicio una nueva conversacion, deberia cerrarla en el backend', async () => {
      givenRespuestaDelBack(RespuestaAsistenteMother.crear({ sesionId: 'sesion-abierta' }));
      await whenEnvio('saldo');

      await presenter.nuevaConversacion();

      expect(servicioAsistente.cerrarSesion).toHaveBeenCalledWith({ rol: 'ALUMNO' }, 'sesion-abierta');
    });

    it('dado que no hay sesionId asignada, cuando inicio una nueva conversacion, no deberia intentar cerrar sesion', async () => {
      await presenter.nuevaConversacion();

      expect(servicioAsistente.cerrarSesion).not.toHaveBeenCalled();
    });
  });

  describe('Historial de sesiones anteriores', () => {
    it('dado una sesion vieja con mensajes en el back, cuando abro, deberia marcar el historial como disponible', async () => {
      givenSesionViejaConMensajes('sesion-vieja', [MensajeAsistenteResponseMother.crearUsuario()]);

      presenter.abrir();
      await flushPromises();

      expect(presenter.puedeVerHistorial()).toBeTrue();
    });

    it('dado una sesion vieja con mensajes, cuando veo el historial, deberia prependerlos con un separador', async () => {
      givenSesionViejaConMensajes('sesion-vieja', [
        MensajeAsistenteResponseMother.crearUsuario({ contenido: 'hola' }),
        MensajeAsistenteResponseMother.crearAsistente({ contenido: 'hola, ¿en qué te ayudo?' }),
      ]);
      presenter.abrir();
      await flushPromises();

      await presenter.verMensajesAnteriores();

      const mensajes = presenter.mensajes();
      expect(mensajes[0].rol).toBe('separador');
      expect(mensajes[0].texto).toBe('Mensajes anteriores');
      expect(mensajes[1].texto).toBe('hola');
      expect(mensajes[2].texto).toBe('hola, ¿en qué te ayudo?');
      expect(presenter.puedeVerHistorial()).toBeFalse();
    });

    it('dado que el back no tiene sesiones, cuando abro, no deberia marcar el historial como disponible', async () => {
      servicioAsistente.listarSesiones.and.resolveTo([]);

      presenter.abrir();
      await flushPromises();

      expect(presenter.puedeVerHistorial()).toBeFalse();
    });
  });

  function givenRol(rol: RolUsuario | null): void {
    servicioPerfil.rol.and.returnValue(rol);
  }

  function givenRespuestaDelBack(respuesta: RespuestaAsistente): void {
    servicioAsistente.enviarMensaje.and.resolveTo(respuesta);
  }

  function givenQueElBackFalla(): void {
    servicioAsistente.enviarMensaje.and.rejectWith(new Error('boom'));
  }

  function givenSesionViejaConMensajes(
    sesionId: string,
    mensajes: ReturnType<typeof MensajeAsistenteResponseMother.crearUsuario>[],
  ): void {
    servicioAsistente.listarSesiones.and.resolveTo([
      SesionAsistenteResponseMother.crear({ sesionId }),
    ]);
    servicioAsistente.obtenerMensajes.and.resolveTo(mensajes);
  }

  function whenAbro(): void {
    presenter.abrir();
  }

  function whenEnvio(texto: string): Promise<void> {
    return presenter.enviar(texto);
  }

  function thenElUltimoMensajeContiene(fragmento: string): void {
    const ultimo = presenter.mensajes().at(-1);
    expect(ultimo?.texto).toContain(fragmento);
  }

  function thenElUltimoMensajeEs(texto: string): void {
    const ultimo = presenter.mensajes().at(-1);
    expect(ultimo?.texto).toBe(texto);
  }
});
