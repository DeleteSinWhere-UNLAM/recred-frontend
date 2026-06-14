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


@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private notificacionSaldoBajoService = inject(NotificacionSaldoBajoService);
  private notificacionSugerenciaSaludableService = inject(NotificacionSugerenciaSaludableService);
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
          console.log('Mensaje recibido en primer plano:', payload);

          const data = payload.data;
          if (!data) {
            console.log('La notificación no contiene propiedad data');
            return;
          }

          console.log(`Evaluando Notificación -> type: ${data['type']}, rol: ${data['rol']}`);

          if (data['type'] === 'LOW_BALANCE_ALERT' && data['rol'] === 'PADRE') {
            console.log('Entró a LOW_BALANCE_ALERT');
            this.notificacionSaldoBajoService.mostrar(
              Number(data['balance'] || 0),
              data['alumnoId']
            );
          }

          if (data['type'] === 'PURCHASE_SUGGESTION') {
            console.log('Entró a PURCHASE_SUGGESTION (Type correcto)');
            if (data['rol'] !== 'ALUMNO') {
              console.warn('Advertencia: El rol no es ALUMNO, es:', data['rol']);
            }

            let producto = null;
            try {
              console.log('Contenido de producto antes de parsear:', data['producto']);
              producto = typeof data['producto'] === 'string'
                ? JSON.parse(data['producto'])
                : data['producto'];
              console.log('Producto parseado exitosamente:', producto);
            } catch (e) {
              console.error('Error parseando el producto sugerido', e);
            }

            if (producto) {
              console.log('Llamando al servicio NotificacionSugerenciaSaludableService.mostrar...');
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
