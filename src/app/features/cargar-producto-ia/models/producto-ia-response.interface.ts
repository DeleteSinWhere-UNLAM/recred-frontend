export interface RespuestaProductoIa {
  nombre: string;
  descripcion: string;
  peso: string;
  contiene_azucar: boolean;
  contiene_mani: boolean;
  contiene_lactosa: boolean;
  contiene_tacc: boolean;
  contiene_huevo?: boolean;
  contiene_pescado?: boolean;
  contiene_soja?: boolean;
  url_imagen?: string;
}
