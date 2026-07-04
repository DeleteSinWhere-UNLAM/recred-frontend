import {
  InfoClima,
  InfoEstacion,
  PromocionCreada,
  PromocionSugerida,
  RecomendacionesResponse,
  Sugerencia,
} from './models/recomendacion.model';

export const BUFFET_ID_TEST = 'buffet-123';
export const LAT_TEST = -34.6037;
export const LNG_TEST = -58.3816;

export class SugerenciaMother {
  static crear(override: Partial<Sugerencia> = {}): Sugerencia {
    return {
      categoria: 'Bebidas Calientes',
      accion: 'AUMENTAR',
      motivo: 'Se aproxima el invierno',
      icono: 'fa-mug-hot',
      ...override,
    };
  }

  static crearReducir(): Sugerencia {
    return SugerenciaMother.crear({
      categoria: 'Helados',
      accion: 'REDUCIR',
      motivo: 'Baja demanda en temporada fria',
      icono: 'fa-ice-cream',
    });
  }
}

export class PromocionSugeridaMother {
  static crear(override: Partial<PromocionSugerida> = {}): PromocionSugerida {
    return {
      nombre: 'Combo Invierno',
      descuento: 20,
      categorias_destino: ['caliente'],
      imagen: 'https://cdn.recred.com/promos/invierno.png',
      productIds: ['prod-1', 'prod-2'],
      ...override,
    };
  }
}

export class PromocionCreadaMother {
  static crear(override: Partial<PromocionCreada> = {}): PromocionCreada {
    return {
      id: 'promo-1',
      name: 'Combo Invierno',
      discountPercentage: 20,
      productIds: ['prod-1', 'prod-2'],
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-06-08T00:00:00Z',
      status: 'ACTIVE',
      buffet_id: BUFFET_ID_TEST,
      ...override,
    };
  }
}

export class InfoEstacionMother {
  static crear(override: Partial<InfoEstacion> = {}): InfoEstacion {
    return {
      estacion_actual: 'Invierno',
      dias_restantes: 45,
      proxima_estacion: 'Primavera',
      ...override,
    };
  }
}

export class InfoClimaMother {
  static crear(override: Partial<InfoClima> = {}): InfoClima {
    return {
      temperature: 12,
      condition: 'Frio',
      ciudad: 'Buenos Aires',
      provincia: 'CABA',
      ...override,
    };
  }
}

export class RecomendacionesResponseMother {
  static crear(override: Partial<RecomendacionesResponse> = {}): RecomendacionesResponse {
    return {
      sugerencias: [SugerenciaMother.crear(), SugerenciaMother.crearReducir()],
      tip_promocional: 'Aprovecha el invierno con combos calientes',
      promocion_sugerida: PromocionSugeridaMother.crear(),
      info_estacion: InfoEstacionMother.crear(),
      clima_actual: InfoClimaMother.crear(),
      ...override,
    };
  }

  static crearSinPromocion(): RecomendacionesResponse {
    return RecomendacionesResponseMother.crear({ promocion_sugerida: undefined });
  }

  static crearVacio(): RecomendacionesResponse {
    return {
      sugerencias: [],
    };
  }
}
