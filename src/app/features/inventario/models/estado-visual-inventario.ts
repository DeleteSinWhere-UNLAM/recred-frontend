import { ItemResumenInventario } from './inventario.interface';

export const UMBRAL_ALTA_RESERVA = 0.5;

export type EstadoOperativoStock =
  | 'AGOTADO'
  | 'BAJO_STOCK'
  | 'ALTA_RESERVA'
  | 'PAUSADO'
  | 'OK';

const PRIORIDAD_ESTADO: Record<EstadoOperativoStock, number> = {
  AGOTADO: 0,
  BAJO_STOCK: 1,
  ALTA_RESERVA: 2,
  PAUSADO: 3,
  OK: 4,
};

export function getEstadoOperativoStock(
  product: ItemResumenInventario,
): EstadoOperativoStock {
  if (product.tipoManejoInventario === 'DISPONIBLE_NO_DISPONIBLE') {
    return product.disponible &&
      product.estadoInventario !== 'DESACTIVADO' &&
      product.estadoInventario !== 'SIN_STOCK' &&
      !product.agotado
      ? 'OK'
      : 'PAUSADO';
  }

  if (product.estadoInventario === 'DESACTIVADO') {
    return 'PAUSADO';
  }

  if (product.agotado || product.estadoInventario === 'SIN_STOCK') {
    return 'AGOTADO';
  }

  if (!product.disponible) {
    return 'PAUSADO';
  }

  if (product.bajoStock || product.estadoInventario === 'BAJO_STOCK') {
    return 'BAJO_STOCK';
  }

  if (esAltaReserva(product)) {
    return 'ALTA_RESERVA';
  }

  return 'OK';
}

export function esAltaReserva(product: ItemResumenInventario): boolean {
  return obtenerRatioReserva(product) >= UMBRAL_ALTA_RESERVA;
}

export function obtenerRatioReserva(product: ItemResumenInventario): number {
  const reserved = normalizeStock(product.stockReservado);
  const available = normalizeStock(product.stockDisponible);
  const total = available + reserved;

  if (total <= 0) {
    return 0;
  }

  return reserved / total;
}

export function obtenerRatioDisponibilidad(product: ItemResumenInventario): number {
  const reserved = normalizeStock(product.stockReservado);
  const available = normalizeStock(product.stockDisponible);
  const total = available + reserved;

  if (total > 0) {
    return available / total;
  }

  return product.disponible && !product.agotado ? 1 : 0;
}

export function compararPorEstadoOperativo(
  first: ItemResumenInventario,
  second: ItemResumenInventario,
): number {
  const statusDifference =
    PRIORIDAD_ESTADO[getEstadoOperativoStock(first)] -
    PRIORIDAD_ESTADO[getEstadoOperativoStock(second)];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return first.nombre.localeCompare(second.nombre, 'es');
}

function normalizeStock(value: number | null | undefined): number {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}
