import { Producto } from '../../buffet/models/producto.model';

export interface ItemCarrito {
  id: string;
  alumnoId: string;
  producto: Producto;
  cantidad: number;
}
