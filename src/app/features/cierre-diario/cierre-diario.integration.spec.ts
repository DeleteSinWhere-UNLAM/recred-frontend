import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
} from './cierre-diario.mother';
import { CierreDiarioService } from './services/cierre-diario.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {}

describe('CierreDiario Integration', () => {
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
  });

  it('dado que se monta la page con un buffet y un reporte, deberia renderizar el titulo, la fecha formateada y el nombre del producto', async () => {
    await whenMonto();

    expect(queryTexto('#daily-close-title')).toBe('Cierre diario');
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Alfajor');
  });

  it('dado el usuario que cambia la fecha del input, deberia pedir de nuevo reporte y estado con la nueva fecha', async () => {
    await whenMonto();
    servicioCierre.getReporteDiario.calls.reset();
    servicioCierre.getEstadoCierreDiario.calls.reset();

    whenElInputDeFechaCambiaA('2026-05-01');

    expect(servicioCierre.getReporteDiario).toHaveBeenCalledWith(BUFFET_ID_TEST, '2026-05-01');
    expect(servicioCierre.getEstadoCierreDiario).toHaveBeenCalledWith(BUFFET_ID_TEST, '2026-05-01');
  });

  it('dado el dia abierto, cuando el usuario clickea el CTA de cierre y confirma, deberia llamar a closeDaily y mostrar toast success', async () => {
    await whenMonto();

    whenClickeoElCtaCierre();
    whenClickeoConfirmar();

    expect(servicioCierre.closeDaily).toHaveBeenCalled();
    expect(servicioToast.mostrar).toHaveBeenCalledWith('Cierre diario realizado.', 'success');
  });

  it('dado el dia ya cerrado, cuando el usuario mira la seccion de estado, deberia decir "Dia cerrado"', async () => {
    servicioCierre.getEstadoCierreDiario.and.returnValue(
      of(EstadoCierreDiarioMother.crearCerrado()),
    );

    await whenMonto();

    expect(queryTexto('.daily-close-hero__status strong')).toBe('Día cerrado');
  });

  it('dado que se abre el modal de historial y se aplican filtros, deberia pedir con from/to al service', async () => {
    await whenMonto();

    (queryUno('.daily-close-hero__secondary') as HTMLButtonElement).click();
    fixture.detectChanges();

    const [desde, hasta] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '.daily-close-modal--history input[type="date"]',
      ),
    );
    desde.value = '2026-06-01';
    desde.dispatchEvent(new Event('change'));
    hasta.value = '2026-06-30';
    hasta.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    (queryUno(
      '.daily-close-modal--history .daily-close__history-filters button',
    ) as HTMLButtonElement).click();

    expect(servicioCierre.getDailyCloses).toHaveBeenCalledWith(BUFFET_ID_TEST, {
      from: '2026-06-01',
      to: '2026-06-30',
    });
  });

  it('dado que falla la carga del reporte, deberia mostrar el mensaje de error en el render', async () => {
    servicioCierre.getReporteDiario.and.returnValue(throwError(() => new Error('boom')));

    await whenMonto();

    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el reporte diario.');
  });

  async function whenMonto(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenElInputDeFechaCambiaA(fecha: string): void {
    const input = queryUno('.daily-close-hero__date input[type="date"]') as HTMLInputElement;
    input.value = fecha;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function whenClickeoElCtaCierre(): void {
    const cta = (fixture.nativeElement as HTMLElement).querySelector(
      '.daily-close-hero__primary',
    ) as HTMLButtonElement | null;
    cta?.click();
    fixture.detectChanges();
  }

  function whenClickeoConfirmar(): void {
    const confirmar = (fixture.nativeElement as HTMLElement).querySelector(
      '.daily-close-modal__button--primary',
    ) as HTMLButtonElement | null;
    confirmar?.click();
    fixture.detectChanges();
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }

  function queryTexto(selector: string): string {
    return queryUno(selector)?.textContent?.trim() ?? '';
  }
});
