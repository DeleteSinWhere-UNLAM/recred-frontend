import { TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { HomeAlumnoService } from '../../home-alumno/services/home-alumno.service';
import {
  ESTADO_COMPRA_CANCELADO,
  ESTADO_ESPERANDO_FECHA,
  INPUT_FECHA_RETIRO,
  TIPO_ACCION_CANCELACION_COMPRA,
} from '../models/respuesta-asistente.model';
import { AsistenteVirtualService } from '../services/asistente-virtual.service';
import { AsistenteVirtualPresenter } from './asistente-virtual.presenter';

describe('AsistenteVirtualPresenter', () => {
  let presenter: AsistenteVirtualPresenter;
  let asistenteServiceSpy: jasmine.SpyObj<AsistenteVirtualService>;
  let homeAlumnoServiceSpy: jasmine.SpyObj<HomeAlumnoService>;

  beforeEach(() => {
    const perfilServiceStub = {
      rol: jasmine.createSpy('rol').and.returnValue('ALUMNO'),
      getPerfil: jasmine.createSpy('getPerfil').and.returnValue({
        id: 'perfil-1',
        email: 'alumno@test.com',
        nombre: 'Alumno',
        apellido: 'Test',
        rol: 'ALUMNO',
        alumnoId: 'alumno-1',
      }),
      obtenerAlumnoId: jasmine
        .createSpy('obtenerAlumnoId')
        .and.returnValue('alumno-1'),
    };

    asistenteServiceSpy = jasmine.createSpyObj<AsistenteVirtualService>(
      'AsistenteVirtualService',
      ['enviarMensaje', 'listarSesiones', 'obtenerMensajes', 'cerrarSesion'],
    );
    homeAlumnoServiceSpy = jasmine.createSpyObj<HomeAlumnoService>(
      'HomeAlumnoService',
      ['cargarPedidoEnCurso'],
    );

    TestBed.configureTestingModule({
      providers: [
        AsistenteVirtualPresenter,
        { provide: PerfilService, useValue: perfilServiceStub },
        { provide: AsistenteVirtualService, useValue: asistenteServiceSpy },
        { provide: HomeAlumnoService, useValue: homeAlumnoServiceSpy },
      ],
    });

    presenter = TestBed.inject(AsistenteVirtualPresenter);
    homeAlumnoServiceSpy.cargarPedidoEnCurso.and.resolveTo();
  });

  it('refresca el pedido del alumno cuando la cancelacion se ejecuta', async () => {
    asistenteServiceSpy.enviarMensaje.and.resolveTo({
      sesionId: 'sesion-1',
      respuesta: 'Tu compra fue cancelada.',
      accion: {
        tipo: TIPO_ACCION_CANCELACION_COMPRA,
        estado: 'EJECUTADA',
        compraId: 'compra-1',
        estadoCompra: ESTADO_COMPRA_CANCELADO,
      },
    });

    await presenter.enviar('cancelar mi pedido');

    expect(homeAlumnoServiceSpy.cargarPedidoEnCurso).toHaveBeenCalledOnceWith(
      'alumno-1',
    );
    expect(presenter.mensajes().at(-1)?.accion?.estadoCompra).toBe(
      ESTADO_COMPRA_CANCELADO,
    );
  });

  it('no refresca el pedido si la cancelacion queda informativa', async () => {
    asistenteServiceSpy.enviarMensaje.and.resolveTo({
      sesionId: 'sesion-1',
      respuesta: 'Tenes mas de una compra pendiente.',
      accion: {
        tipo: TIPO_ACCION_CANCELACION_COMPRA,
        estado: 'INFORMATIVA',
      },
    });

    await presenter.enviar('cancelar mi pedido');

    expect(homeAlumnoServiceSpy.cargarPedidoEnCurso).not.toHaveBeenCalled();
  });

  it('habilita selector de fecha cuando la accion espera FECHA_RETIRO', async () => {
    asistenteServiceSpy.enviarMensaje.and.resolveTo({
      sesionId: 'sesion-1',
      respuesta: 'Para que fecha queres retirar?',
      action: {
        status: ESTADO_ESPERANDO_FECHA,
        requiredInputs: [INPUT_FECHA_RETIRO],
      },
    });

    await presenter.enviar('comprame una medialuna');

    expect(presenter.requiereFechaRetiro()).toBeTrue();
    expect(presenter.sugerencias()).toEqual([]);
    expect(presenter.mensajes().at(-1)?.accion?.status).toBe(
      ESTADO_ESPERANDO_FECHA,
    );
  });

  it('envia la fecha como texto dd/MM/yyyy manteniendo la sesion', async () => {
    asistenteServiceSpy.enviarMensaje.and.resolveTo({
      sesionId: 'sesion-1',
      respuesta: 'Para que fecha queres retirar?',
      action: {
        status: ESTADO_ESPERANDO_FECHA,
        requiredInputs: [INPUT_FECHA_RETIRO],
      },
    });
    await presenter.enviar('comprame una medialuna');

    asistenteServiceSpy.enviarMensaje.calls.reset();
    asistenteServiceSpy.enviarMensaje.and.resolveTo({
      sesionId: 'sesion-1',
      respuesta: 'En que recreo?',
      accion: {
        estado: 'ESPERANDO_RECREO',
      },
    });

    await presenter.enviarFechaRetiro('2026-07-03');

    expect(asistenteServiceSpy.enviarMensaje).toHaveBeenCalledOnceWith(
      { rol: 'ALUMNO' },
      'para el 03/07/2026',
      'sesion-1',
    );
    expect(presenter.mensajes().at(-2)?.texto).toBe('para el 03/07/2026');
  });
});
