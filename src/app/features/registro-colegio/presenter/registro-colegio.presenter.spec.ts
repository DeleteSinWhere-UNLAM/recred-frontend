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
    it('dado el presenter recien instanciado, cuando leo los estados, deberia iniciar sin errores, sin carga y sin exito', () => {
      let cargando: boolean | undefined;
      let enviado: boolean | undefined;
      let error: any;
      presenter.cargando$.subscribe((v: boolean) => (cargando = v));
      presenter.enviado$.subscribe((v: boolean) => (enviado = v));
      presenter.error$.subscribe((v) => (error = v));

      expect(cargando).toBeFalse();
      expect(enviado).toBeFalse();
      expect(error).toBeNull();
    });
  });

  describe('Envio exitoso', () => {
    it('dado un payload valido, cuando envio y el servicio responde OK, deberia marcarse como enviado y mostrar toast de exito', () => {
      const payload = RegistroColegioMother.crearPayload();
      givenSubmitRegistrationResuelveOk();
      let enviado: boolean | undefined;
      let cargando: boolean | undefined;
      presenter.enviado$.subscribe((v: boolean) => (enviado = v));
      presenter.cargando$.subscribe((v: boolean) => (cargando = v));

      presenter.enviarSolicitud(payload);

      expect(servicio.submitRegistration).toHaveBeenCalledWith(payload);
      expect(enviado).toBeTrue();
      expect(cargando).toBeFalse();
      expect(toast.mostrar).toHaveBeenCalledWith(jasmine.stringContaining('correctamente'), 'success');
    });
  });

  describe('Envio fallido', () => {
    it('dado un payload valido, cuando envio y el servicio falla, deberia emitir el mensaje de error y mostrar toast', () => {
      const payload: SchoolRegistrationPayload = RegistroColegioMother.crearPayload();
      givenSubmitRegistrationFalla();
      let error: any;
      let enviado: boolean | undefined;
      presenter.error$.subscribe((v) => (error = v));
      presenter.enviado$.subscribe((v: boolean) => (enviado = v));

      presenter.enviarSolicitud(payload);

      expect(error?.mensaje).toContain('error al enviar');
      expect(enviado).toBeFalse();
      expect(toast.mostrar).toHaveBeenCalledWith('Error al enviar la solicitud.', 'error');
    });
  });

  function givenSubmitRegistrationResuelveOk(): void {
    servicio.submitRegistration.and.returnValue(of(undefined));
  }

  function givenSubmitRegistrationFalla(): void {
    servicio.submitRegistration.and.returnValue(throwError(() => new Error('Error 500')));
  }
});
