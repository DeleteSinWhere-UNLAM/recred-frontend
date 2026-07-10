import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ToastService } from '../../shared/services/toast.service';
import { BilleteraService } from '../billetera/services/billetera.service';
import {
  BilleteraResumenMother,
  MovimientoBilleteraMother,
} from './acreditar-mercado-pago.mother';
import { AcreditarMercadoPagoPage } from './acreditar-mercado-pago.page';
import { AcreditarMercadoPagoService } from './services/acreditar-mercado-pago.service';

interface DocumentoFake {
  location: { href: string };
}

describe('AcreditarMercadoPago Integration', () => {
  let fixture: ComponentFixture<AcreditarMercadoPagoPage>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioMercadoPago: jasmine.SpyObj<AcreditarMercadoPagoService>;
  let servicioBilletera: jasmine.SpyObj<BilleteraService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;
  let documentoFake: DocumentoFake;

  beforeEach(async () => {
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioAlumnos.getAlumnoById.and.returnValue(
      AlumnoMother.crear({
        id: 'alumno-1',
        nombre: 'Juan',
        apellido: 'Perez',
        saldo: 2000,
      }),
    );

    servicioMercadoPago = jasmine.createSpyObj('AcreditarMercadoPagoService', [
      'generarLinkPago',
    ]);

    servicioBilletera = jasmine.createSpyObj('BilleteraService', ['getResumen']);
    servicioBilletera.getResumen.and.returnValue(
      of(
        BilleteraResumenMother.crearConMovimientos([
          MovimientoBilleteraMother.crearEntrada({ id: 'r-1', monto: 1500 }),
        ]),
      ),
    );

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    documentoFake = { location: { href: '' } };

    await TestBed.configureTestingModule({
      imports: [AcreditarMercadoPagoPage],
      providers: [
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: AcreditarMercadoPagoService, useValue: servicioMercadoPago },
        { provide: BilleteraService, useValue: servicioBilletera },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: signal('alumno-1').asReadonly() },
        },
      ],
    })
      .overrideComponent(AcreditarMercadoPagoPage, {
        add: {
          providers: [{ provide: DOCUMENT, useValue: documentoFake }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AcreditarMercadoPagoPage);
  });

  it('dado que se monta la page con un alumno del contexto, deberia pedir el resumen y renderizar el titulo con el nombre', async () => {
    await whenMonto();

    const titulo = queryTexto('.acreditar-page__titulo');
    expect(titulo).toContain('Juan');
    expect(servicioBilletera.getResumen).toHaveBeenCalledWith('alumno-1');
  });

  it('dado el resumen con una entrada, deberia mostrar la recarga en el historial', async () => {
    await whenMonto();

    const items = fixture.nativeElement.querySelectorAll(
      '.acreditar-page__history-item',
    );
    expect(items.length).toBe(1);
  });

  it('dado un monto en el input, cuando hago submit, deberia pedir el link al service y redirigir al href', async () => {
    servicioMercadoPago.generarLinkPago.and.resolveTo('https://mp.com/checkout/xyz');
    await whenMonto();

    whenElInputCambiaA('2000');
    await whenHagoSubmit();

    expect(servicioMercadoPago.generarLinkPago).toHaveBeenCalledWith('alumno-1', 2000);
    expect(documentoFake.location.href).toBe('https://mp.com/checkout/xyz');
  });

  it('dado que Mercado Pago falla, cuando hago submit, deberia mostrar el toast de error y no redirigir', async () => {
    spyOn(console, 'error');
    servicioMercadoPago.generarLinkPago.and.rejectWith(new Error('MP boom'));
    await whenMonto();

    whenElInputCambiaA('2000');
    await whenHagoSubmit();

    expect(servicioToast.mostrar).toHaveBeenCalledWith(
      'Hubo un problema al contactar con Mercado Pago. Probá de nuevo más tarde.',
      'error',
    );
    expect(documentoFake.location.href).toBe('');
  });

  it('dado que el alumno del contexto no existe, deberia redirigir a /tutor', async () => {
    servicioAlumnos.getAlumnoById.and.returnValue(undefined);

    await whenMonto();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
  });

  it('dado que la billetera falla, deberia mostrar el toast de error', async () => {
    spyOn(console, 'error');
    servicioBilletera.getResumen.and.returnValue(
      throwError(() => new Error('billetera boom')),
    );

    await whenMonto();

    expect(servicioToast.mostrar).toHaveBeenCalledWith(
      'No pudimos cargar la información del alumno.',
      'error',
    );
  });

  async function whenMonto(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenElInputCambiaA(valor: string): void {
    const input = fixture.nativeElement.querySelector(
      'input#monto',
    ) as HTMLInputElement;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  async function whenHagoSubmit(): Promise<void> {
    const form = fixture.nativeElement.querySelector(
      'form.acreditar-page__form',
    ) as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function queryTexto(selector: string): string {
    const el = (fixture.nativeElement as HTMLElement).querySelector(selector);
    return el?.textContent?.trim() ?? '';
  }
});
