import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TrackingPedidosService } from './tracking-pedidos.service';
import { environment } from '../../../../environments/environment';
import { ScheduledPickup, EstadoCompra } from '../models/tracking-pedidos.model';

describe('TrackingPedidosService', () => {
  let service: TrackingPedidosService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TrackingPedidosService]
    });
    service = TestBed.inject(TrackingPedidosService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getScheduledPickups', () => {
    it('dado que no hay filtros, debe llamar a GET sin parametros', () => {
      service.getScheduledPickups().subscribe();
      const req = httpTestingController.expectOne(`${environment.apiUrl}/buffet/scheduled-pickups`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('dado que hay filtros, debe llamar a GET con multiples parametros', () => {
      const filters = {
        fecha: '2023-10-10',
        estadoRetiro: 'PENDIENTE',
        franjaId: '1',
        search: 'test'
      };

      service.getScheduledPickups(filters).subscribe();

      const req = httpTestingController.expectOne(request => 
        request.url === `${environment.apiUrl}/buffet/scheduled-pickups` &&
        request.params.get('fecha') === '2023-10-10' &&
        request.params.get('estadoRetiro') === 'PENDIENTE' &&
        request.params.get('franjaId') === '1' &&
        request.params.get('search') === 'test'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('advanceOrderStatus', () => {
    it('dado que se actualiza el estado, debe llamar a PATCH', () => {
      service.advanceOrderStatus('ord1', 'ENTREGADO').subscribe();

      const req = httpTestingController.expectOne(`${environment.apiUrl}/purchases/ord1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'ENTREGADO' });
      req.flush({});
    });
  });

  describe('cancelOrder', () => {
    it('dado que se cancela el pedido, debe llamar a PUT', () => {
      service.cancelOrder('ord1').subscribe();

      const req = httpTestingController.expectOne(`${environment.apiUrl}/purchases/ord1/cancel`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({});
    });
  });
});
