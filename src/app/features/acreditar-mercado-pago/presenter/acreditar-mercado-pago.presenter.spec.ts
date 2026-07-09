import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BilleteraService } from '../../billetera/services/billetera.service';
import { BilleteraResumen } from '../../billetera/models/billetera.model';
import {
  BilleteraResumenMother,
  MovimientoBilleteraMother,
} from '../acreditar-mercado-pago.mother';
import { AcreditarMercadoPagoService } from '../services/acreditar-mercado-pago.service';
import { AcreditarMercadoPagoPresenter } from './acreditar-mercado-pago.presenter';

interface DocumentoFake {
  location: { href: string };
}

describe('AcreditarMercadoPagoPresenter', () => {
  let presenter: AcreditarMercadoPagoPresenter;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioMercadoPago: jasmine.SpyObj<AcreditarMercadoPagoService>;
  let servicioBilletera: jasmine.SpyObj<BilleteraService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;
  let documentoFake: DocumentoFake;

  beforeEach(() => {
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioAlumnos.getAlumnoById.and.returnValue(undefined);

    servicioMercadoPago = jasmine.createSpyObj('AcreditarMercadoPagoService', [
      'generarLinkPago',
    ]);

    servicioBilletera = jasmine.createSpyObj('BilleteraService', ['getResumen']);
    servicioBilletera.getResumen.and.returnValue(of(BilleteraResumenMother.crearVacio()));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    documentoFake = { location: { href: '' } };

    TestBed.configureTestingModule({
      providers: [
        AcreditarMercadoPagoPresenter,
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: AcreditarMercadoPagoService, useValue: servicioMercadoPago },
        { provide: BilleteraService, useValue: servicioBilletera },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
        { provide: DOCUMENT, useValue: documentoFake },
      ],
    });

    presenter = TestBed.inject(AcreditarMercadoPagoPresenter);
  });

  describe('Estado inicial', () => {
    it('dado el presenter recien creado, deberia arrancar sin alumno, sin cargar y sin recargas', () => {
      expect(presenter.alumno()).toBeUndefined();
      expect(presenter.cargando()).toBeFalse();
      expect(presenter.historialRecargas()).toEqual([]);
    });

    it('dado que no hay alumno cargado, los computed derivados deberian ser vacios', () => {
      expect(presenter.nombreCompleto()).toBe('');
      expect(presenter.grado()).toBe('');
      expect(presenter.iniciales()).toBe('');
      expect(presenter.urlFotoPerfil()).toBeNull();
    });
  });

  describe('init', () => {
    it('dado un alumno existente, cuando inicio, deberia setearlo y armar los computed a partir de sus datos', async () => {
      givenAlumnoEncontrado(
        AlumnoMother.crear({
          id: 'alumno-1',
          nombre: 'Juan',
          apellido: 'Perez',
          grado: '3A',
          urlFotoPerfil: 'https://foto.com/juan.png',
        }),
      );

      await presenter.init('alumno-1');

      expect(servicioAlumnos.asegurarCargados).toHaveBeenCalled();
      expect(presenter.alumno()?.id).toBe('alumno-1');
      expect(presenter.nombreCompleto()).toBe('Juan Perez');
      expect(presenter.grado()).toBe('3A');
      expect(presenter.iniciales()).toBe('JP');
      expect(presenter.urlFotoPerfil()).toBe('https://foto.com/juan.png');
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado un alumno sin nombre ni apellido, cuando inicio, las iniciales deberian ser vacias', async () => {
      givenAlumnoEncontrado(
        AlumnoMother.crear({ nombre: '', apellido: '', grado: '' }),
      );

      await presenter.init('alumno-sin-datos');

      expect(presenter.iniciales()).toBe('');
      expect(presenter.grado()).toBe('');
    });

    it('dado que el alumno no existe, cuando inicio, deberia redirigir a /tutor sin setear el alumno', async () => {
      givenAlumnoNoEncontrado();

      await presenter.init('alumno-inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(presenter.alumno()).toBeUndefined();
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado un resumen con movimientos, cuando inicio, deberia mapear solo las entradas al historial de recargas', async () => {
      givenAlumnoEncontrado(AlumnoMother.crearHijoDelTutor());
      givenResumenBilletera(
        BilleteraResumenMother.crearConMovimientos([
          MovimientoBilleteraMother.crearEntrada({
            id: 'mov-1',
            monto: 1500,
            fechaHora: '2026-06-29T10:00:00',
          }),
          MovimientoBilleteraMother.crearSalida({ id: 'mov-2', monto: 500 }),
          MovimientoBilleteraMother.crearEntrada({
            id: 'mov-3',
            monto: 2500,
            fechaHora: '2026-06-30T12:30:00',
          }),
        ]),
      );

      await presenter.init('alumno-1');

      const recargas = presenter.historialRecargas();
      expect(recargas.length).toBe(2);
      expect(recargas.map((r) => r.id)).toEqual(['mov-1', 'mov-3']);
      expect(recargas[0].estado).toBe('APROBADO');
      expect(recargas[0].montoFormateado).toContain('1');
      expect(recargas[0].montoFormateado).toContain('500');
    });

    it('dado que asegurarCargados falla, cuando inicio, deberia mostrar toast de error y dejar de cargar', async () => {
      servicioAlumnos.asegurarCargados.and.rejectWith(new Error('red caida'));

      await presenter.init('alumno-1');

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No pudimos cargar la información del alumno.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado que la billetera falla, cuando inicio, deberia mostrar toast de error igual', async () => {
      givenAlumnoEncontrado(AlumnoMother.crearHijoDelTutor());
      servicioBilletera.getResumen.and.returnValue(
        throwError(() => new Error('billetera boom')),
      );

      await presenter.init('alumno-1');

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No pudimos cargar la información del alumno.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('acreditar', () => {
    it('dado que el presenter esta cargando, cuando acredito, no deberia llamar al service', async () => {
      givenAlumnoEncontrado(AlumnoMother.crearHijoDelTutor());
      await presenter.init('alumno-1');
      whenSeEstaCargando();

      await presenter.acreditar(500);

      expect(servicioMercadoPago.generarLinkPago).not.toHaveBeenCalled();
    });

    it('dado que no hay alumno seteado, cuando acredito, no deberia llamar al service', async () => {
      await presenter.acreditar(500);

      expect(servicioMercadoPago.generarLinkPago).not.toHaveBeenCalled();
    });

    it('dado un monto no positivo o invalido, cuando acredito, deberia mostrar toast y no llamar al service', async () => {
      givenAlumnoEncontrado(AlumnoMother.crear({ id: 'alumno-1' }));
      await presenter.init('alumno-1');

      await presenter.acreditar(0);
      await presenter.acreditar(-50);
      await presenter.acreditar(Number.NaN);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'El monto debe ser mayor a 0.',
        'error',
      );
      expect(servicioMercadoPago.generarLinkPago).not.toHaveBeenCalled();
    });

    it('dado un monto valido, cuando acredito, deberia redirigir a la URL del link de pago', async () => {
      givenAlumnoEncontrado(AlumnoMother.crear({ id: 'alumno-1' }));
      await presenter.init('alumno-1');
      givenLinkPagoGenerado('https://mercadopago.com/pagar');

      await presenter.acreditar(500);

      expect(servicioMercadoPago.generarLinkPago).toHaveBeenCalledWith('alumno-1', 500);
      expect(documentoFake.location.href).toBe('https://mercadopago.com/pagar');
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado que el back devuelve URL vacia, cuando acredito, deberia mostrar toast de error', async () => {
      spyOn(console, 'error');
      givenAlumnoEncontrado(AlumnoMother.crear({ id: 'alumno-1' }));
      await presenter.init('alumno-1');
      givenLinkPagoGenerado('');

      await presenter.acreditar(500);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Hubo un problema al contactar con Mercado Pago. Probá de nuevo más tarde.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado que Mercado Pago falla, cuando acredito, deberia mostrar toast de error', async () => {
      spyOn(console, 'error');
      givenAlumnoEncontrado(AlumnoMother.crear({ id: 'alumno-1' }));
      await presenter.init('alumno-1');
      servicioMercadoPago.generarLinkPago.and.rejectWith(new Error('MP boom'));

      await presenter.acreditar(500);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Hubo un problema al contactar con Mercado Pago. Probá de nuevo más tarde.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('volver', () => {
    it('dado el presenter en cualquier estado, cuando llamo a volver, deberia navegar a /tutor', () => {
      presenter.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  function givenAlumnoEncontrado(alumno: ReturnType<typeof AlumnoMother.crear>): void {
    servicioAlumnos.getAlumnoById.and.returnValue(alumno);
  }

  function givenAlumnoNoEncontrado(): void {
    servicioAlumnos.getAlumnoById.and.returnValue(undefined);
  }

  function givenResumenBilletera(resumen: BilleteraResumen): void {
    servicioBilletera.getResumen.and.returnValue(of(resumen));
  }

  function givenLinkPagoGenerado(url: string): void {
    servicioMercadoPago.generarLinkPago.and.resolveTo(url);
  }

  function whenSeEstaCargando(): void {
    (presenter as unknown as { cargandoState: { set(v: boolean): void } })
      .cargandoState.set(true);
  }
});
