import { Injectable, Signal, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Producto } from '../../features/buffet/models/producto.model';

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
  producto?: Producto;
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
  producto?: unknown;
  product?: unknown;
}

export type NotificacionesResponse = NotificacionBackend[] | { notifications: NotificacionBackend[] };

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'notificaciones_locales_v1';

  private readonly allNotificacionesState = signal<Notificacion[]>(this.cargarDesdeLocalStorage());
  readonly notificaciones = computed(() => {
    return [...this.allNotificacionesState()].sort((a, b) => {
      const readA = a.read ? 1 : 0;
      const readB = b.read ? 1 : 0;
      if (readA !== readB) {
        return readA - readB;
      }
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

  private cargarDesdeLocalStorage(): Notificacion[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private guardarEnLocalStorage(lista: Notificacion[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
      console.error('Error guardando notificaciones en localStorage', e);
    }
  }

  obtenerNotificaciones(): void {
    this.http.get<NotificacionesResponse>(`${environment.apiUrl}/notifications/me?size=50`).subscribe({
      next: (data) => {
        console.log('Lista de notificaciones:', data);
        const items: NotificacionBackend[] = Array.isArray(data)
          ? data
          : (data as { notifications: NotificacionBackend[] })?.notifications || [];
        const mapeadas: Notificacion[] = items.map((item) => {
          let parseado = item.product || item.producto;
          if (typeof parseado === 'string' && parseado.length > 0) {
            try { parseado = JSON.parse(parseado); } catch { /* ignorar error de parseo */ }
          }
          return {
            id: item.id,
            titulo: item.titulo || item.title || 'Notificación',
            mensaje: item.mensaje || item.message || '',
            fecha: item.fecha || item.createdAt,
            tipo: item.tipo || item.type,
            alumnoId: item.studentId || item.alumnoId,
            compraId: item.purchaseId || item.compraId,
            productoId: item.productId || item.productoId,
            sugerenciaId: item.suggestionId || item.sugerenciaId,
            producto: parseado as Producto,
            read: item.read ?? false,
          };
        });
        
        // Filtramos las que ya están leídas para que no vuelvan a aparecer
        const mapeadasNoLeidas = mapeadas.filter(n => !n.read);

        this.allNotificacionesState.update((actuales) => {
          const idsDelBackend = new Set(mapeadasNoLeidas.map((m) => m.id));
          const soloLocales = actuales.filter((n) => !idsDelBackend.has(n.id) && !n.read);
          
          const nuevaLista = [...soloLocales, ...mapeadasNoLeidas];
          this.guardarEnLocalStorage(nuevaLista);
          return nuevaLista;
        });
      },
      error: (err) => {
        console.error('Error al obtener notificaciones:', err);
      }
    });
  }

  agregarNotificacion(notificacion: Notificacion): void {
    this.allNotificacionesState.update((lista) => {
      const nuevaLista = [
        { ...notificacion, read: notificacion.read ?? false },
        ...lista
      ];
      this.guardarEnLocalStorage(nuevaLista);
      return nuevaLista;
    });
  }

  marcarComoLeida(notificationId: string): void {
    if (!notificationId) return;
    this.http.put<void>(`${environment.apiUrl}/notifications/${notificationId}/already-read`, {}).subscribe({
      next: () => {
        console.log(`Notificación ${notificationId} marcada como leída`);
        // La eliminamos de la lista para que desaparezca
        this.eliminarNotificacionLocal(notificationId);
      },
      error: (err) => {
        console.error(`Error al marcar notificación ${notificationId} como leída:`, err);
        // La eliminamos localmente igual para mejor UX
        this.eliminarNotificacionLocal(notificationId);
      }
    });
  }

  eliminarNotificacionLocal(notificationIdOrSugerenciaId: string): void {
    if (!notificationIdOrSugerenciaId) return;
    this.allNotificacionesState.update((lista) => {
      const nuevaLista = lista.filter((n) => n.id !== notificationIdOrSugerenciaId && n.sugerenciaId !== notificationIdOrSugerenciaId);
      this.guardarEnLocalStorage(nuevaLista);
      return nuevaLista;
    });
  }

  marcarTodasComoLeidas(): void {
    const noLeidas = this.allNotificacionesState().filter((n) => !n.read && n.id);
    if (noLeidas.length === 0) return;

    this.allNotificacionesState.update(() => {
      const nuevaLista: Notificacion[] = []; // Borra todas localmente
      this.guardarEnLocalStorage(nuevaLista);
      return nuevaLista;
    });

    // Luego llama al backend por cada notificación no leída
    noLeidas.forEach((n) => {
      this.http.put<void>(`${environment.apiUrl}/notifications/${n.id}/already-read`, {}).subscribe({
        next: () => console.log(`Notificación ${n.id} marcada como leída`),
        error: (err) => console.error(`Error al marcar notificación ${n.id} como leída:`, err),
      });
    });
  }
}
