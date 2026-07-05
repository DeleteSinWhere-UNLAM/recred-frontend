import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NotificacionPrecio } from '../models/notificacion-precio.model';
import { NotificacionesPrecioMother } from '../notificaciones-precio.mother';
import { NotificacionesPrecioService } from './notificaciones-precio.service';

describe('NotificacionesPrecioService', () => {
  const USUARIO_ID = 'user-kiosquero-1';
  const URL_NOTIFICACIONES = (usuarioId: string): string =>
    `${environment.apiUrl}/usuarios/${usuarioId}/preferencias?tipo=ALERTA_PRECIO`;

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

      const promesa = whenPidoNotificacionesDe(USUARIO_ID);

      thenSeHizoGetNotificacionesDe(USUARIO_ID).flush(notificaciones);

      expect(await promesa).toEqual(notificaciones);
    });

    it('dado que el back devuelve una lista vacia, cuando pido las notificaciones, deberia resolver con lista vacia', async () => {
      const promesa = whenPidoNotificacionesDe(USUARIO_ID);

      thenSeHizoGetNotificacionesDe(USUARIO_ID).flush([]);

      expect(await promesa).toEqual([]);
    });
  });

  function whenPidoNotificacionesDe(usuarioId: string): Promise<NotificacionPrecio[]> {
    return firstValueFrom(service.getNotificaciones(usuarioId));
  }

  function thenSeHizoGetNotificacionesDe(usuarioId: string): TestRequest {
    const req = httpMock.expectOne(URL_NOTIFICACIONES(usuarioId));
    expect(req.request.method).toBe('GET');
    return req;
  }
});
