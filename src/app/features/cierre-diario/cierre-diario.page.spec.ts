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
import { ReporteDiario } from './models/cierre-diario.model';
import { CierreDiarioService } from './services/cierre-diario.service';

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
    it('dado un buffet en el perfil, cuando inicializo, deberia setear /kiosquero como home y pedir reporte + estado + historial', () => {
      whenMonto();

      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
      expect(servicioCierre.getReporteDiario).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
      expect(servicioCierre.getEstadoCierreDiario).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
      expect(servicioCierre.getDailyCloses).toHaveBeenCalledWith(BUFFET_ID_TEST, { from: undefined, to: undefined });
      expect(servicioRealtime.connect).toHaveBeenCalled();
    });

    it('dado que el perfil no tiene buffet, cuando inicializo, deberia mostrar el error y no pegarle al service', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);

      whenMonto();

      expect(fixture.nativeElement.textContent).toContain('No se encontró un buffet asociado a tu perfil.');
      expect(servicioCierre.getReporteDiario).not.toHaveBeenCalled();
    });
  });

  describe('render del reporte', () => {
    it('dado un reporte cargado, deberia mostrar el titulo y la fecha en formato dd/MM/yyyy', () => {
      whenMonto();

      const texto = fixture.nativeElement.textContent as string;
      expect(texto).toContain('Cierre diario');
      expect(texto).toContain('Alfajor');
      expect(texto).not.toContain('2026-06-09');
      expect(texto).toContain('Mínimo 5');
      expect(texto).toContain('Sin mínimo');
    });

    it('dado inventario con estados criticos, deberia marcarlos con clases operativas', () => {
      whenMonto();

      expect(queryUno('.dc-inventory-row--low-stock')).toBeTruthy();
      expect(queryUno('.dc-inventory-row--sold-out')).toBeTruthy();
      expect(queryUno('.dc-inventory-status--low-stock')).toBeTruthy();
      expect(queryUno('.dc-inventory-status--sold-out')).toBeTruthy();
    });

    it('dado inventario mezclado, deberia ordenar SIN_STOCK y BAJO_STOCK primero', () => {
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

      const primero = queryUno('.dc-inventory-product strong')?.textContent;
      expect(primero).toContain('Jugo');
    });

    it('dado productos vendidos, deberia ordenarlos de mayor a menor por importe', () => {
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

      const nombres = Array.from(
        fixture.nativeElement.querySelectorAll('.dc-sold-product-info strong'),
      ).map((el) => (el as HTMLElement).textContent?.trim());
      expect(nombres).toEqual(['Barrita', 'Agua', 'Jugo']);
    });

    it('dado ventas por medio de pago, no deberia renderizarlas (no es parte del reporte visible)', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          salesByPaymentMethod: [VentasDiariasPorMedioPagoMother.crear()],
        }),
      );

      whenMonto();

      expect(fixture.nativeElement.textContent).not.toContain('Ventas por medio de pago');
      expect(fixture.nativeElement.textContent).not.toContain('efectivo');
    });

    it('dado movimientos de stock, deberia mostrar los labels capitalizados en espanol', () => {
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

      const texto = fixture.nativeElement.textContent as string;
      expect(texto).toContain('Ajuste');
      expect(texto).toContain('Liberación');
      expect(texto).toContain('Reserva');
      expect(texto).toContain('Venta');
      expect(texto).not.toContain('liberacion');
    });

    it('dado que falla el reporte, deberia mostrar el mensaje de error', () => {
      servicioCierre.getReporteDiario.and.returnValue(throwError(() => new Error('boom')));

      whenMonto();

      expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el reporte diario.');
    });
  });

  describe('paginacion', () => {
    it('dado 6 productos vendidos, deberia mostrar los primeros 5 y cambiar de pagina con nextSoldProductsPage', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          products: crearProductos(6),
        }),
      );

      whenMonto();

      expect(fixture.nativeElement.textContent).toContain('1-5 de 6 productos');
      expect(fixture.nativeElement.textContent).toContain('Producto vendido 6');
      expect(fixture.nativeElement.textContent).not.toContain('Producto vendido 1');

      (component as unknown as { nextSoldProductsPage(): void }).nextSoldProductsPage();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('6-6 de 6 productos');
      expect(fixture.nativeElement.textContent).toContain('Producto vendido 1');
    });

    it('dado 6 items de inventario, deberia paginar de a 5 y cambiar con nextInventoryPage', () => {
      givenReporte(
        ReporteDiarioMother.crear({
          inventory: Array.from({ length: 6 }, (_, i) =>
            SnapshotInventarioDiarioMother.crear({
              productId: `p-${i + 1}`,
              productName: `Producto ${i + 1}`,
            }),
          ),
        }),
      );

      whenMonto();

      expect(fixture.nativeElement.textContent).toContain('1-5 de 6');
      expect(fixture.nativeElement.textContent).toContain('Producto 1');
      expect(fixture.nativeElement.textContent).not.toContain('Producto 6');

      (component as unknown as { nextInventoryPage(): void }).nextInventoryPage();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('6-6 de 6');
      expect(fixture.nativeElement.textContent).toContain('Producto 6');
    });
  });

  describe('modal de historial', () => {
    it('dado el historial, cuando abro el modal y filtro por fecha, deberia llamar a getDailyCloses con los filtros', () => {
      whenMonto();
      const callsInicial = servicioCierre.getDailyCloses.calls.count();

      queryUno<HTMLButtonElement>('.daily-close-hero__secondary')?.click();
      fixture.detectChanges();

      expect(servicioCierre.getDailyCloses.calls.count()).toBe(callsInicial + 1);
      expect(queryUno('.daily-close-modal--history')).toBeTruthy();

      const [desde, hasta] = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
          '.daily-close-modal--history input[type="date"]',
        ),
      );
      desde.value = '2026-06-01';
      desde.dispatchEvent(new Event('change'));
      hasta.value = '2026-06-12';
      hasta.dispatchEvent(new Event('change'));

      queryUno<HTMLButtonElement>(
        '.daily-close-modal--history .daily-close__history-filters button',
      )?.click();

      expect(servicioCierre.getDailyCloses).toHaveBeenCalledWith(BUFFET_ID_TEST, {
        from: '2026-06-01',
        to: '2026-06-12',
      });
    });
  });

  describe('cerrar el dia', () => {
    it('dado el dia ya cerrado, cuando intento confirmar, no deberia llamar a closeDaily', () => {
      servicioCierre.getEstadoCierreDiario.and.returnValue(
        of(EstadoCierreDiarioMother.crearCerrado()),
      );
      whenMonto();

      whenConfirmoCierre();

      expect(fixture.nativeElement.textContent).toContain('Día cerrado');
      expect(fixture.nativeElement.textContent).toContain('Cierre confirmado');
      expect(servicioCierre.closeDaily).not.toHaveBeenCalled();
    });

    it('dado el dia abierto, cuando confirmo, deberia cerrar, mostrar toast y refrescar', () => {
      whenMonto();

      whenConfirmoCierre();

      expect(servicioCierre.closeDaily).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
      expect(servicioCierre.refreshAfterClose).toHaveBeenCalledWith(BUFFET_ID_TEST, jasmine.any(String));
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Cierre diario realizado.', 'success');
    });

    it('dado que el back devuelve alreadyClosed, cuando confirmo, deberia mostrar el mensaje info', () => {
      servicioCierre.closeDaily.and.returnValue(of(ResultadoCierreDiarioMother.crearYaCerrado()));
      whenMonto();

      whenConfirmoCierre();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('El día ya estaba cerrado');
    });

    it('dado que closeDaily falla, cuando confirmo, deberia mostrar el toast de error', () => {
      servicioCierre.closeDaily.and.returnValue(throwError(() => new Error('boom')));
      whenMonto();

      whenConfirmoCierre();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('No se pudo cerrar el día.', 'error');
    });
  });

  describe('descarga de CSV', () => {
    it('dado un buffet, cuando descargo el CSV, deberia usar el service autenticado y crear un link a: href', () => {
      const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:daily');
      const revokeObjectUrl = spyOn(URL, 'revokeObjectURL');
      const click = spyOn(HTMLAnchorElement.prototype, 'click');

      whenMonto();
      (component as unknown as { downloadCsv(): void }).downloadCsv();

      expect(servicioCierre.downloadReporteDiarioCsv).toHaveBeenCalledWith(
        BUFFET_ID_TEST,
        jasmine.any(String),
      );
      expect(createObjectUrl).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:daily');
    });

    it('dado que la descarga falla, deberia mostrar el toast de error', () => {
      servicioCierre.downloadReporteDiarioCsv.and.returnValue(
        throwError(() => new Error('boom')),
      );
      whenMonto();

      (component as unknown as { downloadCsv(): void }).downloadCsv();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('No se pudo descargar el CSV.', 'error');
    });
  });

  describe('volver', () => {
    it('dado el componente montado, cuando llamo volver, deberia navegar a /kiosquero', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');
      whenMonto();

      (component as unknown as { volver(): void }).volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function whenConfirmoCierre(): void {
    (component as unknown as { confirmDailyClose(): void }).confirmDailyClose();
  }

  function givenReporte(reporte: ReporteDiario): void {
    servicioCierre.getReporteDiario.and.returnValue(of(reporte));
  }

  function queryUno<T extends Element = Element>(selector: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
  }

  function crearProductos(cantidad: number) {
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
