import { Injectable, inject } from '@angular/core';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { EventoInventarioRealtime } from '../models/inventario.interface';

const REFRESH_EVENT_TYPES = new Set([
  'STOCK_CHANGED',
  'PRODUCT_SOLD_OUT',
  'LOW_STOCK',
  'NEW_ORDER',
  'PURCHASE_CREATED',
  'ORDER_UPDATED',
  'ORDER_EXPIRED',
  'DASHBOARD_CHANGED',
  'DAILY_REPORT_CHANGED',
  'DAILY_CAPACITY_LOW',
]);

const IDLE_DISCONNECT_MS = 30000;
const REALTIME_METRICS_WINDOW_MS = 60000;

interface EscuchasInventarioRealtime {
  onOpen?: () => void;
  onClose?: () => void;
  onRefresh: (event: EventoInventarioRealtime) => void;
  onPurchaseCreated?: (event: EventoInventarioRealtime) => void;
  onError?: (error: unknown) => void;
}

@Injectable({ providedIn: 'root' })
export class InventarioRealtimeService {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly subscribers = new Map<number, EscuchasInventarioRealtime>();

  private sharedAbortController: AbortController | null = null;
  private currentBuffetId: string | null = null;
  private nextSubscriberId = 0;
  private idleDisconnectTimeoutId: number | null = null;
  private sseEventCounts = new Map<string, number>();
  private refetchCounts = new Map<string, number>();
  private sseMetricsTimeoutId: number | null = null;
  private refetchMetricsTimeoutId: number | null = null;
  private status: 'disconnected' | 'connecting' | 'connected' =
    'disconnected';

  connect(
    buffetId: string,
    handlers: EscuchasInventarioRealtime,
  ): AbortController {
    const subscriberAbortController = new AbortController();
    const subscriberId = ++this.nextSubscriberId;

    this.clearIdleDisconnect();

    if (this.currentBuffetId && this.currentBuffetId !== buffetId) {
      this.notifyClose();
      this.subscribers.clear();
      this.closeSharedConnection();
    }

    this.currentBuffetId = buffetId;
    this.subscribers.set(subscriberId, handlers);

    subscriberAbortController.signal.addEventListener(
      'abort',
      () => {
        this.subscribers.delete(subscriberId);

        if (this.subscribers.size === 0) {
          this.scheduleIdleDisconnect();
        }
      },
      { once: true },
    );

    if (this.status === 'connected') {
      handlers.onOpen?.();
    }

    if (!this.sharedAbortController) {
      this.sharedAbortController = new AbortController();
      this.status = 'connecting';

      void this.startConnection(buffetId, this.sharedAbortController);
    }

    return subscriberAbortController;
  }

  disconnect(): void {
    this.subscribers.clear();
    this.closeSharedConnection();
  }

  recordRefetch(source: string): void {
    this.recordMetric(this.refetchCounts, source, 'refetch');
  }

