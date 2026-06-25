import { InventoryOverviewItem } from './inventory.interface';

export const HIGH_RESERVATION_THRESHOLD = 0.5;

export type OperationalStockStatus =
  | 'AGOTADO'
  | 'BAJO_STOCK'
  | 'ALTA_RESERVA'
  | 'PAUSADO'
  | 'OK';

const STATUS_PRIORITY: Record<OperationalStockStatus, number> = {
  AGOTADO: 0,
  BAJO_STOCK: 1,
  ALTA_RESERVA: 2,
  PAUSADO: 3,
  OK: 4,
};

export function getOperationalStockStatus(
  product: InventoryOverviewItem,
): OperationalStockStatus {
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

  if (isHighReservation(product)) {
    return 'ALTA_RESERVA';
  }

  return 'OK';
}

export function isHighReservation(product: InventoryOverviewItem): boolean {
  return getReservationRatio(product) >= HIGH_RESERVATION_THRESHOLD;
}

export function getReservationRatio(product: InventoryOverviewItem): number {
  const reserved = normalizeStock(product.stockReservado);
  const available = normalizeStock(product.stockDisponible);
  const total = available + reserved;

  if (total <= 0) {
    return 0;
  }

  return reserved / total;
}

export function getAvailabilityRatio(product: InventoryOverviewItem): number {
  const reserved = normalizeStock(product.stockReservado);
  const available = normalizeStock(product.stockDisponible);
  const total = available + reserved;

  if (total > 0) {
    return available / total;
  }

  return product.disponible && !product.agotado ? 1 : 0;
}

export function compareByOperationalStatus(
  first: InventoryOverviewItem,
  second: InventoryOverviewItem,
): number {
  const statusDifference =
    STATUS_PRIORITY[getOperationalStockStatus(first)] -
    STATUS_PRIORITY[getOperationalStockStatus(second)];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return first.nombre.localeCompare(second.nombre, 'es');
}

function normalizeStock(value: number | null | undefined): number {
  const numericValue = Number(value ?? 0);

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}
