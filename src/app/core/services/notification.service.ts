import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
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

  requestNotificationPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        this.handleTokenRegistration();
      } else {
        console.log('Permiso denegado por el usuario.');
      }
    });
    this.listenToForegroundMessages();
  }

  handleTokenRegistration() {
    runInInjectionContext(this.injector, () => {
      getToken(this.messaging, { vapidKey: environment.firebaseConfig.vapidKey })
        .then((fcmToken) => {
          if (fcmToken) {
            const currentToken = localStorage.getItem('fcm_token');
            console.log(currentToken)
            if (currentToken !== fcmToken) {
              console.log('Token FCM nuevo o rotado. Enviando al backend...');
              console.log(fcmToken)
              this.sendTokenToBackend(fcmToken);
              localStorage.setItem('fcm_token', fcmToken);
            } else {
              console.log('El Token FCM no ha cambiado, no es necesario llamar al backend.');
            }
          } else {
            console.log('No se pudo obtener el token de registro FCM.');
          }
        })
        .catch((err) => console.error('Error al obtener FCM token:', err));
    });
  }

  private listenToForegroundMessages() {
    runInInjectionContext(this.injector, () => {
      onMessage(this.messaging, (payload) => {
        console.log('Mensaje recibido en primer plano:', payload);

        if (payload.data && payload.data['type'] === 'LOW_BALANCE_ALERT' && payload.data['rol'] === 'PADRE') {
          this.notificacionSaldoBajoService.mostrar(
            Number(payload.data['balance'] || 0),
            payload.data['alumnoId']
          );
        }

        if (payload.data && payload.data['type'] === 'PURCHASE_SUGGESTION' && payload.data['rol'] === 'ALUMNO') {
          let producto = null;
          try {
            producto = typeof payload.data['producto'] === 'string' 
              ? JSON.parse(payload.data['producto']) 
              : payload.data['producto'];
          } catch (e) {
            console.error('Error parseando el producto sugerido', e);
          }

          if (producto) {
            this.notificacionSugerenciaSaludableService.mostrar(
              payload.data['sugerenciaId'],
              payload.data['titulo'],
              payload.data['mensaje'],
              producto,
              payload.data['alumnoId']
            );
          }
        }



      });
    });
  }

  private sendTokenToBackend(fcmToken: string) {
    this.http.post(`${environment.apiUrl}/dispositivos`, { fcmToken })
      .subscribe({
        next: () => console.log('FCM Token registrado exitosamente en el backend.'),
        error: (err) => console.error('Error registrando FCM token en backend:', err)
      });
  }
}
