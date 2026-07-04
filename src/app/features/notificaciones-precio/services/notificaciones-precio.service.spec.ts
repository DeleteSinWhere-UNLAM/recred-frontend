import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NotificacionesPrecioMother } from '../notificaciones-precio.mother';
import { NotificacionesPrecioService } from './notificaciones-precio.service';

describe('NotificacionesPrecioService', () => {
  const USUARIO_ID = 'user-kiosquero-1';

  let service: NotificacionesPrecioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificacionesPrecioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NotificacionesPrecioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getNotificaciones', () => {
    it('dado un usuarioId, cuando pido las notificaciones, deberia hacer GET al endpoint de preferencias con tipo=ALERTA_PRECIO', async () => {
      const notificaciones = [NotificacionesPrecioMother.crearNotificacion()];

      const promesa = firstValueFrom(service.getNotificaciones(USUARIO_ID));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/usuarios/${USUARIO_ID}/preferencias?tipo=ALERTA_PRECIO`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(notificaciones);

      expect(await promesa).toEqual(notificaciones);
    });

    it('dado que el back devuelve una lista vacia, cuando pido las notificaciones, deberia resolver con lista vacia', async () => {
      const promesa = firstValueFrom(service.getNotificaciones(USUARIO_ID));
      httpMock
        .expectOne(`${environment.apiUrl}/usuarios/${USUARIO_ID}/preferencias?tipo=ALERTA_PRECIO`)
        .flush([]);

      expect(await promesa).toEqual([]);
    });
  });
});