  private async startConnection(
    buffetId: string,
    abortController: AbortController,
  ): Promise<void> {
    const token = await this.authSessionService.obtenerAccessTokenParaApi({
      reintentos: 20,
      intervaloMs: 250,
    });

    if (abortController.signal.aborted) {
      return;
    }

    if (!token) {
      if (this.sharedAbortController === abortController) {
        this.sharedAbortController = null;
        this.status = 'disconnected';
      }

      this.notifyError(new Error('No hay token disponible para SSE'));
      return;
    }

    try {
      await fetchEventSource(
        `${environment.apiUrl}/kiosqueros/${buffetId}/events`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
          openWhenHidden: true,
          onopen: async (response) => {
            if (!response.ok) {
              throw new Error(`SSE error ${response.status}`);
            }

            this.status = 'connected';
            this.notifyOpen();
          },
          onmessage: (event) => {
            const payload = this.parsePayload(event.data);

            if (!payload) {
              return;
            }

            const eventType = this.normalizeEventType(
              payload.type || event.event,
            );
            if (!eventType) {
              return;
            }

            this.recordSseEvent(eventType);

            const normalizedEvent: EventoInventarioRealtime = {
              ...payload,
              type: eventType,
            };

            if (eventType === 'PURCHASE_CREATED') {
              this.notifyPurchaseCreated(normalizedEvent);
            }

            if (REFRESH_EVENT_TYPES.has(eventType)) {
              this.notifyRefresh(normalizedEvent);
            }
          },
          onclose: () => {
            if (this.sharedAbortController === abortController) {
              this.sharedAbortController = null;
            }

            this.status = 'disconnected';
            this.notifyClose();
          },
          onerror: (error) => {
            this.status = 'disconnected';
            this.notifyError(error);
            return 5000;
          },
        },
      );

      if (
        !abortController.signal.aborted &&
        this.sharedAbortController === abortController
      ) {
        this.sharedAbortController = null;
        this.status = 'disconnected';
        this.notifyClose();
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        this.status = 'disconnected';
        this.notifyError(error);
        this.sharedAbortController = null;
      }
    }
  }

  private notifyOpen(): void {
    this.forEachSubscriber((handlers) => handlers.onOpen?.());
  }

  private notifyClose(): void {
    this.forEachSubscriber((handlers) => handlers.onClose?.());
  }

  private notifyRefresh(event: EventoInventarioRealtime): void {
    this.forEachSubscriber((handlers) => handlers.onRefresh(event));
  }

  private notifyPurchaseCreated(event: EventoInventarioRealtime): void {
    this.forEachSubscriber((handlers) =>
      handlers.onPurchaseCreated?.(event),
    );
  }

  private notifyError(error: unknown): void {
    this.forEachSubscriber((handlers) => handlers.onError?.(error));
  }

  private forEachSubscriber(
    callback: (handlers: EscuchasInventarioRealtime) => void,
  ): void {
    Array.from(this.subscribers.values()).forEach(callback);
  }

  private scheduleIdleDisconnect(): void {
    this.clearIdleDisconnect();

    this.idleDisconnectTimeoutId = window.setTimeout(() => {
      if (this.subscribers.size === 0) {
        this.closeSharedConnection();
      }
    }, IDLE_DISCONNECT_MS);
  }

  private clearIdleDisconnect(): void {
    if (this.idleDisconnectTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.idleDisconnectTimeoutId);
    this.idleDisconnectTimeoutId = null;
  }

  private closeSharedConnection(): void {
    this.clearIdleDisconnect();
    this.sharedAbortController?.abort();
    this.sharedAbortController = null;
    this.currentBuffetId = null;
    this.status = 'disconnected';
  }

  private recordSseEvent(eventType: string): void {
    this.recordMetric(this.sseEventCounts, eventType, 'sse');
  }

  private recordMetric(
    metricMap: Map<string, number>,
    key: string,
    metricType: 'sse' | 'refetch',
  ): void {
    if (environment.production) {
      return;
    }

    metricMap.set(key, (metricMap.get(key) ?? 0) + 1);

    if (metricType === 'sse' && this.sseMetricsTimeoutId === null) {
      this.sseMetricsTimeoutId = window.setTimeout(() => {
        this.logMetrics('Eventos SSE por minuto', this.sseEventCounts);
        this.sseMetricsTimeoutId = null;
      }, REALTIME_METRICS_WINDOW_MS);
    }

    if (metricType === 'refetch' && this.refetchMetricsTimeoutId === null) {
      this.refetchMetricsTimeoutId = window.setTimeout(() => {
        this.logMetrics('Refetch realtime por minuto', this.refetchCounts);
        this.refetchMetricsTimeoutId = null;
      }, REALTIME_METRICS_WINDOW_MS);
    }
  }

  private logMetrics(label: string, metricMap: Map<string, number>): void {
    if (metricMap.size === 0) {
      return;
    }

    console.info(`[Realtime] ${label}`, Object.fromEntries(metricMap));
    metricMap.clear();
  }

  private normalizeEventType(type: string | undefined): string | null {
    const normalized = type?.trim();

    if (!normalized) {
      return null;
    }

    return normalized.replace(/[\s-]+/g, '_').toUpperCase();
  }

  private parsePayload(data: string): EventoInventarioRealtime | null {
    try {
      return JSON.parse(data) as EventoInventarioRealtime;
    } catch (error) {
      console.warn('Evento SSE de inventario inválido', error);
      return null;
    }
  }
}
