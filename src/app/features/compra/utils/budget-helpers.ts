import { Periodo } from '../../presupuesto/models/presupuesto.model';
import { Producto } from '../../buffet/models/producto.model';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getPeriodRange(periodo: Periodo, referenceDate = new Date()): DateRange {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  if (periodo === 'DIARIO') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (periodo === 'SEMANAL') {
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (periodo === 'QUINCENAL') {
    const dayOfMonth = start.getDate();
    if (dayOfMonth <= 15) {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(15);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(16);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }
  } else if (periodo === 'MENSUAL') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export function getProductCategory(
  productId: string,
  productName: string,
  catalog: Producto[]
): string {
  const catalogProd = catalog.find((p) => p.id === productId);
  return catalogProd?.categoria?.id || '';
}

export function isSameCategory(
  prodCatId: string,
  prodCatDesc: string,
  ruleCatId: string,
  ruleCatDesc: string
): boolean {
  if (!prodCatId || !ruleCatId) {
    return false;
  }
  if (prodCatId.toLowerCase() === ruleCatId.toLowerCase()) {
    return true;
  }
  if (!prodCatDesc || !ruleCatDesc) {
    return false;
  }
  const pDesc = prodCatDesc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const rDesc = ruleCatDesc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  return pDesc.includes(rDesc) || rDesc.includes(pDesc);
}
