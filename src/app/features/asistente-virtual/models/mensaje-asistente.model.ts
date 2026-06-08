import { AccionAsistente } from './respuesta-asistente.model';

export type RolMensaje = 'usuario' | 'cred' | 'separador';

export interface MensajeAsistente {
  readonly id: string;
  readonly rol: RolMensaje;
  readonly texto: string;
  readonly fechaHora: Date;
  readonly generadoPorIa?: boolean;
  readonly accion?: AccionAsistente | null;
}
