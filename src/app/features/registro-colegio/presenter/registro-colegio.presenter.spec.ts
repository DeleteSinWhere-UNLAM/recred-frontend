import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RegistroColegioPresenter } from './registro-colegio.presenter';
import { RegistroColegioService } from '../services/registro-colegio.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RegistroColegioMother } from '../registro-colegio.mother';
import { SchoolRegistrationPayload } from '../models/registro-colegio.model';

describe('RegistroColegioPresenter', () => {
  let presenter: RegistroColegioPresenter;
  let servicio: jasmine.SpyObj<RegistroColegioService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj('RegistroColegioService', ['submitRegistration']);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);

    TestBed.configureTestingModule({
      providers: [
        RegistroColegioPresenter,
        { provide: RegistroColegioService, useValue: servicio },
        { provide: ToastService, useValue: toast },
      ],
    });

    presenter = TestBed.inject(RegistroColegioPresenter);
  });

  describe('Estado inicial', () => {
    it('debería iniciar sin errores, sin carga y sin éxito', () => {
      let cargando: boolean | undefined;
      let enviado: boolean | undefined;
      let error: string | null | undefined;
      presenter.cargando$.subscribe((v: boolean) => cargando = v);
      presenter.enviado$.subscribe((v: boolean) => enviado = v);
      presenter.error$.subscribe((v: string | null) => error = v);

      expect(cargando).toBeFalse();
      expect(enviado).toBeFalse();
      expect(error).toBeNull();
    });
  });

  describe('Envío exitoso', () => {
    it('debería activar carga, marcar como enviado y mostrar toast de éxito cuando el servicio responde correctamente', () => {
      const payload = RegistroColegioMother.crearPayload();
      servicio.submitRegistration.and.returnValue(of(undefined));
      let enviado: boolean | undefined;
      let cargando: boolean | undefined;
      presenter.enviado$.subscribe((v: boolean) => enviado = v);
      presenter.cargando$.subscribe((v: boolean) => cargando = v);

      presenter.enviarSolicitud(payload);

      expect(servicio.submitRegistration).toHaveBeenCalledWith(payload);
      expect(enviado).toBeTrue();
      expect(cargando).toBeFalse();
      expect(toast.mostrar).toHaveBeenCalledWith(jasmine.stringContaining('correctamente'), 'success');
    });
  });

  describe('Envío fallido', () => {
    it('debería emitir el mensaje de error y mostrar toast de error cuando el servicio falla', () => {
      const payload: SchoolRegistrationPayload = RegistroColegioMother.crearPayload();
      servicio.submitRegistration.and.returnValue(throwError(() => new Error('Error 500')));
      let error: string | null | undefined;
      let enviado: boolean | undefined;
      presenter.error$.subscribe((v: string | null) => error = v);
      presenter.enviado$.subscribe((v: boolean) => enviado = v);

      presenter.enviarSolicitud(payload);

      expect(error).toContain('error al enviar');
      expect(enviado).toBeFalse();
      expect(toast.mostrar).toHaveBeenCalledWith('Error al enviar la solicitud.', 'error');
    });
  });
});
