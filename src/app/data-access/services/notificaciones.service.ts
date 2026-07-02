import { Injectable, Signal, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Notificacion {
  id?: string;
  titulo?: string;
  mensaje?: string;
  fecha?: string;
  tipo?: string;
}

export interface NotificacionBackend {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
  readAt?: string | null;
  titulo?: string;
  mensaje?: string;
  fecha?: string;
  tipo?: string;
}

export interface NotificacionesResponse {
  notifications: NotificacionBackend[];
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);

  private readonly notificacionesState = signal<Notificacion[]>([]);
  readonly notificaciones = this.notificacionesState.asReadonly();

  private readonly cantidadState = signal<number>(0);
  readonly cantidad: Signal<number> = computed(() => {
    const listLen = this.notificaciones().length;
    return listLen > 0 ? listLen : this.cantidadState();
  });

  setCantidad(cantidad: number): void {
    this.cantidadState.set(Math.max(0, cantidad));
  }

  obtenerNotificaciones(): void {
    this.http.get<NotificacionesResponse>(`${environment.apiUrl}/notifications/me?size=5`).subscribe({
      next: (data) => {
        console.log('Lista de notificaciones:', data);
        const items: NotificacionBackend[] = data?.notifications || [];
        const mapeadas: Notificacion[] = items.map((item) => ({
          id: item.id,
          titulo: item.titulo || item.title || 'Notificación',
          mensaje: item.mensaje || item.message || '',
          fecha: item.fecha || item.createdAt,
          tipo: item.tipo || item.type,
        }));
        this.notificacionesState.set(mapeadas);
      },
      error: (err) => {
        console.error('Error al obtener notificaciones:', err);
      }
    });
  }

  agregarNotificacion(notificacion: Notificacion): void {
    this.notificacionesState.update((lista) => [notificacion, ...lista]);
  }
}
