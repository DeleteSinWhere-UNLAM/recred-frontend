export interface SupplierRequest {
  nombre: string;
  telefono: string;
  email: string;
  diasVisita: string;
  notas: string;
}

export interface SupplierResponse {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  diasVisita: string;
  notas: string;
  listasPrecios?: ListaPrecioProveedorResponse[];
}

export interface ListaPrecioProveedorResponse {
  id: string;
  urlArchivo: string;
  nombreOriginal: string;
  activa: boolean;
  creadoEn: string; // ISO-Date
  items?: ItemListaPrecioProveedorResponse[];
}

export interface ItemListaPrecioProveedorResponse {
  id: string;
  listaPrecioId: string;
  nombreProductoProveedor: string;
  productoInventarioId: string | null;
  nombreProductoInventario: string | null;
  precio: number;
  unidad: string;
  notas: string;
  mappingConfirmado: boolean;
}

export interface AlternativaProveedor {
  proveedorId: string;
  nombreProveedor: string;
  precio: number;
  unidad: string;
  precioUnitario?: number;
}

export interface RecomendacionProveedor {
  productoInventarioId: string;
  nombreProducto: string;
  proveedorRecomendadoId: string;
  nombreProveedorRecomendado: string;
  mejorPrecio: number;
  unidad: string;
  mejorPrecioUnitario?: number;
  alternativas: AlternativaProveedor[];
}
