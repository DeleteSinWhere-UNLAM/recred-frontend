export interface CarritoFavoritoItemResponse {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface CarritoFavoritoResponse {
  id: string;
  nombre: string;
  alumnoId: string;
  alumnoNombre: string;
  alumnoApellido: string;
  items: CarritoFavoritoItemResponse[];
}

export interface SaveCarritoFavoritoRequest {
  id: string | null;
  nombre: string;
  alumnoId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}
