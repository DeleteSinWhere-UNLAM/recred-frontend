import { Injectable } from '@angular/core';
import { CapacidadAsistente } from '../models/capacidad-asistente.model';
import { RespuestaAsistente } from '../models/respuesta-asistente.model';

const CAPACIDADES_COMPLETAS: readonly CapacidadAsistente[] = [
  'SALDO',
  'PAGOS',
  'COMPRAS',
  'EVENTOS',
];

const MODELO_MOCK = 'gemini-3.1-flash-lite';

const RESPUESTAS_MOCK: { match: RegExp; respuesta: string }[] = [
  {
    match: /saldo|plata|dinero|cu[aá]nto tengo/i,
    respuesta: 'Tenés $1.250 disponibles para usar en el buffet. ¡Alcanza para una merienda completa!',
  },
  {
    match: /pago|recarga|carga/i,
    respuesta: 'Tu último pago fue el 27/05 por $2.000 y se acreditó al toque.',
  },
  {
    match: /compr[aé]|ped[ií]|gast/i,
    respuesta: 'Esta semana compraste un alfajor el lunes y una empanada el miércoles. Total: $750.',
  },
  {
    match: /evento|fecha|acto|salida/i,
    respuesta: 'El próximo evento es el acto del 9 de Julio. ¡Acordate del pañuelo blanco!',
  },
];

const RESPUESTA_DEFAULT =
  '¡Buenísimo! Por ahora puedo contarte sobre tu saldo, pagos, compras y eventos del colegio. ¿Qué querés saber?';

@Injectable({ providedIn: 'root' })
export class AsistenteVirtualService {
  // TODO: cuando se configure provideHttpClient + interceptor JWT Cognito,
  // reemplazar el cuerpo por:
  //   return firstValueFrom(this.http.post<RespuestaAsistente>(
  //     `${env.apiBase}/ia/alumnos/${alumnoId}/asistente/mensajes`,
  //     { sesionId, mensaje },
  //   ));
  async enviarMensaje(
    alumnoId: string,
    mensaje: string,
    sesionId: string | null,
  ): Promise<RespuestaAsistente> {
    await this.simularLatencia();

    const respuesta =
      RESPUESTAS_MOCK.find((r) => r.match.test(mensaje))?.respuesta ?? RESPUESTA_DEFAULT;

    return {
      sesionId: sesionId ?? crypto.randomUUID(),
      respuesta,
      capacidades: CAPACIDADES_COMPLETAS,
      fechaHora: new Date().toISOString(),
      generadoPorIa: true,
      modelo: MODELO_MOCK,
    };
  }

  private simularLatencia(): Promise<void> {
    const delayMs = 700 + Math.random() * 400;
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
