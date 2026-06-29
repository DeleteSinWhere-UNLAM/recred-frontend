import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificacionesPrecioService } from './notificaciones-precio.service';
import { NotificacionPrecio } from '../models/notificacion-precio.model';
import { NotificacionesPrecioMother } from '../notificaciones-precio.mother';

describe('NotificacionesPrecioService', () => {
  let service: NotificacionesPrecioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificacionesPrecioService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(NotificacionesPrecioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Obtención de notificaciones', () => {
    it('debería solicitar las notificaciones de alerta de precio realizando un GET al endpoint correspondiente', () => {
      
      const userIdMock = 'user-kiosquero-1';
      const mockRespuesta: NotificacionPrecio[] = [NotificacionesPrecioMother.crearNotificacion()];
      let respuestaObtenida: NotificacionPrecio[] | undefined;

      service.getNotificaciones(userIdMock).subscribe((data) => {
        respuestaObtenida = data;
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userIdMock}/preferencias?tipo=ALERTA_PRECIO`);
      req.flush(mockRespuesta);

      expect(req.request.method).toBe('GET');
      expect(respuestaObtenida).toEqual(mockRespuesta);
    });
  });
});
