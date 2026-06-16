export interface SugerenciaProducto {
  productoOriginal: string;
  resumen: string;
  alertas: string[];
  productosSugeridos: string[];
  motivoIA: string;
  modeloIA: string;
  estadisticasVenta: EstadisticasVenta;
}

export interface EstadisticasVenta {
  productoId: string;
  nombre: string;
  categoria: string;

  precioActual: number;

  ventasPeriodo: number;
  participacionVentas: number;

  rankingGeneral: number;
  rankingCategoria: number;

  promedioVentasCategoria: number | null;
  promedioPrecioCategoria: number | null;

  diferenciaPrecioCategoria: number | null;

  diasSinVenta: number;

  clientesDistintos: number;

  stockActual: number;
  stockPromedioCategoria: number | null;
}

export interface SuggestedProduct {
  id: string;
  nombre: string;
  precio: number;
}

export interface ComboSuggestion {
  idProduct: string;
  productName: string;
  suggestedProducts: SuggestedProduct[];
}
