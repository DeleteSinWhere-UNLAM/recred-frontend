import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { AsistenteVirtualPresenter } from './asistente-virtual.presenter';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { AsistenteVirtualService } from '../services/asistente-virtual.service';
import { RespuestaAsistente } from '../models/respuesta-asistente.model';

describe('AsistenteVirtualPresenter', () => {
  let presenter: AsistenteVirtualPresenter;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let asistenteServiceSpy: jasmine.SpyObj<AsistenteVirtualService>;

  beforeEach(() => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['getPerfil', 'rol', 'obtenerAlumnoId']);
    asistenteServiceSpy = jasmine.createSpyObj('AsistenteVirtualService', [
      'enviarMensaje',
      'listarSesiones',
      'obtenerMensajes',
      'cerrarSesion'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AsistenteVirtualPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: AsistenteVirtualService, useValue: asistenteServiceSpy }
      ]
    });

    presenter = TestBed.inject(AsistenteVirtualPresenter);
  });

  describe('abrir y toggle', () => {
    it('dado que se abre el asistente por primera vez sin perfil, muestra bienvenida default', fakeAsync(() => {
      perfilServiceSpy.rol.and.returnValue(null);
      perfilServiceSpy.getPerfil.and.returnValue(null);
      
      presenter.abrir();
      flushMicrotasks();

      expect(presenter.abierto()).toBeTrue();
      expect(presenter.mensajes().length).toBe(1);
      expect(presenter.mensajes()[0].texto).toContain('En que te puedo ayudar?');
    }));

    it('dado que se abre el asistente por primera vez con perfil alumno, muestra bienvenida correspondiente', fakeAsync(() => {
      perfilServiceSpy.rol.and.returnValue('ALUMNO');
      perfilServiceSpy.getPerfil.and.returnValue({ id: '1', rol: 'ALUMNO', email: '', nombre: '', apellido: '' });
      asistenteServiceSpy.listarSesiones.and.returnValue(Promise.resolve([]));
      
      presenter.abrir();
      flushMicrotasks();

      expect(presenter.mensajes()[0].texto).toContain('Puedo ayudarte con saldo, compras');
    }));

    it('dado que se llama a toggle, deberia abrir o cerrar alternadamente', fakeAsync(() => {
      presenter.toggle();
      expect(presenter.abierto()).toBeTrue();
      presenter.toggle();
      expect(presenter.abierto()).toBeFalse();
    }));
  });

  describe('revisarUltimaSesion', () => {
    it('dado que el servicio devuelve una sesion activa y tiene mensajes, deberia habilitar historial', fakeAsync(() => {
      perfilServiceSpy.getPerfil.and.returnValue({ id: '1', rol: 'PADRE', email: '', nombre: '', apellido: '' });
      asistenteServiceSpy.listarSesiones.and.returnValue(Promise.resolve([
        { sesionId: 's1', estado: 'ABIERTA', fechaCreacion: '', fechaInicio: '', fechaUltimaActividad: new Date().toISOString() }
      ]));
      asistenteServiceSpy.obtenerMensajes.and.returnValue(Promise.resolve([
        { id: '1', sesionId: 's1', rol: 'USUARIO', contenido: 'hola', fechaHora: '' }
      ]));

      presenter.abrir();
      flushMicrotasks();

      expect(presenter.puedeVerHistorial()).toBeTrue();
      expect(presenter['sesionHistorialState']()).toBe('s1');
    }));
  });

  describe('enviar y enviarSugerencia', () => {
    it('dado que se envia un texto vacio, deberia ignorarlo', fakeAsync(() => {
      presenter.enviar('   ');
      flushMicrotasks();
      expect(presenter.mensajes().length).toBe(0);
    }));

    it('dado que hay perfil nulo al momento de enviar, deberia mostrar error genérico', fakeAsync(() => {
      perfilServiceSpy.getPerfil.and.returnValue(null);
      spyOn(console, 'error');
      
      presenter.enviar('test');
      flushMicrotasks();

      expect(presenter.enviando()).toBeFalse();
      expect(presenter.mensajes()[1].texto).toContain('No pude responder en este momento');
    }));

    it('dado que se envia correctamente, deberia procesar sugerencias y acciones', fakeAsync(() => {
      perfilServiceSpy.getPerfil.and.returnValue({ id: '1', rol: 'PADRE', email: '', nombre: '', apellido: '' });
      const mockResp: RespuestaAsistente = {
        respuesta: 'mensaje desde IA',
        sesionId: 'sesion2',
        generadoPorIa: true,
        sugerencias: [{ label: 'ok', mensaje: 'ok_msg', tipoAccion: 'sugerencia_rapida' }]
      };
      asistenteServiceSpy.enviarMensaje.and.returnValue(Promise.resolve(mockResp));

      presenter.enviar('test valid');
      flushMicrotasks();

      expect(presenter['sesionIdState']()).toBe('sesion2');
      expect(presenter.sugerencias().length).toBe(1);
      expect(presenter.sugerencias()[0].prompt).toBe('ok_msg');
    }));

    it('dado que devuelve estado ESPERANDO_CONFIRMACION, deberia forzar sugerencias de compra pendiente', fakeAsync(() => {
      perfilServiceSpy.getPerfil.and.returnValue({ id: '1', rol: 'PADRE', email: '', nombre: '', apellido: '' });
      const mockResp: RespuestaAsistente = {
        sesionId: 's1',
        respuesta: 'confirmar?',
        accion: { tipo: 'VENDER', estado: 'ESPERANDO_CONFIRMACION' }
      };
      asistenteServiceSpy.enviarMensaje.and.returnValue(Promise.resolve(mockResp));

      presenter.enviar('comprar');
      flushMicrotasks();

      const sugerencias = presenter.sugerencias();
      expect(sugerencias.length).toBeGreaterThan(0);
      expect(sugerencias.some(s => s.tipo === 'confirmacion')).toBeTrue();
    }));
  });

  describe('nuevaConversacion', () => {
    it('dado que se solicita una nueva conversacion, deberia limpiar el estado local e invocar cerrarSesion', fakeAsync(() => {
      perfilServiceSpy.getPerfil.and.returnValue({ id: '1', rol: 'PADRE', email: '', nombre: '', apellido: '' });
      presenter['sesionIdState'].set('s_activa');
      asistenteServiceSpy.cerrarSesion.and.returnValue(Promise.resolve());

      presenter.nuevaConversacion();
      flushMicrotasks();

      expect(presenter['sesionIdState']()).toBeNull();
      expect(asistenteServiceSpy.cerrarSesion).toHaveBeenCalledWith(jasmine.anything(), 's_activa');
      expect(presenter.mensajes().length).toBe(1);
    }));
  });

  describe('verMensajesAnteriores', () => {
    it('dado que no puede ver historial, deberia ignorar la peticion', fakeAsync(() => {
      presenter['historialDisponibleState'].set(false);
      presenter.verMensajesAnteriores();
      flushMicrotasks();
      expect(asistenteServiceSpy.obtenerMensajes).not.toHaveBeenCalled();
    }));

    it('dado que hay historial, deberia cargarlos y agregar el separador', fakeAsync(() => {
      perfilServiceSpy.getPerfil.and.returnValue({ id: '1', rol: 'PADRE', email: '', nombre: '', apellido: '' });
      presenter['historialDisponibleState'].set(true);
      presenter['sesionHistorialState'].set('s_hist');
      asistenteServiceSpy.obtenerMensajes.and.returnValue(Promise.resolve([
        { id: '1', sesionId: 's_hist', rol: 'USUARIO', contenido: 'old msg', fechaHora: '' },
        { id: '2', sesionId: 's_hist', rol: 'ASISTENTE_IA', contenido: 'old response', fechaHora: '' }
      ]));

      presenter.verMensajesAnteriores();
      flushMicrotasks();

      expect(presenter.mensajes().length).toBe(3); 
      expect(presenter.mensajes()[0].rol).toBe('separador');
      expect(presenter.puedeVerHistorial()).toBeFalse();
    }));

    it('dado que la api devuelve vacio, deberia ocultar disponibilidad', fakeAsync(() => {
      perfilServiceSpy.getPerfil.and.returnValue({ id: '1', rol: 'PADRE', email: '', nombre: '', apellido: '' });
      presenter['historialDisponibleState'].set(true);
      presenter['sesionHistorialState'].set('s_hist');
      asistenteServiceSpy.obtenerMensajes.and.returnValue(Promise.resolve([]));

      presenter.verMensajesAnteriores();
      flushMicrotasks();

      expect(presenter['historialDisponibleState']()).toBeFalse();
    }));
  });

  describe('utils', () => {
    it('dado que opcionesDisponibles es llamada con perfil de PADRE, deberia retornar sugerencias iniciales', () => {
      perfilServiceSpy.rol.and.returnValue('PADRE');
      expect(presenter.opcionesDisponibles().length).toBeGreaterThan(0);
    });

    it('dado que hay sugerencia backend con normalizarId invalido, deberia caer en fallback', () => {
      const mockResp = [{ label: 'test', mensaje: '???', tipoAccion: 'sugerencia_rapida' }];
      const result = presenter['mapearSugerenciasBackend'](mockResp as unknown as never);
      expect(result[0].id).toContain('backend-0-');
    });

    it('dado que fechaDesdeBackend recibe null, retorna Date actual', () => {
      const result = presenter['fechaDesdeBackend'](null);
      expect(result instanceof Date).toBeTrue();
    });

    it('dado que fechaDesdeBackend recibe invalida, retorna Date actual', () => {
      const result = presenter['fechaDesdeBackend']('invalida');
      expect(result instanceof Date).toBeTrue();
    });
  });
});
