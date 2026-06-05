import { RolUsuario } from '../../../data-access/models/perfil.model';

export type CapacidadAsistente =
  | 'SALDO'
  | 'PAGOS'
  | 'COMPRAS'
  | 'EVENTOS'
  | 'HIJOS'
  | 'PRESUPUESTOS'
  | 'RESTRICCIONES'
  | 'STOCK'
  | 'VENTAS'
  | 'PEDIDOS';

export interface SugerenciaCapacidad {
  readonly capacidad: CapacidadAsistente;
  readonly label: string;
  readonly emoji: string;
  readonly prompt: string;
}

export const SUGERENCIAS_ASISTENTE_POR_ROL: Record<
  RolUsuario,
  readonly SugerenciaCapacidad[]
> = {
  ALUMNO: [
    {
      capacidad: 'SALDO',
      label: 'Mi saldo',
      emoji: '💰',
      prompt: '¿Cuánto saldo tengo?',
    },
    {
      capacidad: 'COMPRAS',
      label: 'Mis compras',
      emoji: '🛒',
      prompt: '¿Qué compré esta semana?',
    },
    {
      capacidad: 'PAGOS',
      label: 'Mis pagos',
      emoji: '🧾',
      prompt: '¿Cuándo fue mi último pago?',
    },
    {
      capacidad: 'EVENTOS',
      label: 'Eventos',
      emoji: '📅',
      prompt: '¿Qué eventos tengo pronto?',
    },
  ],
  PADRE: [
    {
      capacidad: 'HIJOS',
      label: 'Mis hijos',
      emoji: '👨‍👩‍👧',
      prompt: 'Resumime el estado de mis hijos.',
    },
    {
      capacidad: 'PRESUPUESTOS',
      label: 'Presupuestos',
      emoji: '💳',
      prompt: '¿Cómo vienen los presupuestos de mis hijos?',
    },
    {
      capacidad: 'RESTRICCIONES',
      label: 'Restricciones',
      emoji: '🛡️',
      prompt: '¿Qué restricciones están activas?',
    },
    {
      capacidad: 'COMPRAS',
      label: 'Compras',
      emoji: '🧺',
      prompt: 'Mostrame las compras recientes de mis hijos.',
    },
  ],
  VENDEDOR: [
    {
      capacidad: 'STOCK',
      label: 'Stock',
      emoji: '📦',
      prompt: '¿Qué productos necesitan reposición?',
    },
    {
      capacidad: 'VENTAS',
      label: 'Ventas',
      emoji: '📈',
      prompt: 'Resumime las ventas de hoy.',
    },
    {
      capacidad: 'PEDIDOS',
      label: 'Pedidos',
      emoji: '🧾',
      prompt: '¿Qué pedidos tengo pendientes?',
    },
    {
      capacidad: 'EVENTOS',
      label: 'Eventos',
      emoji: '📅',
      prompt: '¿Hay eventos escolares que afecten al buffet?',
    },
  ],
};
