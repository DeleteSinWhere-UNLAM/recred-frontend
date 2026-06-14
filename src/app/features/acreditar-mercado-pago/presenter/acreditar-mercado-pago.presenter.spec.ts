import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AcreditarMercadoPagoPresenter } from './acreditar-mercado-pago.presenter';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { Alumno } from '../../../data-access/models/alumno.model';
import { ToastService } from '../../../shared/services/toast.service';
import { AcreditarMercadoPagoService } from '../services/acreditar-mercado-pago.service';
import { DOCUMENT } from '@angular/common';

describe('AcreditarMercadoPagoPresenter', () => {
  let presenter: AcreditarMercadoPagoPresenter;
  let mockAlumnosService: jasmine.SpyObj<AlumnosService>;
  let mockMercadoPagoService: jasmine.SpyObj<AcreditarMercadoPagoService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAlumnosService = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    mockMercadoPagoService = jasmine.createSpyObj('AcreditarMercadoPagoService', ['generarLinkPago']);
    mockToastService = jasmine.createSpyObj('ToastService', ['mostrar']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        AcreditarMercadoPagoPresenter,
        { provide: AlumnosService, useValue: mockAlumnosService },
        { provide: AcreditarMercadoPagoService, useValue: mockMercadoPagoService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: DOCUMENT, useValue: { location: { href: '' } } }
      ]
    });

    spyOn(console, 'error');
    presenter = TestBed.inject(AcreditarMercadoPagoPresenter);
  });

  it('Dado que se crea el presenter, los valores por defecto deben ser correctos', () => {
    expect(presenter.alumno()).toBeUndefined();
    expect(presenter.cargando()).toBeFalse();
    expect(presenter.nombreCompleto()).toBe('');
    expect(presenter.grado()).toBe('');
    expect(presenter.iniciales()).toBe('');
  });

  describe('init', () => {
    it('Dado que init es llamado y encuentra al alumno, debería setear el alumno en el estado', async () => {
      mockAlumnosService.asegurarCargados.and.returnValue(Promise.resolve([]));
      mockAlumnosService.getAlumnoById.and.returnValue({ id: '1', nombre: 'Juan', apellido: 'Perez', grado: '3A' } as unknown as Alumno);

      await presenter.init('1');

      expect(mockAlumnosService.asegurarCargados).toHaveBeenCalled();
      expect(presenter.alumno()).toEqual({ id: '1', nombre: 'Juan', apellido: 'Perez', grado: '3A' } as unknown as Alumno);
      expect(presenter.nombreCompleto()).toBe('Juan Perez');
      expect(presenter.grado()).toBe('3A');
      expect(presenter.iniciales()).toBe('JP');
      expect(presenter.cargando()).toBeFalse();
    });

    it('Dado que init es llamado pero iniciales maneja undefined en nombre y apellido, debería devolver vacío', async () => {
      mockAlumnosService.asegurarCargados.and.returnValue(Promise.resolve([]));
      mockAlumnosService.getAlumnoById.and.returnValue({ id: '1', nombre: '', apellido: '', grado: undefined } as unknown as Alumno);

      await presenter.init('1');

      expect(presenter.iniciales()).toBe('');
      expect(presenter.grado()).toBe('');
    });

    it('Dado que init es llamado y NO encuentra al alumno, debería navegar a /tutor', async () => {
      mockAlumnosService.asegurarCargados.and.returnValue(Promise.resolve([]));
      mockAlumnosService.getAlumnoById.and.returnValue(undefined);

      await presenter.init('2');

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(presenter.alumno()).toBeUndefined();
      expect(presenter.cargando()).toBeFalse();
    });

    it('Dado que init es llamado y asegurarCargados lanza error, debería mostrar toast de error', async () => {
      mockAlumnosService.asegurarCargados.and.returnValue(Promise.reject(new Error('error de red')));

      await presenter.init('1');

      expect(mockToastService.mostrar).toHaveBeenCalledWith('No pudimos cargar la información del alumno.', 'error');
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('acreditar', () => {
    it('Dado que el estado es cargando, no debería hacer nada al intentar acreditar', async () => {
      presenter['cargandoState'].set(true);
      await presenter.acreditar(100);
      expect(mockMercadoPagoService.generarLinkPago).not.toHaveBeenCalled();
    });

    it('Dado que el alumno no está seteado, no debería hacer nada al intentar acreditar', async () => {
      await presenter.acreditar(100);
      expect(mockMercadoPagoService.generarLinkPago).not.toHaveBeenCalled();
    });

    it('Dado que el monto es menor o igual a 0, debería mostrar un error', async () => {
      presenter['alumnoState'].set({ id: '1' } as unknown as Alumno);
      await presenter.acreditar(0);
      expect(mockToastService.mostrar).toHaveBeenCalledWith('El monto debe ser mayor a 0.', 'error');
      expect(mockMercadoPagoService.generarLinkPago).not.toHaveBeenCalled();

      await presenter.acreditar(-50);
      expect(mockToastService.mostrar).toHaveBeenCalledWith('El monto debe ser mayor a 0.', 'error');
    });

    it('Dado que el monto es válido y el link de pago se genera, debería redirigir a la URL', async () => {
      presenter['alumnoState'].set({ id: '1' } as unknown as Alumno);
      mockMercadoPagoService.generarLinkPago.and.returnValue(Promise.resolve('https://mercadopago.com/pagar'));

      await presenter.acreditar(500);

      expect(mockMercadoPagoService.generarLinkPago).toHaveBeenCalledWith('1', 500);
      expect(presenter['document'].location.href).toBe('https://mercadopago.com/pagar');
      expect(presenter.cargando()).toBeFalse();
    });

    it('Dado que no se recibe URL de pago, debería capturar el error y mostrar toast de error', async () => {
      presenter['alumnoState'].set({ id: '1' } as unknown as Alumno);
      mockMercadoPagoService.generarLinkPago.and.returnValue(Promise.resolve(''));

      await presenter.acreditar(500);

      expect(mockToastService.mostrar).toHaveBeenCalledWith('Hubo un problema al contactar con Mercado Pago. Probá de nuevo más tarde.', 'error');
      expect(presenter.cargando()).toBeFalse();
    });

    it('Dado que la API de Mercado Pago lanza un error, debería capturar el error y mostrar toast', async () => {
      presenter['alumnoState'].set({ id: '1' } as unknown as Alumno);
      mockMercadoPagoService.generarLinkPago.and.returnValue(Promise.reject(new Error('MP error')));

      await presenter.acreditar(500);

      expect(mockToastService.mostrar).toHaveBeenCalledWith('Hubo un problema al contactar con Mercado Pago. Probá de nuevo más tarde.', 'error');
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('volver', () => {
    it('Dado que se llama a volver, debería navegar a /tutor', () => {
      presenter.volver();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });
});
