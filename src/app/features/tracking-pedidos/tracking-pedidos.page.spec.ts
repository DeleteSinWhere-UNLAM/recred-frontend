import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { EstadoCompra, EstadoRetiro, ScheduledPickup } from './models/tracking-pedidos.model';
import { TrackingPedidosService } from './services/tracking-pedidos.service';
import {
  ORDER_ID_TEST,
  ScheduledPickupMother,
} from './tracking-pedidos.mother';
import { TrackingPedidosPage } from './tracking-pedidos.page';

interface ToastEsperado {
  mensaje: string;
  tipo: 'success' | 'error' | 'info';
}

interface FiltrosBackendEsperados {
  fecha?: string;
  status?: string;
  estadoRetiro?: string;
  franjaId?: string;
  search?: string;
}

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-order-details-modal', template: '', standalone: true })
class OrderDetailsModalStub {
  @Input() order!: ScheduledPickup;
  @Input() isUpdating = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() advanceStatus = new EventEmitter<{ orderId: string; nextStatus: EstadoCompra }>();
  @Output() cancelOrder = new EventEmitter<string>();
}

describe('TrackingPedidosPage', () => {
  let fixture: ComponentFixture<TrackingPedidosPage>;
  let component: TrackingPedidosPage;
  let trackingService: jasmine.SpyObj<TrackingPedidosService>;
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  async function givenPageMontada(queryParams: Record<string, string> = {}): Promise<void> {
    trackingService = jasmine.createSpyObj<TrackingPedidosService>('TrackingPedidosService', [
      'getScheduledPickups',
      'advanceOrderStatus',
      'cancelOrder',
    ]);
    trackingService.getScheduledPickups.and.returnValue(of(ScheduledPickupMother.crearVarios()));
    trackingService.advanceOrderStatus.and.returnValue(of({}));
    trackingService.cancelOrder.and.returnValue(of({}));

    usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
    ]);
    usuarioService.getUsuarioActual.and.returnValue({ id: 'u-1', nombre: 'Kiosquero Test' });

    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [TrackingPedidosPage],
      providers: [
        { provide: TrackingPedidosService, useValue: trackingService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    })
      .overrideComponent(TrackingPedidosPage, {
        remove: { imports: [NavbarComponent, OrderDetailsModalComponent] },
        add: { imports: [NavbarStub, OrderDetailsModalStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TrackingPedidosPage);
    component = fixture.componentInstance;
  }

  describe('ngOnInit', () => {
    beforeEach(async () => await givenPageMontada());

    it('dado la page recien montada, cuando detecto cambios, deberia setear la homeUrl y pedir los pickups', () => {
      whenDetectoCambios();

      thenSeSeteoLaHomeUrl('/kiosquero');
      thenSePidieronLosPickups();
    });

    it('dado pickups desordenados por fecha, cuando cargo, deberia ordenarlos por pickupDate ascendente', () => {
      whenDetectoCambios();

      thenLosPickupsEstanOrdenadosPorFecha();
    });

    it('dado que el back falla, cuando cargo, deberia setear el mensaje de error y loading false', () => {
      spyOn(console, 'error');
      givenElBackFalla();

      whenDetectoCambios();

      thenElErrorEs('No se pudieron cargar los pedidos. Por favor, intente de nuevo.');
      thenLoadingEs(false);
    });
  });

  describe('query params iniciales', () => {
    it('dado los query params fecha/status/franja/search, cuando se monta la page, deberia aplicarlos al filtro', async () => {
      await givenPageMontada({ fecha: '2026-07-03', status: 'PENDIENTE', franja: 'ts-001', search: 'juan' });

      whenDetectoCambios();

      thenLosFiltrosSon({ fecha: '2026-07-03', estado: 'PENDIENTE', franja: 'ts-001', search: 'juan' });
    });

    it('dado un status invalido en la URL, cuando se monta la page, no deberia aplicarlo', async () => {
      await givenPageMontada({ status: 'BOGUS' });

      whenDetectoCambios();

      thenElFiltroEstadoEs('');
    });

    it('dado query con "date"/"estado"/"estadoRetiro"/"franjaId", cuando se monta, deberia aplicarlos como fallback', async () => {
      await givenPageMontada({
        date: '2026-08-01',
        estado: 'LISTO',
        estadoRetiro: 'RETIRADO',
        franjaId: 'slot-1',
      });

      whenDetectoCambios();

      thenLosFiltrosSon({ fecha: '2026-08-01', estado: 'LISTO', estadoRetiro: 'RETIRADO', franja: 'slot-1' });
    });

    it('dado query con withdrawalStatus, cuando se monta, deberia aplicarlo al filtroEstadoRetiro', async () => {
      await givenPageMontada({ withdrawalStatus: 'RETIRADO' });

      whenDetectoCambios();

      thenElFiltroEstadoRetiroEs('RETIRADO');
    });

    it('dado un estadoRetiro invalido en la URL, cuando se monta, no deberia aplicarlo', async () => {
      await givenPageMontada({ estadoRetiro: 'BOGUS' });

      whenDetectoCambios();

      thenElFiltroEstadoRetiroEs('');
    });
  });

  describe('filteredPickups', () => {
    beforeEach(async () => {
      await givenPageMontada();
      whenDetectoCambios();
    });

    it('dado un search "maria", cuando filtro, deberia devolver solo el pickup de Maria', () => {
      whenSeteoSearch('maria');

      thenLosFilteredPickupsSonNombres(['Maria Lopez']);
    });

    it('dado un search por codigo de retiro, cuando filtro, deberia devolver el pickup correspondiente', () => {
      whenSeteoSearch('xyz789');

      thenLaCantidadFilteredEs(1);
    });

    it('dado la franja "TODAS", cuando filtro, deberia devolver todos los pickups', () => {
      whenSeteoFiltroFranja('TODAS');

      thenLaCantidadFilteredEs(4);
    });
  });

  describe('metrics', () => {
    beforeEach(async () => {
      await givenPageMontada();
      whenDetectoCambios();
    });

    it('dado un mix de estados, cuando leo las metrics, deberia contar pendientes, listos y vencidos', () => {
      thenLasMetricsContienen({ pendientes: '2', listos: '1', vencidos: '1' });
    });
  });

  describe('activeFiltersLabel', () => {
    beforeEach(async () => {
      await givenPageMontada();
      whenDetectoCambios();
    });

    it('dado ningun filtro aplicado, cuando leo el label, deberia decir "Sin filtros aplicados"', () => {
      thenElActiveFiltersLabelEs('Sin filtros aplicados');
    });

    it('dado varios filtros, cuando leo el label, deberia unirlos con guion', () => {
      whenSeteoFiltroFecha('2026-07-03');
      whenSeteoFiltroEstado('PENDIENTE');
      whenSeteoSearch('juan');

      thenElLabelContiene(['03/07/2026', 'A preparar', 'Busqueda: juan']);
    });

    it('dado una franja seleccionada que existe en timeSlots, activeFiltersLabel deberia incluir su descripcion', () => {
      const slot = component['timeSlots']()[0];
      whenSeteoFiltroFranja(slot.id);

      thenElLabelContiene([slot.description]);
    });

    it('dado una franja seleccionada que no esta en timeSlots, activeFiltersLabel deberia usar "Franja seleccionada"', () => {
      whenSeteoFiltroFranja('no-existe');

      thenElLabelContiene(['Franja seleccionada']);
    });

    it('dado un estadoRetiro seleccionado, activeFiltersLabel deberia incluir su label', () => {
      whenSeteoFiltroEstadoRetiro('RETIRADO');

      thenElLabelContiene(['Retirado']);
    });
  });

  describe('handlers de acciones', () => {
    beforeEach(async () => {
      await givenPageMontada();
      whenDetectoCambios();
    });

    it('cuando hago click en verDetalles, deberia setear el selectedOrder', () => {
      const order = ScheduledPickupMother.crear();

      whenClickeoVerDetalles(order);

      thenElSelectedOrderEs(order);
    });

    it('cuando hago click en cerrarModal, deberia limpiar el selectedOrder', () => {
      givenSelectedOrder(ScheduledPickupMother.crear());

      whenClickeoCerrarModal();

      thenElSelectedOrderEs(null);
    });

    it('cuando avanzo el estado, deberia llamar al service, mostrar toast success y recargar', () => {
      whenAvanzoEstado({ orderId: ORDER_ID_TEST, nextStatus: 'LISTO' });

      thenSeAvanzoEstado(ORDER_ID_TEST, 'LISTO');
      thenSeMostroToast({ mensaje: 'Estado del pedido actualizado a: LISTO', tipo: 'success' });
    });

    it('dado que falla advanceOrderStatus, cuando avanzo, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      givenAdvanceOrderStatusFalla();

      whenAvanzoEstado({ orderId: ORDER_ID_TEST, nextStatus: 'LISTO' });

      thenSeMostroToast({ mensaje: 'Error al cambiar el estado del pedido', tipo: 'error' });
    });

    it('cuando cancelo un pedido, deberia mostrar toast success y cerrar el modal', () => {
      givenSelectedOrder(ScheduledPickupMother.crear());

      whenCancelo(ORDER_ID_TEST);

      thenSeCancelo(ORDER_ID_TEST);
      thenSeMostroToast({ mensaje: 'Pedido cancelado y saldo reembolsado', tipo: 'success' });
      thenElSelectedOrderEs(null);
    });

    it('dado cancelOrder que falla, cuando cancelo, deberia mostrar toast de error', () => {
      spyOn(console, 'error');
      givenCancelOrderFalla();

      whenCancelo(ORDER_ID_TEST);

      thenSeMostroToast({ mensaje: 'Error al cancelar el pedido', tipo: 'error' });
    });
  });

  describe('limpiarFiltros y volverHome', () => {
    beforeEach(async () => {
      await givenPageMontada();
      whenDetectoCambios();
    });

    it('cuando limpio filtros, deberia resetear todos los signals', () => {
      whenSeteoFiltroFecha('2026-07-03');
      whenSeteoFiltroEstado('PENDIENTE');
      whenSeteoSearch('juan');

      whenLimpioFiltros();

      thenLosFiltrosSon({ fecha: '', estado: '', search: '' });
    });

    it('cuando hago click en volver, deberia navegar a /kiosquero', () => {
      whenClickeoVolver();

      thenSeNavegoA('/kiosquero');
    });
  });

  describe('getEstadoCompraLabel y getEstadoRetiroLabel', () => {
    beforeEach(async () => await givenPageMontada());

    it('dado un EstadoCompra, cuando pido el label, deberia devolver el texto esperado', () => {
      thenEstadoCompraLabelEs('LISTO', 'Listo para retirar');
      thenEstadoCompraLabelEs('', 'Todos los pedidos');
    });

    it('dado un EstadoRetiro, cuando pido el label, deberia devolver el texto esperado', () => {
      thenEstadoRetiroLabelEs('RETIRADO', 'Retirado');
      thenEstadoRetiroLabelEs('', 'Todos los retiros');
    });
  });

  describe('statusBadgeClass y getItemsSummary', () => {
    beforeEach(async () => await givenPageMontada());

    it('dado un status, cuando pido la clase del badge, deberia devolver la clase con el status en minusculas', () => {
      thenStatusBadgeClassEs('PENDIENTE', 'tp-status tp-status--pendiente');
    });

    it('dado un pedido con items, cuando pido el summary, deberia unirlos como "nombre xcantidad"', () => {
      thenItemsSummaryEs(ScheduledPickupMother.crear(), 'Alfajor x2');
    });
  });

  describe('handlers de cambio de filtro', () => {
    beforeEach(async () => {
      await givenPageMontada();
      whenDetectoCambios();
    });

    it('cuando cambio la fecha, deberia setear filterFecha y recargar', () => {
      resetGetScheduledPickups();

      whenCambioFecha('2026-07-05');

      thenElFiltroFechaEs('2026-07-05');
      thenSeRecargaronNVeces(1);
    });

    it('cuando cambio la franja, deberia setear filterFranja y recargar', () => {
      resetGetScheduledPickups();

      whenCambioFranja('ts-001');

      thenElFiltroFranjaEs('ts-001');
      thenSeRecargaronNVeces(1);
    });

    it('cuando cambio el estadoCompra a uno valido, deberia setearlo y recargar', () => {
      resetGetScheduledPickups();

      whenCambioEstadoCompra('LISTO');

      thenElFiltroEstadoEs('LISTO');
      thenSeRecargaronNVeces(1);
    });

    it('cuando cambio el estadoCompra a uno invalido, deberia limpiar el filtro', () => {
      whenSeteoFiltroEstado('LISTO');

      whenCambioEstadoCompra('OTRO');

      thenElFiltroEstadoEs('');
    });

    it('cuando cambio el estadoRetiro a uno valido, deberia setearlo y recargar', () => {
      resetGetScheduledPickups();

      whenCambioEstadoRetiro('RETIRADO');

      thenElFiltroEstadoRetiroEs('RETIRADO');
      thenSeRecargaronNVeces(1);
    });

    it('cuando cambio el estadoRetiro a uno invalido, deberia limpiar el filtro', () => {
      whenSeteoFiltroEstadoRetiro('RETIRADO');

      whenCambioEstadoRetiro('OTRO');

      thenElFiltroEstadoRetiroEs('');
    });
  });

  describe('loadPickups y buildBackendFilters', () => {
    beforeEach(async () => {
      await givenPageMontada();
      whenDetectoCambios();
    });

    it('dado un selectedOrder existente, cuando recargo, deberia actualizarlo desde la nueva lista', () => {
      const original = ScheduledPickupMother.crearVarios()[0];
      givenSelectedOrder(original);
      givenLosProximosPickups([{ ...original, status: 'LISTO' }]);

      whenRecargoPickups();

      thenElSelectedOrderTieneStatus('LISTO');
    });

    it('dado un selectedOrder que ya no esta en la lista recargada, cuando recargo, deberia setearlo null', () => {
      givenSelectedOrder(ScheduledPickupMother.crearVarios()[0]);
      givenLosProximosPickups([]);

      whenRecargoPickups();

      thenElSelectedOrderEs(null);
    });

    it('dado sin filtros aplicados, cuando pido buildBackendFilters, deberia devolver undefined', () => {
      thenBuildBackendFiltersEs(undefined);
    });

    it('dado todos los filtros aplicados, cuando pido buildBackendFilters, deberia devolver un objeto completo', () => {
      whenSeteoFiltroFecha('2026-07-05');
      whenSeteoFiltroEstado('LISTO');
      whenSeteoFiltroEstadoRetiro('RETIRADO');
      whenSeteoFiltroFranja('ts-001');
      whenSeteoSearch('juan');

      thenBuildBackendFiltersEs({
        fecha: '2026-07-05',
        status: 'LISTO',
        estadoRetiro: 'RETIRADO',
        franjaId: 'ts-001',
        search: 'juan',
      });
    });

    it('dado dos requests seguidos, la respuesta del primero deberia ignorarse', () => {
      const primeraResolver = givenLoadPickupsResuelvenEnOrden([
        ScheduledPickupMother.crearVarios(),
        [ScheduledPickupMother.crear({ studentName: 'Nuevo' })],
      ]);

      whenRecargoPickups();
      whenRecargoPickups();
      primeraResolver.resolvePrimero();

      thenElPrimerPickupTieneNombre('Nuevo');
    });
  });

  describe('formatDate', () => {
    it('dado un valor sin guiones, cuando lo formateo, deberia devolverlo tal cual', async () => {
      await givenPageMontada();
      whenDetectoCambios();

      thenFormatDateDevuelve('no-date', 'no-date');
    });
  });

  function givenElBackFalla(): void {
    trackingService.getScheduledPickups.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenAdvanceOrderStatusFalla(): void {
    trackingService.advanceOrderStatus.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenCancelOrderFalla(): void {
    trackingService.cancelOrder.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenSelectedOrder(order: ScheduledPickup | null): void {
    component['selectedOrder'].set(order);
  }

  function givenLosProximosPickups(pickups: ScheduledPickup[]): void {
    trackingService.getScheduledPickups.and.returnValue(of(pickups));
  }

  function givenLoadPickupsResuelvenEnOrden(responses: ScheduledPickup[][]): { resolvePrimero(): void } {
    let resolvePrimero: (value: ScheduledPickup[]) => void = () => undefined;
    const observableCustom = new Observable<ScheduledPickup[]>((subscriber) => {
      resolvePrimero = (value) => {
        subscriber.next(value);
        subscriber.complete();
      };
      return () => undefined;
    });
    trackingService.getScheduledPickups.and.returnValues(observableCustom, of(responses[1]));
    return { resolvePrimero: () => resolvePrimero(responses[0]) };
  }

  function resetGetScheduledPickups(): void {
    trackingService.getScheduledPickups.calls.reset();
  }

  function whenDetectoCambios(): void {
    fixture.detectChanges();
  }

  function whenSeteoSearch(valor: string): void {
    component['onSearchChange'](valor);
  }

  function whenSeteoFiltroFecha(valor: string): void {
    component['filterFecha'].set(valor);
  }

  function whenSeteoFiltroEstado(valor: EstadoCompra | ''): void {
    component['filterEstado'].set(valor);
  }

  function whenSeteoFiltroEstadoRetiro(valor: EstadoRetiro | ''): void {
    component['filterEstadoRetiro'].set(valor);
  }

  function whenSeteoFiltroFranja(valor: string): void {
    component['filterFranja'].set(valor);
  }

  function whenCambioFecha(valor: string): void {
    component['onFechaChange'](valor);
  }

  function whenCambioFranja(valor: string): void {
    component['onFranjaChange'](valor);
  }

  function whenCambioEstadoCompra(valor: string): void {
    component['onEstadoCompraChange'](valor);
  }

  function whenCambioEstadoRetiro(valor: string): void {
    component['onEstadoRetiroChange'](valor);
  }

  function whenClickeoVerDetalles(order: ScheduledPickup): void {
    component['onVerDetalles'](order);
  }

  function whenClickeoCerrarModal(): void {
    component['onCerrarModal']();
  }

  function whenAvanzoEstado(event: { orderId: string; nextStatus: EstadoCompra }): void {
    component['onAdvanceStatus'](event);
  }

  function whenCancelo(orderId: string): void {
    component['onCancelOrder'](orderId);
  }

  function whenLimpioFiltros(): void {
    component['limpiarFiltros']();
  }

  function whenClickeoVolver(): void {
    component['volverHome']();
  }

  function whenRecargoPickups(): void {
    component['loadPickups']();
  }

  function thenSeSeteoLaHomeUrl(url: string): void {
    expect(usuarioService.setHomeUrl).toHaveBeenCalledWith(url);
  }

  function thenSePidieronLosPickups(): void {
    expect(trackingService.getScheduledPickups).toHaveBeenCalled();
  }

  function thenLosPickupsEstanOrdenadosPorFecha(): void {
    const pickups = component['allPickupsState']();
    expect(pickups[0].pickupDate <= pickups[pickups.length - 1].pickupDate).toBeTrue();
  }

  function thenElErrorEs(esperado: string): void {
    expect(component['error']()).toBe(esperado);
  }

  function thenLoadingEs(esperado: boolean): void {
    expect(component['loading']()).toBe(esperado);
  }

  function thenElFiltroFechaEs(esperado: string): void {
    expect(component['filterFecha']()).toBe(esperado);
  }

  function thenElFiltroEstadoEs(esperado: EstadoCompra | ''): void {
    expect(component['filterEstado']()).toBe(esperado);
  }

  function thenElFiltroEstadoRetiroEs(esperado: EstadoRetiro | ''): void {
    expect(component['filterEstadoRetiro']()).toBe(esperado);
  }

  function thenElFiltroFranjaEs(esperado: string): void {
    expect(component['filterFranja']()).toBe(esperado);
  }

  function thenLosFiltrosSon(esperado: {
    fecha?: string;
    estado?: EstadoCompra | '';
    estadoRetiro?: EstadoRetiro | '';
    franja?: string;
    search?: string;
  }): void {
    if (esperado.fecha !== undefined) thenElFiltroFechaEs(esperado.fecha);
    if (esperado.estado !== undefined) thenElFiltroEstadoEs(esperado.estado);
    if (esperado.estadoRetiro !== undefined) thenElFiltroEstadoRetiroEs(esperado.estadoRetiro);
    if (esperado.franja !== undefined) thenElFiltroFranjaEs(esperado.franja);
    if (esperado.search !== undefined) expect(component['filterSearch']()).toBe(esperado.search);
  }

  function thenLosFilteredPickupsSonNombres(nombres: string[]): void {
    const filtered = component['filteredPickups']();
    expect(filtered.length).toBe(nombres.length);
    expect(filtered.map((p) => p.studentName)).toEqual(nombres);
  }

  function thenLaCantidadFilteredEs(cantidad: number): void {
    expect(component['filteredPickups']().length).toBe(cantidad);
  }

  function thenLasMetricsContienen(esperado: { pendientes: string; listos: string; vencidos: string }): void {
    const [pendientes, listos, vencidos] = component['metrics']();
    expect(pendientes.value).toContain(esperado.pendientes);
    expect(listos.value).toContain(esperado.listos);
    expect(vencidos.value).toContain(esperado.vencidos);
  }

  function thenElActiveFiltersLabelEs(esperado: string): void {
    expect(component['activeFiltersLabel']()).toBe(esperado);
  }

  function thenElLabelContiene(fragmentos: string[]): void {
    const label = component['activeFiltersLabel']();
    fragmentos.forEach((fragmento) => expect(label).toContain(fragmento));
  }

  function thenElSelectedOrderEs(order: ScheduledPickup | null): void {
    expect(component['selectedOrder']()).toEqual(order);
  }

  function thenElSelectedOrderTieneStatus(status: EstadoCompra): void {
    expect(component['selectedOrder']()?.status).toBe(status);
  }

  function thenSeAvanzoEstado(orderId: string, status: EstadoCompra): void {
    expect(trackingService.advanceOrderStatus).toHaveBeenCalledWith(orderId, status);
  }

  function thenSeCancelo(orderId: string): void {
    expect(trackingService.cancelOrder).toHaveBeenCalledWith(orderId);
  }

  function thenSeMostroToast(esperado: ToastEsperado): void {
    expect(toastService.mostrar).toHaveBeenCalledWith(esperado.mensaje, esperado.tipo);
  }

  function thenSeNavegoA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }

  function thenEstadoCompraLabelEs(status: EstadoCompra | '', esperado: string): void {
    expect(component['getEstadoCompraLabel'](status)).toBe(esperado);
  }

  function thenEstadoRetiroLabelEs(status: EstadoRetiro | '', esperado: string): void {
    expect(component['getEstadoRetiroLabel'](status)).toBe(esperado);
  }

  function thenStatusBadgeClassEs(status: EstadoCompra, esperado: string): void {
    expect(component['statusBadgeClass'](status)).toBe(esperado);
  }

  function thenItemsSummaryEs(order: ScheduledPickup, esperado: string): void {
    expect(component['getItemsSummary'](order)).toBe(esperado);
  }

  function thenSeRecargaronNVeces(n: number): void {
    expect(trackingService.getScheduledPickups).toHaveBeenCalledTimes(n);
  }

  function thenBuildBackendFiltersEs(esperado: FiltrosBackendEsperados | undefined): void {
    const priv = component as unknown as { buildBackendFilters(): FiltrosBackendEsperados | undefined };
    if (esperado === undefined) {
      expect(priv.buildBackendFilters()).toBeUndefined();
    } else {
      expect(priv.buildBackendFilters()).toEqual(esperado);
    }
  }

  function thenElPrimerPickupTieneNombre(nombre: string): void {
    expect(component['allPickupsState']()[0].studentName).toBe(nombre);
  }

  function thenFormatDateDevuelve(entrada: string, esperado: string): void {
    const priv = component as unknown as { formatDate(v: string): string };
    expect(priv.formatDate(entrada)).toBe(esperado);
  }
});
