import { Categoria } from '../inventario/models/categoria.interface';
import { SolicitudGuardarProducto } from './models/guardar-producto-request.interface';
import { RespuestaProductoIa } from './models/producto-ia-response.interface';

export class RespuestaProductoIaMother {
  static crear(override: Partial<RespuestaProductoIa> = {}): RespuestaProductoIa {
    return {
      nombre: 'Galletas de arroz integral',
      descripcion: 'Galletas de arroz sin TACC',
      peso: '100g',
      contiene_azucar: false,
      contiene_mani: false,
      contiene_lactosa: false,
      contiene_tacc: false,
      ...override,
    };
  }

  static crearConAlergenos(override: Partial<RespuestaProductoIa> = {}): RespuestaProductoIa {
    return RespuestaProductoIaMother.crear({
      nombre: 'Alfajor de chocolate',
      descripcion: 'Alfajor tradicional',
      peso: '55g',
      contiene_azucar: true,
      contiene_mani: false,
      contiene_lactosa: true,
      contiene_tacc: true,
      ...override,
    });
  }
}

export class SolicitudGuardarProductoMother {
  static crear(override: Partial<SolicitudGuardarProducto> = {}): SolicitudGuardarProducto {
    return {
      nombre: 'Galletas',
      descripcion: 'Galletas de arroz',
      precio: 100,
      peso: 0.1,
      requierePreparacion: false,
      categoriaId: 'cat-1',
      nuevaCategoriaNombre: '',
      buffetId: 'buffet-1',
      stockActual: 10,
      clasificacionesSaludIds: [],
      tiposIds: [],
      urlImagen: null,
      ...override,
    };
  }
}

export class CategoriaMother {
  static crear(override: Partial<Categoria> = {}): Categoria {
    return {
      id: 'cat-1',
      descripcion: 'Snacks',
      activo: true,
      ...override,
    };
  }
}
