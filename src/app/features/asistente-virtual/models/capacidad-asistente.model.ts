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

export type TipoSugerenciaAsistente =
  | 'consulta'
  | 'confirmacion'
  | 'cancelacion';

export interface SugerenciaCapacidad {
  readonly id: string;
  readonly capacidad?: CapacidadAsistente;
  readonly label: string;
  readonly emoji: string;
  readonly prompt: string;
  readonly tipo?: TipoSugerenciaAsistente;
}

export const SUGERENCIAS_ASISTENTE_POR_ROL: Record<
  RolUsuario,
  readonly SugerenciaCapacidad[]
> = {
  ALUMNO: [
    {
      id: 'saldo',
      capacidad: 'SALDO',
      label: 'Saldo',
      emoji: '💰',
      prompt: 'saldo',
    },
    {
      id: 'ultimas-compras',
      capacidad: 'COMPRAS',
      label: 'Últimas compras',
      emoji: '🛒',
      prompt: 'mostrame mis ultimas compras',
    },
    {
      id: 'compras-frecuentes',
      capacidad: 'COMPRAS',
      label: 'Compras frecuentes',
      emoji: '🧾',
      prompt: 'mostrame mis compras frecuentes',
    },
    {
      id: 'repetir-ultima-compra',
      capacidad: 'COMPRAS',
      label: 'Repetir última compra',
      emoji: '🔁',
      prompt: 'repeti mi ultima compra',
    },
    {
      id: 'comprar-habitual',
      capacidad: 'COMPRAS',
      label: 'Comprar lo habitual',
      emoji: '⭐',
      prompt: 'comprame lo de siempre',
    },
  ],
  PADRE: [
    {
      id: 'hijos',
      capacidad: 'HIJOS',
      label: 'Mis hijos',
      emoji: '👨‍👩‍👧',
      prompt: 'Resumime el estado de mis hijos.',
    },
    {
      id: 'presupuestos',
      capacidad: 'PRESUPUESTOS',
      label: 'Presupuestos',
      emoji: '💳',
      prompt: '¿Cómo vienen los presupuestos de mis hijos?',
    },
    {
      id: 'restricciones',
      capacidad: 'RESTRICCIONES',
      label: 'Restricciones',
      emoji: '🛡️',
      prompt: '¿Qué restricciones están activas?',
    },
    {
      id: 'compras-hijos',
      capacidad: 'COMPRAS',
      label: 'Compras',
      emoji: '🧺',
      prompt: 'Mostrame las compras recientes de mis hijos.',
    },
  ],
  VENDEDOR: [
    {
      id: 'stock',
      capacidad: 'STOCK',
      label: 'Stock',
      emoji: '📦',
      prompt: '¿Qué productos necesitan reposición?',
    },
    {
      id: 'ventas',
      capacidad: 'VENTAS',
      label: 'Ventas',
      emoji: '📈',
      prompt: 'Resumime las ventas de hoy.',
    },
    {
      id: 'pedidos',
      capacidad: 'PEDIDOS',
      label: 'Pedidos',
      emoji: '🧾',
      prompt: '¿Qué pedidos tengo pendientes?',
    },
    {
      id: 'eventos-kiosco',
      capacidad: 'EVENTOS',
      label: 'Eventos',
      emoji: '📅',
      prompt: '¿Hay eventos escolares que afecten al buffet?',
    },
  ],
};

export const SUGERENCIAS_COMPRA_PENDIENTE: readonly SugerenciaCapacidad[] = [
  {
    id: 'confirmar-compra',
    label: 'Confirmar compra',
    emoji: 'OK',
    prompt: 'confirmar',
    tipo: 'confirmacion',
  },
  {
    id: 'cancelar-compra',
    label: 'Cancelar',
    emoji: 'X',
    prompt: 'cancelar',
    tipo: 'cancelacion',
  },
];
