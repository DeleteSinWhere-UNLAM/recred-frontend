import { Injectable, Signal, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Notificacion {
  id?: string;
  titulo?: string;
  mensaje?: string;
  fecha?: string;
  tipo?: string;
  alumnoId?: string;
  compraId?: string;
  productoId?: string;
  sugerenciaId?: string;
  read?: boolean;
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
  alumnoId?: string;
  compraId?: string;
  productoId?: string;
  sugerenciaId?: string;
  studentId?: string;
  purchaseId?: string;
  productId?: string;
  suggestionId?: string;
}

export type NotificacionesResponse = NotificacionBackend[] | { notifications: NotificacionBackend[] };

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);

  private readonly allNotificacionesState = signal<Notificacion[]>([]);
  // Muestra todas las notificaciones cargadas ordenadas por no leídas primero, luego por fecha descendente
  readonly notificaciones = computed(() => {
    return [...this.allNotificacionesState()].sort((a, b) => {
      const readA = a.read ? 1 : 0;
      const readB = b.read ? 1 : 0;
      if (readA !== readB) {
        return readA - readB; // No leídas (0) antes que leídas (1)
      }
      // Orden cronológico descendente
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return dateB - dateA;
    });
  });

  private readonly cantidadState = signal<number>(0);
  readonly cantidad: Signal<number> = computed(() => {
    return this.notificaciones().filter((n) => !n.read).length;
  });

  setCantidad(cantidad: number): void {
    this.cantidadState.set(Math.max(0, cantidad));
  }

  obtenerNotificaciones(): void {
    // Fetcheamos 50 para tener un conteo preciso en el badge,
    // pero el dropdown muestra solo las 5 más recientes (slice en la signal)
    this.http.get<NotificacionesResponse>(`${environment.apiUrl}/notifications/me?size=50`).subscribe({
      next: (data) => {
        console.log('Lista de notificaciones:', data);
        const items: NotificacionBackend[] = Array.isArray(data)
          ? data
          : (data as { notifications: NotificacionBackend[] })?.notifications || [];
        const mapeadas: Notificacion[] = items.map((item) => ({
          id: item.id,
          titulo: item.titulo || item.title || 'Notificación',
          mensaje: item.mensaje || item.message || '',
          fecha: item.fecha || item.createdAt,
          tipo: item.tipo || item.type,
          alumnoId: item.studentId || item.alumnoId,
          compraId: item.purchaseId || item.compraId,
          productoId: item.productId || item.productoId,
          sugerenciaId: item.suggestionId || item.sugerenciaId,
          read: item.read ?? false,
        }));
        this.allNotificacionesState.set(mapeadas);
      },
      error: (err) => {
        console.error('Error al obtener notificaciones:', err);
      }
    });
  }

  agregarNotificacion(notificacion: Notificacion): void {
    this.allNotificacionesState.update((lista) => [
      { ...notificacion, read: notificacion.read ?? false },
      ...lista
    ]);
  }

  marcarComoLeida(notificationId: string): void {
    if (!notificationId) return;
    this.http.put<void>(`${environment.apiUrl}/notifications/${notificationId}/already-read`, {}).subscribe({
      next: () => {
        console.log(`Notificación ${notificationId} marcada como leída`);
        this.allNotificacionesState.update((lista) =>
          lista.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      },
      error: (err) => {
        console.error(`Error al marcar notificación ${notificationId} como leída:`, err);
      }
    });
  }
}
