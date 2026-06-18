export interface SugerenciaAgregarProducto {
  id: string;
  alumnoId: string | null;
  buffetId: string;
  productoId: string;
  titulo: string;
  mensaje: string;
  metadata: SugerenciaAgregarMetadata;
}

export interface SugerenciaAgregarMetadata {
  totalSales: number;
  productName: string;
  productPrice: number;
  totalRevenue: number;
  totalCustomers: number;
}
