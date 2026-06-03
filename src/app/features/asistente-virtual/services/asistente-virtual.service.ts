import { Injectable } from '@angular/core';
import { CapacidadAsistente } from '../models/capacidad-asistente.model';
import { RespuestaAsistente } from '../models/respuesta-asistente.model';

interface RespuestaHardcodeada {
  readonly capacidades: readonly CapacidadAsistente[];
  readonly respuesta: string;
}

const DELAY_RESPUESTA_MS = 700;

const RESPUESTA_FALLBACK: RespuestaHardcodeada = {
  capacidades: [],
  respuesta:
    'Por ahora puedo ayudarte con tu saldo, tus pagos, tus compras del buffet y los próximos eventos del colegio. ¿Sobre cuál te gustaría saber?',
};

const RESPUESTAS_POR_CAPACIDAD: Record<CapacidadAsistente, RespuestaHardcodeada> = {
  SALDO: {
    capacidades: ['SALDO'],
    respuesta: 'Tu saldo actual es de $2.580 💰',
  },
  PAGOS: {
    capacidades: ['PAGOS'],
    respuesta:
      'Tu último pago de cuota fue el 28/05 por $32.000 🧾. La próxima cuota vence el 10/06.',
  },
  COMPRAS: {
    capacidades: ['COMPRAS'],
    respuesta:
      'Esta semana compraste en el buffet:\n• Lunes — Sandwich de jamón y queso ($850)\n• Miércoles — Alfajor + jugo ($620)\n• Viernes — Empanada de carne ($780)\nTotal: $2.250 🛒',
  },
  EVENTOS: {
    capacidades: ['EVENTOS'],
    respuesta:
      'Próximos eventos del colegio 📅:\n• 07/06 — Acto del Día de la Bandera (10hs)\n• 12/06 — Reunión de padres 2°B (18hs)\n• 20/06 — Feriado, no hay clases',
  },
};

@Injectable({ providedIn: 'root' })
export class AsistenteVirtualService {
  async enviarMensaje(
    _alumnoId: string,
    mensaje: string,
    sesionId: string | null,
  ): Promise<RespuestaAsistente> {
    await this.simularLatencia();
    const hardcoded = this.elegirRespuesta(mensaje);
    return {
      sesionId: sesionId ?? crypto.randomUUID(),
      respuesta: hardcoded.respuesta,
      capacidades: hardcoded.capacidades,
      fechaHora: new Date().toISOString(),
      generadoPorIa: false,
      modelo: null,
    };
  }

  private elegirRespuesta(mensaje: string): RespuestaHardcodeada {
    const texto = mensaje.toLowerCase();
    if (/(saldo|plata|cuanto tengo|cuánto tengo|disponible)/.test(texto)) {
      return RESPUESTAS_POR_CAPACIDAD.SALDO;
    }
    if (/(pago|cuota|abon|factur)/.test(texto)) {
      return RESPUESTAS_POR_CAPACIDAD.PAGOS;
    }
    if (/(compr|buffet|gast|consumo|kiosc)/.test(texto)) {
      return RESPUESTAS_POR_CAPACIDAD.COMPRAS;
    }
    if (/(evento|acto|reuni|feriado|calendario|agenda)/.test(texto)) {
      return RESPUESTAS_POR_CAPACIDAD.EVENTOS;
    }
    if (/(hola|buenas|buen dia|buen día|hey|qué tal|que tal)/.test(texto)) {
      return {
        capacidades: [],
        respuesta:
          '¡Hola! 👋 Soy Cred, tu asistente del cole. Puedo contarte sobre tu saldo, tus pagos, tus compras del buffet o los próximos eventos.',
      };
    }
    if (/(gracias|genial|perfecto|dale)/.test(texto)) {
      return {
        capacidades: [],
        respuesta: '¡De nada! Cualquier otra cosa, acá estoy 🤖',
      };
    }
    return RESPUESTA_FALLBACK;
  }

  private simularLatencia(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, DELAY_RESPUESTA_MS));
  }
}
