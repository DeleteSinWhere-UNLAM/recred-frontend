import {
  CarritoFavoritoItemResponse,
  CarritoFavoritoResponse,
  SaveCarritoFavoritoRequest,
} from './models/carritos-favoritos.model';

export class CarritoFavoritoItemResponseMother {
  static crear(override: Partial<CarritoFavoritoItemResponse> = {}): CarritoFavoritoItemResponse {
    return {
      productId: 'prod-1',
      productName: 'Alfajor',
      unitPrice: 500,
      quantity: 1,
      ...override,
    };
  }
}

export class CarritoFavoritoResponseMother {
  static crear(override: Partial<CarritoFavoritoResponse> = {}): CarritoFavoritoResponse {
    return {
      id: 'carrito-1',
      nombre: 'Mi carrito preferido',
      alumnoId: 'alumno-1',
      alumnoNombre: 'Julian',
      alumnoApellido: 'Garcia',
      items: [CarritoFavoritoItemResponseMother.crear()],
      ...override,
    };
  }

  static crearParaAlumno(alumnoId: string, override: Partial<CarritoFavoritoResponse> = {}): CarritoFavoritoResponse {
    return CarritoFavoritoResponseMother.crear({ alumnoId, ...override });
  }

  static crearConItems(items: CarritoFavoritoItemResponse[]): CarritoFavoritoResponse {
    return CarritoFavoritoResponseMother.crear({ items });
  }
}

export class SaveCarritoFavoritoRequestMother {
  static crear(override: Partial<SaveCarritoFavoritoRequest> = {}): SaveCarritoFavoritoRequest {
    return {
      id: null,
      nombre: 'Mi carrito preferido',
      alumnoId: 'alumno-1',
      items: [{ productId: 'prod-1', quantity: 1 }],
      ...override,
    };
  }
}
