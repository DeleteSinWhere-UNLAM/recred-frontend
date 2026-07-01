import { RolUsuario } from '../../../data-access/models/perfil.model';

export type CapacidadAsistente =
  | 'SALDO'
  | 'PAGOS'
  | 'COMPRAS'
  | 'EVENTOS'
  | 'MENU'
  | 'PRODUCTOS'
  | 'HIJOS'
  | 'PRESUPUESTOS'
  | 'RESTRICCIONES'
  | 'STOCK'
  | 'VENTAS'
  | 'PEDIDOS'
  | 'PEDIDOS_PENDIENTES'
  | 'CODIGO_RETIRO';

export type TipoSugerenciaAsistente =
  | 'consulta'
  | 'confirmacion'
  | 'cancelacion'
  | 'backend';

export interface SugerenciaCapacidad {
  readonly id: string;
  readonly capacidad?: CapacidadAsistente;
  readonly label: string;
  readonly emoji: string;
  readonly prompt: string;
  readonly tipo?: TipoSugerenciaAsistente;
  readonly tipoAccion?: string | null;
  readonly premium?: boolean;
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
      emoji: '$',
      prompt: 'saldo',
    },
    {
      id: 'ultimas-compras',
      capacidad: 'COMPRAS',
      label: 'Ultimas compras',
      emoji: 'C',
      prompt: 'mostrame mis ultimas compras',
    },
    {
      id: 'compras-frecuentes',
      capacidad: 'COMPRAS',
      label: 'Compras frecuentes',
      emoji: 'F',
      prompt: 'mostrame mis compras frecuentes',
    },
    {
      id: 'compra-habitual',
      capacidad: 'COMPRAS',
      label: 'Compra habitual',
      emoji: '*',
      prompt: 'comprame lo de siempre',
      premium: true,
    },
    {
      id: 'repetir-ultima-compra',
      capacidad: 'COMPRAS',
      label: 'Repetir ultima compra',
      emoji: 'R',
      prompt: 'repeti mi ultima compra',
      premium: true,
    },
    {
      id: 'eventos',
      capacidad: 'EVENTOS',
      label: 'Eventos',
      emoji: 'E',
      prompt: 'eventos',
    },
    {
      id: 'menu-productos',
      capacidad: 'PRODUCTOS',
      label: 'Menu/productos',
      emoji: 'M',
      prompt: 'mostrame el menu',
    },
    {
      id: 'pedidos-pendientes',
      capacidad: 'PEDIDOS_PENDIENTES',
      label: 'Pedidos pendientes',
      emoji: 'P',
      prompt: 'mostrame mis pedidos pendientes',
    },
    {
      id: 'cancelar-pedido',
      capacidad: 'PEDIDOS_PENDIENTES',
      label: 'Cancelar pedido',
      emoji: 'X',
      prompt: 'cancelar mi pedido',
    },
    {
      id: 'codigo-retiro',
      capacidad: 'CODIGO_RETIRO',
      label: 'Codigo de retiro',
      emoji: '#',
      prompt: 'codigo de retiro',
    },
  ],
  PADRE: [
    {
      id: 'hijos',
      capacidad: 'HIJOS',
      label: 'Mis hijos',
      emoji: 'H',
      prompt: 'resumime el estado de mis hijos',
    },
    {
      id: 'presupuestos',
      capacidad: 'PRESUPUESTOS',
      label: 'Presupuestos',
      emoji: '$',
      prompt: 'como vienen los presupuestos de mis hijos',
    },
    {
      id: 'restricciones',
      capacidad: 'RESTRICCIONES',
      label: 'Restricciones',
      emoji: '!',
      prompt: 'que restricciones estan activas',
    },
    {
      id: 'eventos-tutor',
      capacidad: 'EVENTOS',
      label: 'Eventos',
      emoji: 'E',
      prompt: 'eventos',
    },
  ],
  VENDEDOR: [
    {
      id: 'stock',
      capacidad: 'STOCK',
      label: 'Stock',
      emoji: 'S',
      prompt: 'stock',
    },
    {
      id: 'pedidos-pendientes-kiosco',
      capacidad: 'PEDIDOS_PENDIENTES',
      label: 'Pedidos pendientes',
      emoji: 'P',
      prompt: 'pedidos pendientes',
    },
    {
      id: 'ventas',
      capacidad: 'VENTAS',
      label: 'Ventas',
      emoji: 'V',
      prompt: 'ventas',
    },
    {
      id: 'productos-buffet',
      capacidad: 'PRODUCTOS',
      label: 'Productos',
      emoji: 'M',
      prompt: 'productos del buffet',
    },
    {
      id: 'pedidos-buffet',
      capacidad: 'PEDIDOS',
      label: 'Pedidos buffet',
      emoji: 'B',
      prompt: 'pedidos del buffet',
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
