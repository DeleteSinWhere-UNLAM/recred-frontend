import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ScheduledPickup } from '../models/tracking-pedidos.model';
import { ORDER_ID_TEST, ScheduledPickupMother } from '../tracking-pedidos.mother';
import { TrackingPedidosService } from './tracking-pedidos.service';

type GetScheduledPickupsFiltros = Parameters<TrackingPedidosService['getScheduledPickups']>[0];

describe('TrackingPedidosService', () => {
  const URL_PICKUPS = `${environment.apiUrl}/buffet/scheduled-pickups`;
  const URL_STATUS = `${environment.apiUrl}/purchases/${ORDER_ID_TEST}/status`;
  const URL_CANCEL = `${environment.apiUrl}/purchases/${ORDER_ID_TEST}/cancel`;

  let service: TrackingPedidosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackingPedidosService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TrackingPedidosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getScheduledPickups', () => {
    it('dado que no paso filtros, cuando pido los pickups, deberia hacer GET sin query params', async () => {
      const pickups = ScheduledPickupMother.crearVarios();

      const promesa = whenPidoLosPickups();
      const req = thenSeHizoGetAPickups();
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(pickups);

      expect(await promesa).toEqual(pickups);
    });

    it('dado filtros completos, cuando pido los pickups, deberia mandarlos como query params', async () => {
      const promesa = whenPidoLosPickups({
        fecha: '2026-07-03',
        status: 'PENDIENTE',
        estadoRetiro: 'PROGRAMADO',
        franjaId: 'ts-001',
        search: 'juan',
      });

      const req = thenSeHizoGetAPickups();
      expect(req.request.params.get('fecha')).toBe('2026-07-03');
      expect(req.request.params.get('status')).toBe('PENDIENTE');
      expect(req.request.params.get('estadoRetiro')).toBe('PROGRAMADO');
      expect(req.request.params.get('franjaId')).toBe('ts-001');
      expect(req.request.params.get('search')).toBe('juan');
      req.flush([]);

      await promesa;
    });

    it('dado que el back devuelve error, cuando pido los pickups, deberia rechazar la promesa', async () => {
      const promesa = whenPidoLosPickups();
      thenSeHizoGetAPickups().flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });
  });

  describe('advanceOrderStatus', () => {
    it('dado un orderId y un nextStatus, cuando avanzo el estado, deberia hacer PATCH con el status en el body', async () => {
      const promesa = firstValueFrom(service.advanceOrderStatus(ORDER_ID_TEST, 'EN_PREPARACION'));
      const req = httpMock.expectOne(URL_STATUS);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'EN_PREPARACION' });
      req.flush({});

      await promesa;
    });
  });

  describe('cancelOrder', () => {
    it('dado un orderId, cuando cancelo, deberia hacer PUT /purchases/{id}/cancel con body vacio', async () => {
      const promesa = firstValueFrom(service.cancelOrder(ORDER_ID_TEST));
      const req = httpMock.expectOne(URL_CANCEL);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({});

      await promesa;
    });
  });

  function whenPidoLosPickups(filtros?: GetScheduledPickupsFiltros): Promise<ScheduledPickup[]> {
    return firstValueFrom(service.getScheduledPickups(filtros));
  }

  function thenSeHizoGetAPickups(): ReturnType<HttpTestingController['expectOne']> {
    return httpMock.expectOne((r) => r.url === URL_PICKUPS);
  }
});
