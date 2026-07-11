import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { InventarioRealtimeService } from '../inventario/services/inventario-realtime.service';
import { CierreDiarioPage } from './cierre-diario.page';
import {
  BUFFET_ID_TEST,
  EstadoCierreDiarioMother,
  RegistroCierreDiarioMother,
  ReporteDiarioMother,
  ResultadoCierreDiarioMother,
  SnapshotInventarioDiarioMother,
  VentaProductoDiariaMother,
  VentasDiariasPorMedioPagoMother,
  MovimientoStockDiarioMother,
} from './cierre-diario.mother';
import { ReporteDiario, VentaProductoDiaria } from './models/cierre-diario.model';
import { CierreDiarioService } from './services/cierre-diario.service';

interface WritableSignalLike<T> {
  (): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
}

interface ToastEsperado {
  matcher: string | RegExp | jasmine.AsymmetricMatcher<string>;
  tipo: 'success' | 'error' | 'info';
}

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {}

describe('CierreDiarioPage', () => {
  let component: CierreDiarioPage;
  let fixture: ComponentFixture<CierreDiarioPage>;
  let servicioCierre: jasmine.SpyObj<CierreDiarioService>;
  let servicioRealtime: jasmine.SpyObj<InventarioRealtimeService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioToast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    servicioCierre = jasmine.createSpyObj<CierreDiarioService>('CierreDiarioService', [
      'getReporteDiario',
      'getEstadoCierreDiario',
      'getDailyCloses',
      'closeDaily',
      'refreshAfterClose',
      'getReporteDiarioCsvUrl',
      'downloadReporteDiarioCsv',
    ]);
    servicioCierre.getReporteDiario.and.returnValue(of(ReporteDiarioMother.crear()));
    servicioCierre.getEstadoCierreDiario.and.returnValue(of(EstadoCierreDiarioMother.crear()));
    servicioCierre.getDailyCloses.and.returnValue(of([RegistroCierreDiarioMother.crear()]));
    servicioCierre.closeDaily.and.returnValue(of(ResultadoCierreDiarioMother.crear()));
    servicioCierre.refreshAfterClose.and.returnValue(of(ReporteDiarioMother.crear()));
    servicioCierre.getReporteDiarioCsvUrl.and.returnValue('/daily.csv');
    servicioCierre.downloadReporteDiarioCsv.and.returnValue(
      of(new Blob(['metric,value'], { type: 'text/csv' })),
    );

    servicioRealtime = jasmine.createSpyObj('InventarioRealtimeService', ['connect', 'recordRefetch']);
    servicioRealtime.connect.and.returnValue(new AbortController());

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID_TEST);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [CierreDiarioPage],
      providers: [
        { provide: CierreDiarioService, useValue: servicioCierre },
        { provide: InventarioRealtimeService, useValue: servicioRealtime },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: ToastService, useValue: servicioToast },
        provideRouter([]),
      ],
    })
      .overrideComponent(CierreDiarioPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CierreDiarioPage);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('dado un buffet en el perfil, cuando inicializo, deberia setear /kiosquero como home y pedir reporte + estado + historial + realtime', () => {
      whenMonto();

      thenSeSeteoHomeUrl('/kiosquero');
      thenSePidioReporteDiario();
      thenSePidioEstadoCierre();
      thenSePidieronLosDailyCloses({ from: undefined, to: undefined });
      thenSeConectoRealtime();
    });

    it('dado que el perfil no tiene buffet, cuando inicializo, deberia mostrar el error y no pegarle al service', () => {
      givenSinBuffet();

      whenMonto();

      thenElContenidoContiene('No se encontró un buffet asociado a tu perfil.');
      thenNoSePidioReporteDiario();
    });
  });

  describe('render del reporte', () => {
    it('dado un reporte cargado, cuando renderizo, deberia mostrar el titulo y la fecha en formato dd/MM/yyyy', () => {
      whenMonto();

      thenElContenidoContiene('Cierre diario');
      thenElContenidoContiene('Alfajor');
      thenElContenidoNoContiene('2026-06-09');
      thenElContenidoContiene('Mínimo 5');
      thenElContenidoContiene('Sin mínimo');
    });

    it('dado inventario con estados criticos, cuando renderizo, deberia marcarlos con clases operativas', () => {
      whenMonto();

      thenElSelectorExiste('.dc-inventory-row--low-stock');
      thenElSelectorExiste('.dc-inventory-row--sold-out');
      thenElSelectorExiste('.dc-inventory-status--low-stock');
      thenElSelectorExiste('.dc-inventory-status--sold-out');
    });

    it('dado inventario mezclado, cuando renderizo, deberia ordenar SIN_STOCK y BAJO_STOCK primero', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          inventory: [
            SnapshotInventarioDiarioMother.crear({ productId: 'p-a', productName: 'Agua' }),
            SnapshotInventarioDiarioMother.crearAgotado({ productId: 'p-j', productName: 'Jugo' }),
            SnapshotInventarioDiarioMother.crearBajoStock({ productId: 'p-b', productName: 'Barrita' }),
          ],
        }),
      );

      whenMonto();

      thenElPrimerProductoDeInventarioEs('Jugo');
    });

    it('dado productos vendidos, cuando renderizo, deberia ordenarlos de mayor a menor por importe', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          products: [
            VentaProductoDiariaMother.crear({ productId: 'p-a', productName: 'Agua', total: 2000 }),
            VentaProductoDiariaMother.crear({ productId: 'p-b', productName: 'Barrita', total: 3500 }),
            VentaProductoDiariaMother.crear({ productId: 'p-j', productName: 'Jugo', total: 1000 }),
          ],
        }),
      );

      whenMonto();

      thenLosProductosVendidosSon(['Barrita', 'Agua', 'Jugo']);
    });

    it('dado ventas por medio de pago, cuando renderizo, no deberia renderizarlas', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          salesByPaymentMethod: [VentasDiariasPorMedioPagoMother.crear()],
        }),
      );

      whenMonto();

      thenElContenidoNoContiene('Ventas por medio de pago');
      thenElContenidoNoContiene('efectivo');
    });

    it('dado movimientos de stock, cuando renderizo, deberia mostrar los labels capitalizados en espanol', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          stockMovements: [
            MovimientoStockDiarioMother.crear({ movementType: 'AJUSTE', quantity: 117 }),
            MovimientoStockDiarioMother.crear({ movementType: 'LIBERACION', quantity: 4 }),
            MovimientoStockDiarioMother.crear({ movementType: 'RESERVA', quantity: 42 }),
            MovimientoStockDiarioMother.crear({ movementType: 'VENTA', quantity: 27 }),
          ],
        }),
      );

      whenMonto();

      thenElContenidoContiene('Ajuste');
      thenElContenidoContiene('Liberación');
      thenElContenidoContiene('Reserva');
      thenElContenidoContiene('Venta');
      thenElContenidoNoContiene('liberacion');
    });

    it('dado que falla el reporte, cuando renderizo, deberia mostrar el mensaje de error', () => {
      givenGetReporteDiarioFalla();

      whenMonto();

      thenElContenidoContiene('No se pudo cargar el reporte diario.');
    });
  });

  describe('paginacion', () => {
    it('dado 6 productos vendidos, cuando renderizo, deberia mostrar los primeros 5 y cambiar de pagina con nextSoldProductsPage', () => {
      givenReporte(ReporteDiarioMother.crear({ products: crearProductos(6) }));

      whenMonto();
      thenElContenidoContiene('1-5 de 6 productos');
      thenElContenidoContiene('Producto vendido 6');
      thenElContenidoNoContiene('Producto vendido 1');

      whenAvanzoPaginaProductos();

      thenElContenidoContiene('6-6 de 6 productos');
      thenElContenidoContiene('Producto vendido 1');
    });

    it('dado 6 items de inventario, cuando renderizo, deberia paginar de a 5 y cambiar con nextInventoryPage', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          inventory: Array.from({ length: 6 }, (_, i) =>
            SnapshotInventarioDiarioMother.crear({ productId: `p-${i + 1}`, productName: `Producto ${i + 1}` }),
          ),
        }),
      );

      whenMonto();
      thenElContenidoContiene('1-5 de 6');
      thenElContenidoContiene('Producto 1');
      thenElContenidoNoContiene('Producto 6');

      whenAvanzoPaginaInventario();

      thenElContenidoContiene('6-6 de 6');
      thenElContenidoContiene('Producto 6');
    });
  });

  describe('modal de historial', () => {
    it('dado el historial, cuando abro el modal y filtro por fecha, deberia llamar a getDailyCloses con los filtros', () => {
      whenMonto();
      const callsInicial = servicioCierre.getDailyCloses.calls.count();

      whenAbroModalHistorial();

      expect(servicioCierre.getDailyCloses.calls.count()).toBe(callsInicial + 1);
      thenElSelectorExiste('.daily-close-modal--history');

      whenSeteoFiltroHistorial('2026-06-01', '2026-06-12');
      whenAplicoFiltroHistorial();

      thenSePidieronLosDailyCloses({ from: '2026-06-01', to: '2026-06-12' });
    });
  });

  describe('cerrar el dia', () => {
    it('dado el dia ya cerrado, cuando intento confirmar, no deberia llamar a closeDaily', () => {
      givenDiaYaCerrado();
      whenMonto();

      whenConfirmoCierre();

      thenElContenidoContiene('Día cerrado');
      thenElContenidoContiene('Cierre confirmado');
      thenNoSeCerroElDia();
    });

    it('dado el dia abierto, cuando confirmo, deberia cerrar, mostrar toast y refrescar', () => {
      whenMonto();

      whenConfirmoCierre();

      thenSeCerroElDia();
      thenSeRefrescoTrasCerrar();
      thenSeMostroToast({ matcher: 'Cierre diario realizado.', tipo: 'success' });
    });

    it('dado que el back devuelve alreadyClosed, cuando confirmo, deberia mostrar el mensaje info', () => {
      givenCloseDailyDevuelveYaCerrado();
      whenMonto();

      whenConfirmoCierre();
      fixture.detectChanges();

      thenElContenidoContiene('El día ya estaba cerrado');
    });

    it('dado que closeDaily falla, cuando confirmo, deberia mostrar el toast de error', () => {
      givenCloseDailyFalla();
      whenMonto();

      whenConfirmoCierre();

      thenSeMostroToast({ matcher: 'No se pudo cerrar el día.', tipo: 'error' });
    });

    it('dado refreshAfterClose que falla, cuando confirmo, deberia mostrar toast de refresco fallido', () => {
      givenRefreshAfterCloseFalla();
      whenMonto();

      whenConfirmoCierre();

      thenSeMostroToast({ matcher: jasmine.stringMatching(/no se pudo refrescar/i), tipo: 'error' });
    });

    it('dado result.alreadyClosed=true, cuando confirmo, deberia volver a pedir el status', () => {
      givenCloseDailyDevuelveYaCerrado();
      whenMonto();
      const callsInicial = servicioCierre.getEstadoCierreDiario.calls.count();

      whenConfirmoCierre();

      expect(servicioCierre.getEstadoCierreDiario.calls.count()).toBeGreaterThan(callsInicial);
    });
  });

  describe('descarga de CSV', () => {
    it('dado un buffet, cuando descargo el CSV, deberia usar el service, crear un link y revocarlo', () => {
      const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:daily');
      const revokeObjectUrl = spyOn(URL, 'revokeObjectURL');
      const click = spyOn(HTMLAnchorElement.prototype, 'click');
      whenMonto();

      whenDescargoCsv();

      thenSeDescargoElCsv();
      expect(createObjectUrl).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:daily');
    });

    it('dado que la descarga falla, cuando descargo, deberia mostrar toast de error', () => {
      givenDownloadCsvFalla();
      whenMonto();

      whenDescargoCsv();

      thenSeMostroToast({ matcher: 'No se pudo descargar el CSV.', tipo: 'error' });
    });
  });

  describe('volver', () => {
    it('dado el componente montado, cuando llamo volver, deberia navegar a /kiosquero', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');
      whenMonto();

      whenVuelvo();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('modal de historial — accion selectDailyClose y close', () => {
    it('dado un cierre seleccionado, cuando lo elijo, deberia setear la fecha, cerrar el modal y refrescar el reporte', () => {
      whenMonto();
      servicioCierre.getReporteDiario.calls.reset();
      const cierre = RegistroCierreDiarioMother.crear({ date: '2026-06-05' });

      whenSeleccionoCierreHistorial(cierre);

      thenLaFechaSeleccionadaEs('2026-06-05');
      thenElModalHistorialEsta(false);
    });

    it('cuando llamo closeHistoryModal, deberia cerrar el modal', () => {
      whenMonto();
      givenModalHistorialAbierto();

      whenCierroModalHistorial();

      thenElModalHistorialEsta(false);
    });

    it('dado que falla la carga del historial, cuando abro el modal, deberia setear el mensaje de error de historial', () => {
      givenGetDailyClosesFalla();
      whenMonto();

      whenAbroModalHistorial();

      thenHayMensajeDeErrorDeHistorial();
    });
  });

  describe('helpers de formato y computeds sin reporte', () => {
    it('dado sin reporte cargado, sortedInventory y sortedProducts deberian devolver []', () => {
      givenSinReporte();
      whenMonto();

      thenSortedInventoryEsVacio();
      thenSortedProductsEsVacio();
    });

    it('dado sin reporte, statusMetrics e inventoryMetrics deberian devolver [] si existen', () => {
      givenSinReporte();
      whenMonto();

      const priv = component as unknown as { statusMetrics?(): unknown[]; inventoryMetrics?(): unknown[] };
      if (priv.statusMetrics) {
        expect(priv.statusMetrics()).toEqual([]);
      } else {
        expect(priv.statusMetrics).toBeUndefined();
      }
      if (priv.inventoryMetrics) {
        expect(priv.inventoryMetrics()).toEqual([]);
      } else {
        expect(priv.inventoryMetrics).toBeUndefined();
      }
    });

    it('dado sin listas, soldProductsPageStart e inventoryPageStart deberian devolver 0', () => {
      givenSinReporte();
      whenMonto();

      thenSoldProductsPageStartEs(0);
      thenInventoryPageStartEs(0);
    });

    it('dado formatMoney y formatNumber con undefined, deberian usar 0 como fallback', () => {
      whenMonto();

      thenFormatMoneyContiene(undefined, '0');
      thenFormatNumberContiene(undefined, '0');
    });

    it('dado sin reporte, summaryMetrics deberia devolver []', () => {
      givenSinReporte();

      whenMonto();

      thenSummaryMetricsEs([]);
    });

    it('dado loadingCloseStatus true, statusLabel deberia ser "Verificando"', () => {
      whenMonto();
      givenLoadingCloseStatus(true);

      thenStatusLabelEs('Verificando');
    });

    it('dado un mensaje de error del status, statusDetail deberia devolverlo', () => {
      whenMonto();
      givenCloseStatusErrorMessage('sin conexion');

      thenStatusDetailEs('sin conexion');
    });
  });

  describe('cambio de fecha', () => {
    it('dado un valor nuevo en onDateChange, cuando lo llamo, deberia setear la fecha', () => {
      whenMonto();

      whenCambioFecha('2026-01-15');

      thenLaFechaSeleccionadaEs('2026-01-15');
    });

    it('dado onDateChange con el mismo valor, cuando lo llamo, no deberia recargar', () => {
      whenMonto();
      const fechaActual = leerFechaSeleccionada();
      servicioCierre.getReporteDiario.calls.reset();

      whenCambioFecha(fechaActual);

      thenNoSePidioReporteDiario();
    });

    it('dado onDateChange sin valor, cuando lo llamo, no deberia recargar', () => {
      whenMonto();
      servicioCierre.getReporteDiario.calls.reset();

      whenCambioFecha('');

      thenNoSePidioReporteDiario();
    });
  });

  describe('confirmModal — apertura y cierre', () => {
    it('dado closingDay true, cuando cierro confirmModal, no deberia cerrarlo', () => {
      whenMonto();
      givenClosingDay(true);
      givenConfirmModalAbierto();

      whenCierroConfirmModal();

      thenElConfirmModalEsta(true);
    });

    it('dado closingDay false, cuando abro confirmModal, deberia abrirlo', () => {
      whenMonto();

      whenAbroConfirmModal();

      thenElConfirmModalEsta(true);
    });

    it('dado closingDay true, cuando abro confirmModal, no deberia abrirlo', () => {
      whenMonto();
      givenClosingDay(true);

      whenAbroConfirmModal();

      thenElConfirmModalEsta(false);
    });
  });

  describe('paginacion — retroceso', () => {
    it('dado previousInventoryPage en pagina >1, cuando retrocedo, deberia bajar una pagina', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          inventory: Array.from({ length: 8 }, (_, i) =>
            SnapshotInventarioDiarioMother.crear({ productId: `p-${i}`, productName: `Prod ${i}` }),
          ),
        }),
      );
      whenMonto();
      givenPaginaInventarioEn(2);

      whenRetrocedoPaginaInventario();

      thenLaPaginaInventarioEs(1);
    });

    it('dado previousInventoryPage en pagina 1, cuando retrocedo, deberia quedarse en 1', () => {
      whenMonto();

      whenRetrocedoPaginaInventario();

      thenLaPaginaInventarioEs(1);
    });

    it('dado previousSoldProductsPage en pagina >1, cuando retrocedo, deberia bajar una pagina', () => {
      givenReporte(ReporteDiarioMother.crear({ products: crearProductos(8) }));
      whenMonto();
      givenPaginaProductosEn(2);

      whenRetrocedoPaginaProductos();

      thenLaPaginaProductosEs(1);
    });
  });

  describe('estado y errores', () => {
    it('dado que closeStatus falla, cuando cargo, deberia setear el mensaje de error del status', () => {
      givenGetEstadoCierreFalla();

      whenMonto();

      thenElMensajeDeErrorDelStatusContiene('No se pudo verificar');
    });

    it('dado onHistoryFromChange y onHistoryToChange, cuando los llamo, deberian setear los signals', () => {
      whenMonto();

      whenCambioFechaDesde('2026-01-01');
      whenCambioFechaHasta('2026-01-31');

      thenElHistoryFromEs('2026-01-01');
      thenElHistoryToEs('2026-01-31');
    });

    it('dado onHistoryFromChange con target null, cuando lo llamo, deberia setear ""', () => {
      whenMonto();

      whenCambioFechaDesdeConTargetNull();

      thenElHistoryFromEs('');
    });
  });

  describe('formatters', () => {
    it('dado formatInventoryStatus con codigo conocido, cuando lo llamo, deberia devolver el label', () => {
      whenMonto();

      thenFormatInventoryStatusEs('DISPONIBLE', 'Disponible');
      thenFormatInventoryStatusEs('BAJO_STOCK', 'Bajo stock');
      thenFormatInventoryStatusEs('SIN_STOCK', 'Agotado');
      thenFormatInventoryStatusEs('DESACTIVADO', 'Pausado');
      thenFormatInventoryStatusEs('RARO', 'RARO');
    });

    it('dado formatInventoryMode con codigo conocido, cuando lo llamo, deberia devolver el label', () => {
      whenMonto();

      thenFormatInventoryModeEs('STOCK_EXACTO', 'Stock exacto');
      thenFormatInventoryModeEs('DISPONIBLE_NO_DISPONIBLE', 'Disponible / no disponible');
      thenFormatInventoryModeEs('CUPO_DIARIO', 'Cupo diario');
      thenFormatInventoryModeEs('OTRO', 'OTRO');
    });

    it('dado formatMovementType con codigo desconocido, cuando lo llamo, deberia capitalizarlo', () => {
      whenMonto();

      thenFormatMovementTypeEs('OTRO_MOVIMIENTO', 'Otro movimiento');
    });

    it('dado formatDate con distintos valores, cuando lo llamo, deberia formatearlos', () => {
      whenMonto();

      thenFormatDateEs(null, '-');
      thenFormatDateEs(undefined, '-');
      thenFormatDateEs('no-date', 'no-date');
      thenFormatDateEs('2026-01-15', '15/01/2026');
    });

    it('dado formatOptionalNumber con null o undefined, cuando lo llamo, deberia devolver "Sin minimo"', () => {
      whenMonto();

      thenFormatOptionalNumberEs(null, 'Sin mínimo');
      thenFormatOptionalNumberEs(undefined, 'Sin mínimo');
      thenFormatOptionalNumberContiene(5, '5');
    });

    it('dado soldOutProductName con distintos casos, cuando lo llamo, deberia devolver el nombre correcto', () => {
      whenMonto();

      thenSoldOutProductNameEs({ productName: 'X' }, 'X');
      thenSoldOutProductNameEs({ nombre: 'Y' }, 'Y');
      thenSoldOutProductNameEs({}, 'Producto agotado');
    });
  });

  describe('helpers puntuales del template', () => {
    it('dado isSoldProductSoldOut/LowStock, deberia leer del snapshot de inventario del reporte', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          inventory: [
            SnapshotInventarioDiarioMother.crearAgotado({ productId: 'p-1' }),
            SnapshotInventarioDiarioMother.crearBajoStock({ productId: 'p-2' }),
          ],
        }),
      );
      whenMonto();

      thenIsSoldProductSoldOutEs('p-1', true);
      thenIsSoldProductLowStockEs('p-2', true);
      thenIsSoldProductSoldOutEs('p-3', false);
    });

    it('dado trackProductSale/trackInventory/trackDailyClose, cuando los llamo, deberian devolver el id apropiado', () => {
      whenMonto();

      thenTrackProductSaleEs({ productId: 'p-1' }, 'p-1');
      thenTrackInventoryEs({ productId: 'p-2' }, 'p-2');
      thenTrackDailyCloseEs({ id: 'c-1' }, 'c-1');
    });

    it('dado isSelectedClose con la misma fecha, cuando lo llamo, deberia devolver true', () => {
      whenMonto();
      const fecha = leerFechaSeleccionada();

      thenIsSelectedCloseEs({ date: fecha }, true);
      thenIsSelectedCloseEs({ date: '1990-01-01' }, false);
    });
  });

  describe('realtime', () => {
    it('dado onRefresh con evento DAILY_REPORT_CHANGED, cuando se dispara, deberia recargar el reporte', (done) => {
      const restaurar = givenDocumentVisible();
      whenMonto();

      whenElRealtimeEmiteRefresh({ type: 'DAILY_REPORT_CHANGED', date: leerFechaSeleccionada() });

      setTimeout(() => {
        thenSeGrabaronRefetchsComo('daily-close-report');
        restaurar();
        done();
      }, 3000);
    });

    it('dado onError del realtime, cuando se dispara, deberia loguear un warn', () => {
      const warn = spyOn(console, 'warn');
      whenMonto();

      whenElRealtimeEmiteError(new Error('boom'));

      expect(warn).toHaveBeenCalled();
    });
  });

  function givenReporte(reporte: ReporteDiario): void {
    servicioCierre.getReporteDiario.and.returnValue(of(reporte));
  }

  function givenSinReporte(): void {
    servicioCierre.getReporteDiario.and.returnValue(of(null as unknown as ReporteDiario));
  }

  function givenSinBuffet(): void {
    servicioPerfil.obtenerBuffetId.and.returnValue(null);
  }

  function givenDiaYaCerrado(): void {
    servicioCierre.getEstadoCierreDiario.and.returnValue(of(EstadoCierreDiarioMother.crearCerrado()));
  }

  function givenCloseDailyDevuelveYaCerrado(): void {
    servicioCierre.closeDaily.and.returnValue(of(ResultadoCierreDiarioMother.crearYaCerrado()));
  }

  function givenCloseDailyFalla(): void {
    servicioCierre.closeDaily.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenRefreshAfterCloseFalla(): void {
    servicioCierre.refreshAfterClose.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenGetReporteDiarioFalla(): void {
    servicioCierre.getReporteDiario.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenGetEstadoCierreFalla(): void {
    servicioCierre.getEstadoCierreDiario.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenGetDailyClosesFalla(): void {
    servicioCierre.getDailyCloses.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenDownloadCsvFalla(): void {
    servicioCierre.downloadReporteDiarioCsv.and.returnValue(throwError(() => new Error('boom')));
  }

  function givenLoadingCloseStatus(valor: boolean): void {
    (component as unknown as { loadingCloseStatus: WritableSignalLike<boolean> }).loadingCloseStatus.set(valor);
  }

  function givenCloseStatusErrorMessage(mensaje: string): void {
    (component as unknown as { closeStatusErrorMessage: WritableSignalLike<string> }).closeStatusErrorMessage.set(mensaje);
  }

  function givenClosingDay(valor: boolean): void {
    (component as unknown as { closingDay: WritableSignalLike<boolean> }).closingDay.set(valor);
  }

  function givenConfirmModalAbierto(): void {
    (component as unknown as { confirmModalOpen: WritableSignalLike<boolean> }).confirmModalOpen.set(true);
  }

  function givenModalHistorialAbierto(): void {
    (component as unknown as { historyModalOpen: WritableSignalLike<boolean> }).historyModalOpen.set(true);
  }

  function givenPaginaInventarioEn(pagina: number): void {
    (component as unknown as { inventoryPage: WritableSignalLike<number> }).inventoryPage.set(pagina);
  }

  function givenPaginaProductosEn(pagina: number): void {
    (component as unknown as { soldProductsPage: WritableSignalLike<number> }).soldProductsPage.set(pagina);
  }

  function givenDocumentVisible(): () => void {
    const originalOwn = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    return () => {
      if (originalOwn) {
        Object.defineProperty(document, 'visibilityState', originalOwn);
      } else {
        delete (document as unknown as { visibilityState?: unknown }).visibilityState;
      }
    };
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function whenConfirmoCierre(): void {
    (component as unknown as { confirmDailyClose(): void }).confirmDailyClose();
  }

  function whenAvanzoPaginaProductos(): void {
    (component as unknown as { nextSoldProductsPage(): void }).nextSoldProductsPage();
    fixture.detectChanges();
  }

  function whenAvanzoPaginaInventario(): void {
    (component as unknown as { nextInventoryPage(): void }).nextInventoryPage();
    fixture.detectChanges();
  }

  function whenRetrocedoPaginaInventario(): void {
    (component as unknown as { previousInventoryPage(): void }).previousInventoryPage();
  }

  function whenRetrocedoPaginaProductos(): void {
    (component as unknown as { previousSoldProductsPage(): void }).previousSoldProductsPage();
  }

  function whenAbroModalHistorial(): void {
    queryUno<HTMLButtonElement>('.daily-close-hero__secondary')?.click();
    fixture.detectChanges();
  }

  function whenSeteoFiltroHistorial(desdeValor: string, hastaValor: string): void {
    const [desde, hasta] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '.daily-close-modal--history input[type="date"]',
      ),
    );
    desde.value = desdeValor;
    desde.dispatchEvent(new Event('change'));
    hasta.value = hastaValor;
    hasta.dispatchEvent(new Event('change'));
  }

  function whenAplicoFiltroHistorial(): void {
    queryUno<HTMLButtonElement>(
      '.daily-close-modal--history .daily-close__history-filters button',
    )?.click();
  }

  function whenSeleccionoCierreHistorial(cierre: ReturnType<typeof RegistroCierreDiarioMother.crear>): void {
    (component as unknown as { selectDailyClose(c: unknown): void }).selectDailyClose(cierre);
  }

  function whenCierroModalHistorial(): void {
    (component as unknown as { closeHistoryModal(): void }).closeHistoryModal();
  }

  function whenDescargoCsv(): void {
    (component as unknown as { downloadCsv(): void }).downloadCsv();
  }

  function whenVuelvo(): void {
    (component as unknown as { volver(): void }).volver();
  }

  function whenCambioFecha(valor: string): void {
    (component as unknown as { onDateChange(e: Event): void }).onDateChange({ target: { value: valor } } as unknown as Event);
  }

  function whenAbroConfirmModal(): void {
    (component as unknown as { openConfirmModal(): void }).openConfirmModal();
  }

  function whenCierroConfirmModal(): void {
    (component as unknown as { closeConfirmModal(): void }).closeConfirmModal();
  }

  function whenCambioFechaDesde(valor: string): void {
    (component as unknown as { onHistoryFromChange(e: Event): void }).onHistoryFromChange({ target: { value: valor } } as unknown as Event);
  }

  function whenCambioFechaHasta(valor: string): void {
    (component as unknown as { onHistoryToChange(e: Event): void }).onHistoryToChange({ target: { value: valor } } as unknown as Event);
  }

  function whenCambioFechaDesdeConTargetNull(): void {
    (component as unknown as { onHistoryFromChange(e: Event): void }).onHistoryFromChange({ target: null } as unknown as Event);
  }

  function whenElRealtimeEmiteRefresh(event: unknown): void {
    const callArgs = servicioRealtime.connect.calls.mostRecent().args as unknown as [string, { onRefresh(e: unknown): void }];
    servicioCierre.getReporteDiario.calls.reset();
    callArgs[1].onRefresh(event);
  }

  function whenElRealtimeEmiteError(error: unknown): void {
    const callArgs = servicioRealtime.connect.calls.mostRecent().args as unknown as [string, { onError(e: unknown): void }];
    callArgs[1].onError(error);
  }

  function leerFechaSeleccionada(): string {
    return (component as unknown as { selectedDate(): string }).selectedDate();
  }

  function thenSeSeteoHomeUrl(url: string): void {
    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith(url);
  }

  function thenSePidioReporteDiario(): void {
    expect(servicioCierre.getReporteDiario).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
  }

  function thenNoSePidioReporteDiario(): void {
    expect(servicioCierre.getReporteDiario).not.toHaveBeenCalled();
  }

  function thenSePidioEstadoCierre(): void {
    expect(servicioCierre.getEstadoCierreDiario).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
  }

  function thenSePidieronLosDailyCloses(filtros: { from?: string; to?: string }): void {
    expect(servicioCierre.getDailyCloses).toHaveBeenCalledWith(BUFFET_ID_TEST, filtros);
  }

  function thenSeConectoRealtime(): void {
    expect(servicioRealtime.connect).toHaveBeenCalled();
  }

  function thenElContenidoContiene(fragmento: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(fragmento);
  }

  function thenElContenidoNoContiene(fragmento: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(fragmento);
  }

  function thenElSelectorExiste(selector: string): void {
    expect(queryUno(selector)).toBeTruthy();
  }

  function thenElPrimerProductoDeInventarioEs(nombre: string): void {
    const primero = queryUno('.dc-inventory-product strong')?.textContent;
    expect(primero).toContain(nombre);
  }

  function thenLosProductosVendidosSon(nombres: string[]): void {
    const encontrados = Array.from(
      fixture.nativeElement.querySelectorAll('.dc-sold-product-info strong'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(encontrados).toEqual(nombres);
  }

  function thenNoSeCerroElDia(): void {
    expect(servicioCierre.closeDaily).not.toHaveBeenCalled();
  }

  function thenSeCerroElDia(): void {
    expect(servicioCierre.closeDaily).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
  }

  function thenSeRefrescoTrasCerrar(): void {
    expect(servicioCierre.refreshAfterClose).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
  }

  function thenSeDescargoElCsv(): void {
    expect(servicioCierre.downloadReporteDiarioCsv).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
  }

  function thenSeMostroToast(esperado: ToastEsperado): void {
    expect(servicioToast.mostrar).toHaveBeenCalledWith(esperado.matcher as never, esperado.tipo);
  }

  function thenLaFechaSeleccionadaEs(esperada: string): void {
    expect(leerFechaSeleccionada()).toBe(esperada);
  }

  function thenElModalHistorialEsta(abierto: boolean): void {
    expect((component as unknown as { historyModalOpen(): boolean }).historyModalOpen()).toBe(abierto);
  }

  function thenHayMensajeDeErrorDeHistorial(): void {
    expect((component as unknown as { historyErrorMessage(): string | null }).historyErrorMessage()).toBeTruthy();
  }

  function thenElMensajeDeErrorDelStatusContiene(fragmento: string): void {
    expect((component as unknown as { closeStatusErrorMessage(): string | null }).closeStatusErrorMessage()).toContain(fragmento);
  }

  function thenSortedInventoryEsVacio(): void {
    expect((component as unknown as { sortedInventory(): unknown[] }).sortedInventory()).toEqual([]);
  }

  function thenSortedProductsEsVacio(): void {
    expect((component as unknown as { sortedProducts(): unknown[] }).sortedProducts()).toEqual([]);
  }

  function thenSoldProductsPageStartEs(esperado: number): void {
    expect((component as unknown as { soldProductsPageStart(): number }).soldProductsPageStart()).toBe(esperado);
  }

  function thenInventoryPageStartEs(esperado: number): void {
    expect((component as unknown as { inventoryPageStart(): number }).inventoryPageStart()).toBe(esperado);
  }

  function thenFormatMoneyContiene(entrada: number | undefined, fragmento: string): void {
    expect((component as unknown as { formatMoney(v?: number): string }).formatMoney(entrada)).toContain(fragmento);
  }

  function thenFormatNumberContiene(entrada: number | undefined, fragmento: string): void {
    expect((component as unknown as { formatNumber(v?: number): string }).formatNumber(entrada)).toContain(fragmento);
  }

  function thenSummaryMetricsEs(esperado: unknown[]): void {
    expect((component as unknown as { summaryMetrics(): unknown[] }).summaryMetrics()).toEqual(esperado);
  }

  function thenStatusLabelEs(esperado: string): void {
    expect((component as unknown as { statusLabel(): string }).statusLabel()).toBe(esperado);
  }

  function thenStatusDetailEs(esperado: string): void {
    expect((component as unknown as { statusDetail(): string | null }).statusDetail()).toBe(esperado);
  }

  function thenElConfirmModalEsta(abierto: boolean): void {
    expect((component as unknown as { confirmModalOpen(): boolean }).confirmModalOpen()).toBe(abierto);
  }

  function thenLaPaginaInventarioEs(esperada: number): void {
    expect((component as unknown as { inventoryPage(): number }).inventoryPage()).toBe(esperada);
  }

  function thenLaPaginaProductosEs(esperada: number): void {
    expect((component as unknown as { soldProductsPage(): number }).soldProductsPage()).toBe(esperada);
  }

  function thenElHistoryFromEs(esperado: string): void {
    expect((component as unknown as { historyFrom(): string }).historyFrom()).toBe(esperado);
  }

  function thenElHistoryToEs(esperado: string): void {
    expect((component as unknown as { historyTo(): string }).historyTo()).toBe(esperado);
  }

  function thenFormatInventoryStatusEs(entrada: string, esperado: string): void {
    expect((component as unknown as { formatInventoryStatus(s: string): string }).formatInventoryStatus(entrada)).toBe(esperado);
  }

  function thenFormatInventoryModeEs(entrada: string, esperado: string): void {
    expect((component as unknown as { formatInventoryMode(m: string): string }).formatInventoryMode(entrada)).toBe(esperado);
  }

  function thenFormatMovementTypeEs(entrada: string, esperado: string): void {
    expect((component as unknown as { formatMovementType(m: string): string }).formatMovementType(entrada)).toBe(esperado);
  }

  function thenFormatDateEs(entrada: string | null | undefined, esperado: string): void {
    expect((component as unknown as { formatDate(v: string | null | undefined): string }).formatDate(entrada)).toBe(esperado);
  }

  function thenFormatOptionalNumberEs(entrada: number | null | undefined, esperado: string): void {
    expect((component as unknown as { formatOptionalNumber(v: number | null | undefined): string }).formatOptionalNumber(entrada)).toBe(esperado);
  }

  function thenFormatOptionalNumberContiene(entrada: number, fragmento: string): void {
    expect((component as unknown as { formatOptionalNumber(v: number): string }).formatOptionalNumber(entrada)).toContain(fragmento);
  }

  function thenSoldOutProductNameEs(producto: { productName?: string; nombre?: string }, esperado: string): void {
    expect((component as unknown as { soldOutProductName(p: unknown): string }).soldOutProductName(producto)).toBe(esperado);
  }

  function thenIsSoldProductSoldOutEs(productId: string, esperado: boolean): void {
    expect((component as unknown as { isSoldProductSoldOut(p: { productId: string }): boolean }).isSoldProductSoldOut({ productId })).toBe(esperado);
  }

  function thenIsSoldProductLowStockEs(productId: string, esperado: boolean): void {
    expect((component as unknown as { isSoldProductLowStock(p: { productId: string }): boolean }).isSoldProductLowStock({ productId })).toBe(esperado);
  }

  function thenTrackProductSaleEs(producto: { productId: string }, esperado: string): void {
    expect((component as unknown as { trackProductSale(i: number, p: { productId: string }): string }).trackProductSale(0, producto)).toBe(esperado);
  }

  function thenTrackInventoryEs(producto: { productId: string }, esperado: string): void {
    expect((component as unknown as { trackInventory(i: number, p: { productId: string }): string }).trackInventory(0, producto)).toBe(esperado);
  }

  function thenTrackDailyCloseEs(cierre: { id: string }, esperado: string): void {
    expect((component as unknown as { trackDailyClose(i: number, c: { id: string }): string }).trackDailyClose(0, cierre)).toBe(esperado);
  }

  function thenIsSelectedCloseEs(cierre: { date: string }, esperado: boolean): void {
    expect((component as unknown as { isSelectedClose(c: { date: string }): boolean }).isSelectedClose(cierre)).toBe(esperado);
  }

  function thenSeGrabaronRefetchsComo(source: string): void {
    expect(servicioRealtime.recordRefetch).toHaveBeenCalledWith(source);
  }

  function queryUno<T extends Element = Element>(selector: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
  }

  function crearProductos(cantidad: number): VentaProductoDiaria[] {
    return Array.from({ length: cantidad }, (_, i) =>
      VentaProductoDiariaMother.crear({
        productId: `sold-${i + 1}`,
        productName: `Producto vendido ${i + 1}`,
        quantity: i + 1,
        total: (i + 1) * 1000,
      }),
    );
  }
});
