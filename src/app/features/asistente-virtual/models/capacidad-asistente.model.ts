export type CapacidadAsistente = 'SALDO' | 'PAGOS' | 'COMPRAS' | 'EVENTOS';

export interface SugerenciaCapacidad {
  readonly capacidad: CapacidadAsistente;
  readonly label: string;
  readonly emoji: string;
  readonly prompt: string;
}

export const SUGERENCIAS_CAPACIDADES: readonly SugerenciaCapacidad[] = [
  {
    capacidad: 'SALDO',
    label: 'Mi saldo',
    emoji: '💰',
    prompt: '¿Cuánto saldo tengo?',
  },
  {
    capacidad: 'PAGOS',
    label: 'Mis pagos',
    emoji: '🧾',
    prompt: '¿Cuándo fue mi último pago?',
  },
  {
    capacidad: 'COMPRAS',
    label: 'Mis compras',
    emoji: '🛒',
    prompt: '¿Qué compré esta semana?',
  },
  {
    capacidad: 'EVENTOS',
    label: 'Próximos eventos',
    emoji: '📅',
    prompt: '¿Qué eventos tengo pronto?',
  },
];
