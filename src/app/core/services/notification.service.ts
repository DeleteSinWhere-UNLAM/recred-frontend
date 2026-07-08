import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
  NgZone,
} from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificacionSaldoBajoService } from '../../shared/components/notifications/notificacion-saldo-bajo/notificacion-saldo-bajo.service';
import { NotificacionSugerenciaSaludableService } from '../../shared/components/notifications/notificacion-sugerencia-saludable/notificacion-sugerencia-saludable.service';
import { NotificacionesService } from '../../data-access/services/notificaciones.service';
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private notificacionSaldoBajoService = inject(NotificacionSaldoBajoService);
  private notificacionSugerenciaSaludableService = inject(NotificacionSugerenciaSaludableService);
  private notificacionesService = inject(NotificacionesService);
  private ngZone = inject(NgZone);

  requestNotificationPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        this.handleTokenRegistration();
      }
    });
    this.listenToForegroundMessages();
  }

  handleTokenRegistration() {
    runInInjectionContext(this.injector, () => {
      getToken(this.messaging, {
        vapidKey: environment.firebaseConfig.vapidKey,
      })
        .then((fcmToken) => {
          if (fcmToken) {
            const currentToken = localStorage.getItem('fcm_token');
            if (currentToken !== fcmToken) {
              this.sendTokenToBackend(fcmToken);
              localStorage.setItem('fcm_token', fcmToken);
            }
          }
        })
        .catch((err) => console.error('Error al obtener FCM token:', err));
    });
  }

  private listenToForegroundMessages() {
    runInInjectionContext(this.injector, () => {
      onMessage(this.messaging, (payload) => {
        this.ngZone.run(() => {

          const title = payload.notification?.title || 'Nueva notificación';
          const body = payload.notification?.body || '';

          const data = payload.data;
          if (!data) {
            this.notificacionesService.agregarNotificacion({
              id: String(Date.now()),
              titulo: title,
              mensaje: body,
              fecha: new Date().toISOString()
            });
            return;
          }

          let productoParseado = null;
          if (data['producto']) {
            try { productoParseado = typeof data['producto'] === 'string' ? JSON.parse(data['producto']) : data['producto']; } catch { /* ignorar error de parseo */ }
          }
          const nuevaNotif = {
            id: data['sugerenciaId'] || String(Date.now()),
            titulo: data['titulo'] || title,
            mensaje: data['mensaje'] || body,
            fecha: new Date().toISOString(),
            tipo: data['type'] || data['tipo'],
            alumnoId: data['alumnoId'],
            sugerenciaId: data['sugerenciaId'],
            producto: productoParseado
          };
          this.notificacionesService.agregarNotificacion(nuevaNotif);

          if (data['type'] === 'LOW_BALANCE_ALERT' && data['rol'] === 'PADRE') {
            this.notificacionSaldoBajoService.mostrar(
              Number(data['balance'] || 0),
              data['alumnoId']
            );
          }

          if (data['type'] === 'PURCHASE_SUGGESTION') {
            if (data['rol'] !== 'ALUMNO') {
              console.warn('Advertencia: El rol no es ALUMNO, es:', data['rol']);
            }

            let producto = null;
            try {
              producto = typeof data['producto'] === 'string'
                ? JSON.parse(data['producto'])
                : data['producto'];
            } catch (e) {
              console.error('Error parseando el producto sugerido', e);
            }

            if (producto) {
              this.notificacionSugerenciaSaludableService.mostrar(
                data['sugerenciaId'],
                data['titulo'],
                data['mensaje'],
                producto,
                data['alumnoId']
              );
            } else {
              console.error('No se llamó a mostrar() porque producto es null o undefined');
            }
          }
        });
      });
    });
  }

  private sendTokenToBackend(fcmToken: string) {
    this.http
      .post(`${environment.apiUrl}/dispositivos`, { fcmToken })
      .subscribe({
        next: () =>
          console.log('FCM Token registrado exitosamente en el backend.'),
        error: (err) =>
          console.error('Error registrando FCM token en backend:', err),
      });
  }
}
