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
      const mockRespuesta: NotificacionPrecio[] = [NotificacionesPrecioMother.crearNotificacion()];
      let respuestaObtenida: NotificacionPrecio[] | undefined;
      const userIdMock = 'user-kiosquero-1';

      givenUnUsuarioLogueado();
      whenSolicitoNotificaciones();
      thenElServicioHaceUnGetCorrectoYDevuelveLaRespuesta();

      function givenUnUsuarioLogueado() {
        // En este caso, solo preparamos los datos
      }

      function whenSolicitoNotificaciones() {
        service.getNotificaciones(userIdMock).subscribe((data) => {
          respuestaObtenida = data;
        });
      }

      function thenElServicioHaceUnGetCorrectoYDevuelveLaRespuesta() {
        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userIdMock}/preferencias?tipo=ALERTA_PRECIO`);
        expect(req.request.method).toBe('GET');
        req.flush(mockRespuesta);
        expect(respuestaObtenida).toEqual(mockRespuesta);
      }
    });
  });
});
