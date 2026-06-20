import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificacionesPrecioService } from './notificaciones-precio.service';
import { environment } from '../../../../environments/environment';
import { NotificacionPrecio } from '../models/notificacion-precio.model';

describe('NotificacionesPrecioService', () => {
  let service: NotificacionesPrecioService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificacionesPrecioService]
    });
    service = TestBed.inject(NotificacionesPrecioService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getNotificaciones', () => {
    it('dado que se requieren notificaciones, debe llamar a GET', () => {
      const usuarioId = '123';
      const mockResponse: NotificacionPrecio[] = [];

      service.getNotificaciones(usuarioId).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/usuarios/${usuarioId}/preferencias?tipo=ALERTA_PRECIO`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
