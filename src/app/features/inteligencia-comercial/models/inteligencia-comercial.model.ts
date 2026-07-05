export type PestaniaInteligenciaComercial = 'agregar' | 'rotacion';

export interface ResumenInteligenciaComercial {
  productosParaAgregar: number;
  ingresoPotencial: number;
  clientesAlcanzables: number;
  productosBajaRotacion: number;
  stockInmovilizado: number;
  promedioDiasSinVenta: number;
}

export interface TarjetaOportunidadComercial {
  id: string;
  titulo: string;
  descripcion: string;
  etiquetaMetricaPrincipal: string;
  valorMetricaPrincipal: string;
  etiquetaMetricaSecundaria: string;
  valorMetricaSecundaria: string;
  tono: 'exito' | 'advertencia' | 'peligro';
}
