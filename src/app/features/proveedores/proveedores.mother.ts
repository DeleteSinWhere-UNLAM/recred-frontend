import {
  AlternativaProveedor,
  ItemListaPrecioProveedorResponse,
  ListaPrecioProveedorResponse,
  RecomendacionProveedor,
  SupplierRequest,
  SupplierResponse,
} from './models/proveedores.interfaces';

export const SUPPLIER_ID_TEST = 'sup-1';

export class SupplierRequestMother {
  static crear(override: Partial<SupplierRequest> = {}): SupplierRequest {
    return {
      nombre: 'Distribuidora Norte',
      telefono: '011-4444-5555',
      email: 'ventas@norte.com',
      diasVisita: 'Lunes y Miercoles',
      notas: 'Pedidos con 24hs de anticipacion',
      ...override,
    };
  }
}

export class SupplierResponseMother {
  static crear(override: Partial<SupplierResponse> = {}): SupplierResponse {
    return {
      id: SUPPLIER_ID_TEST,
      nombre: 'Distribuidora Norte',
      telefono: '011-4444-5555',
      email: 'ventas@norte.com',
      diasVisita: 'Lunes y Miercoles',
      notas: 'Pedidos con 24hs de anticipacion',
      listasPrecios: [],
      ...override,
    };
  }

  static crearOtro(): SupplierResponse {
    return SupplierResponseMother.crear({
      id: 'sup-2',
      nombre: 'Golosinas del Sur',
      telefono: '011-2222-3333',
      email: 'contacto@delsur.com',
      diasVisita: 'Martes',
    });
  }
}

export class ListaPrecioProveedorMother {
  static crear(override: Partial<ListaPrecioProveedorResponse> = {}): ListaPrecioProveedorResponse {
    return {
      id: 'lp-1',
      urlArchivo: 'https://cdn.recred.com/listas/lp-1.pdf',
      nombreOriginal: 'lista-junio.pdf',
      activa: true,
      creadoEn: '2026-06-01T10:00:00Z',
      items: [],
      ...override,
    };
  }
}

export class ItemListaPrecioMother {
  static crear(override: Partial<ItemListaPrecioProveedorResponse> = {}): ItemListaPrecioProveedorResponse {
    return {
      id: 'item-1',
      listaPrecioId: 'lp-1',
      nombreProductoProveedor: 'Alfajor Jorgito x24',
      productoInventarioId: 'prod-alfajor',
      nombreProductoInventario: 'Alfajor de chocolate',
      precio: 12000,
      unidad: 'caja',
      notas: '',
      mappingConfirmado: true,
      ...override,
    };
  }
}

export class AlternativaProveedorMother {
  static crear(override: Partial<AlternativaProveedor> = {}): AlternativaProveedor {
    return {
      proveedorId: 'sup-2',
      nombreProveedor: 'Golosinas del Sur',
      precio: 500,
      unidad: 'unidad',
      precioUnitario: 500,
      ...override,
    };
  }
}

export class RecomendacionProveedorMother {
  static crear(override: Partial<RecomendacionProveedor> = {}): RecomendacionProveedor {
    return {
      productoInventarioId: 'prod-alfajor',
      nombreProducto: 'Alfajor de chocolate',
      proveedorRecomendadoId: SUPPLIER_ID_TEST,
      nombreProveedorRecomendado: 'Distribuidora Norte',
      mejorPrecio: 500,
      unidad: 'unidad',
      mejorPrecioUnitario: 500,
      alternativas: [AlternativaProveedorMother.crear()],
      ...override,
    };
  }
}
