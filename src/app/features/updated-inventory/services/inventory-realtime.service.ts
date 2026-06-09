import { Injectable, inject } from '@angular/core';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { RealtimeInventoryEvent } from '../models/inventory.interface';

const REFRESH_EVENT_TYPES = new Set([
  'STOCK_CHANGED',
  'PRODUCT_SOLD_OUT',
  'LOW_STOCK',
  'NEW_ORDER',
  'PURCHASE_CREATED',
  'ORDER_UPDATED',
  'DAILY_CAPACITY_LOW',
]);

interface InventoryRealtimeHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onRefresh: (event: RealtimeInventoryEvent) => void;
  onPurchaseCreated?: (event: RealtimeInventoryEvent) => void;
  onError?: (error: unknown) => void;
}

@Injectable({ providedIn: 'root' })
export class InventoryRealtimeService {
  private readonly authSessionService = inject(AuthSessionService);

  connect(
    buffetId: string,
    handlers: InventoryRealtimeHandlers,
  ): AbortController {
    const abortController = new AbortController();

    void this.startConnection(buffetId, abortController, handlers);

    return abortController;
  }

  private async startConnection(
    buffetId: string,
    abortController: AbortController,
    handlers: InventoryRealtimeHandlers,
  ): Promise<void> {
    const token = await this.authSessionService.obtenerAccessTokenParaApi({
      reintentos: 20,
      intervaloMs: 250,
    });

    if (!token || abortController.signal.aborted) {
      handlers.onError?.(new Error('No hay token disponible para SSE'));
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

            handlers.onOpen?.();
          },
          onmessage: (event) => {
            const payload = this.parsePayload(event.data);

            if (!payload) {
              return;
            }

            const eventType = payload.type?.toUpperCase();
            if (!eventType) {
              return;
            }

            const normalizedEvent: RealtimeInventoryEvent = { ...payload, type: eventType };

            if (eventType === 'PURCHASE_CREATED') {
              handlers.onPurchaseCreated?.(normalizedEvent);
            }

            if (REFRESH_EVENT_TYPES.has(eventType)) {
              handlers.onRefresh(normalizedEvent);
            }
          },
          onclose: () => {
            handlers.onClose?.();
          },
          onerror: (error) => {
            handlers.onError?.(error);
            return 5000;
          },
        },
      );
    } catch (error) {
      if (!abortController.signal.aborted) {
        handlers.onError?.(error);
      }
    }
  }

  private parsePayload(data: string): RealtimeInventoryEvent | null {
    try {
      return JSON.parse(data) as RealtimeInventoryEvent;
    } catch (error) {
      console.warn('Evento SSE de inventario invalido', error);
      return null;
    }
  }
}
