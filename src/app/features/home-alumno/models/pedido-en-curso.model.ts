export type EstadoPedido = 'CONFIRMADO' | 'PREPARANDO' | 'LISTO' | 'ENTREGADO';

export interface PedidoEnCurso {
  id: string;
  estado: EstadoPedido;
  itemsResumen: string[];
  totalFormateado: string;
  retiraEn: string;
}
