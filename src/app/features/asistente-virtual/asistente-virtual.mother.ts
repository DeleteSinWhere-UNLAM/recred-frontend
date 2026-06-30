import { MensajeAsistente } from './models/mensaje-asistente.model';
import {
  AccionAsistente,
  RespuestaAsistente,
  SugerenciaRespuestaAsistente,
} from './models/respuesta-asistente.model';
import {
  MensajeAsistenteResponse,
  SesionAsistenteResponse,
} from './models/sesion-asistente.model';

export class AccionAsistenteMother {
  static crearEsperandoConfirmacion(override: Partial<AccionAsistente> = {}): AccionAsistente {
    return {
      tipo: 'COMPRA',
      estado: 'ESPERANDO_CONFIRMACION',
      ...override,
    };
  }

  static crearEsperandoRecreo(override: Partial<AccionAsistente> = {}): AccionAsistente {
    return {
      tipo: 'COMPRA',
      estado: 'ESPERANDO_RECREO',
      ...override,
    };
  }

  static crearEjecutadaConCompra(override: Partial<AccionAsistente> = {}): AccionAsistente {
    return {
      tipo: 'COMPRA',
      estado: 'EJECUTADA',
      compraId: 'compra-1',
      codigoRetiro: 'A1B2C3',
      total: 1500,
      ...override,
    };
  }
}

export class SugerenciaRespuestaMother {
  static crear(override: Partial<SugerenciaRespuestaAsistente> = {}): SugerenciaRespuestaAsistente {
    return {
      label: 'Ver pedidos',
      mensaje: 'mostrame mis pedidos',
      ...override,
    };
  }
}

export class RespuestaAsistenteMother {
  static crear(override: Partial<RespuestaAsistente> = {}): RespuestaAsistente {
    return {
      sesionId: 'sesion-1',
      respuesta: 'Tu saldo es de $ 1500',
      generadoPorIa: true,
      fechaHora: '2026-06-29T10:00:00',
      ...override,
    };
  }
}

export class SesionAsistenteResponseMother {
  static crear(override: Partial<SesionAsistenteResponse> = {}): SesionAsistenteResponse {
    return {
      sesionId: 'sesion-1',
      estado: 'ABIERTA',
      fechaInicio: '2026-06-29T09:00:00',
      fechaUltimaActividad: '2026-06-29T10:00:00',
      ...override,
    };
  }
}

export class MensajeAsistenteResponseMother {
  static crearUsuario(override: Partial<MensajeAsistenteResponse> = {}): MensajeAsistenteResponse {
    return {
      id: 'm-1',
      sesionId: 'sesion-1',
      rol: 'USUARIO',
      contenido: '¿cuánto tengo de saldo?',
      fechaHora: '2026-06-29T09:55:00',
      ...override,
    };
  }

  static crearAsistente(override: Partial<MensajeAsistenteResponse> = {}): MensajeAsistenteResponse {
    return {
      id: 'm-2',
      sesionId: 'sesion-1',
      rol: 'ASISTENTE_IA',
      contenido: 'Tu saldo es de $ 1500',
      fechaHora: '2026-06-29T09:56:00',
      ...override,
    };
  }
}

export class MensajeAsistenteMother {
  static crearUsuario(override: Partial<MensajeAsistente> = {}): MensajeAsistente {
    return {
      id: 'msg-u-1',
      rol: 'usuario',
      texto: 'Hola',
      fechaHora: new Date('2026-06-29T10:00:00'),
      ...override,
    };
  }

  static crearCred(override: Partial<MensajeAsistente> = {}): MensajeAsistente {
    return {
      id: 'msg-c-1',
      rol: 'cred',
      texto: 'Hola, ¿en qué te ayudo?',
      fechaHora: new Date('2026-06-29T10:00:01'),
      generadoPorIa: true,
      ...override,
    };
  }
}
