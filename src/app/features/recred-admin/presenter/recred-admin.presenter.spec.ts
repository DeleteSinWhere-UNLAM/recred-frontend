import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecredAdminPresenter } from './recred-admin.presenter';
import { RecredAdminService } from '../services/recred-admin.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SchoolRegistration } from '../models/solicitud-colegio.model';
import { RecredAdminMother } from '../recred-admin.mother';

describe('RecredAdminPresenter', () => {
  let presenter: RecredAdminPresenter;
  let servicio: jasmine.SpyObj<RecredAdminService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj('RecredAdminService', [
      'getPendingRegistrations',
      'approveRegistration',
      'rejectRegistration',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);

    TestBed.configureTestingModule({
      providers: [
        RecredAdminPresenter,
        { provide: RecredAdminService, useValue: servicio },
        { provide: ToastService, useValue: toast },
      ],
    });

    presenter = TestBed.inject(RecredAdminPresenter);
  });

  describe('Inicializacion', () => {
    it('dado que el servicio responde con solicitudes, cuando inicializo, deberia emitirlas y dejar cargando en false', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      givenSolicitudesPendientes(solicitudes);
      let resultado: SchoolRegistration[] | undefined;
      let cargando: boolean | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => (resultado = v));
      presenter.cargando$.subscribe((v: boolean) => (cargando = v));

      presenter.initialize();

      expect(resultado).toEqual(solicitudes);
      expect(cargando).toBeFalse();
    });

    it('dado que el servicio falla al cargar, cuando inicializo, deberia emitir el error', () => {
      givenGetPendingRegistrationsFalla();
      let error: string | null | undefined;
      presenter.error$.subscribe((v: string | null) => (error = v));

      presenter.initialize();

      expect(error).toContain('Error al cargar');
    });
  });

  describe('Aprobacion de solicitud', () => {
    it('dado una lista cargada, cuando apruebo una solicitud, deberia sacarla de la lista y mostrar toast de exito', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      givenSolicitudesPendientes(solicitudes);
      servicio.approveRegistration.and.returnValue(of(undefined));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => (lista = v));

      presenter.aprobar('solicitud-1');

      expect(servicio.approveRegistration).toHaveBeenCalledWith('solicitud-1');
      expect(lista?.length).toBe(1);
      expect(lista?.[0].id).toBe('solicitud-2');
      expect(toast.mostrar).toHaveBeenCalledWith(jasmine.stringContaining('aprobado'), 'success');
    });

    it('dado que approveRegistration falla, cuando apruebo, deberia mostrar toast de error y no modificar la lista', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      givenSolicitudesPendientes(solicitudes);
      servicio.approveRegistration.and.returnValue(throwError(() => new Error('API Error')));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => (lista = v));

      presenter.aprobar('solicitud-1');

      expect(lista?.length).toBe(2);
      expect(toast.mostrar).toHaveBeenCalledWith('Error al aprobar la solicitud.', 'error');
    });
  });

  describe('Rechazo de solicitud', () => {
    it('dado una lista cargada, cuando rechazo una solicitud, deberia sacarla de la lista y mostrar toast de exito', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      givenSolicitudesPendientes(solicitudes);
      servicio.rejectRegistration.and.returnValue(of(undefined));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => (lista = v));

      presenter.rechazar('solicitud-2');

      expect(servicio.rejectRegistration).toHaveBeenCalledWith('solicitud-2');
      expect(lista?.length).toBe(1);
      expect(lista?.[0].id).toBe('solicitud-1');
      expect(toast.mostrar).toHaveBeenCalledWith('Solicitud rechazada.', 'success');
    });

    it('dado que rejectRegistration falla, cuando rechazo, deberia mostrar toast de error y no modificar la lista', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      givenSolicitudesPendientes(solicitudes);
      servicio.rejectRegistration.and.returnValue(throwError(() => new Error('API Error')));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => (lista = v));

      presenter.rechazar('solicitud-2');

      expect(lista?.length).toBe(2);
      expect(toast.mostrar).toHaveBeenCalledWith('Error al rechazar la solicitud.', 'error');
    });
  });

  function givenSolicitudesPendientes(solicitudes: SchoolRegistration[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
  }

  function givenGetPendingRegistrationsFalla(): void {
    servicio.getPendingRegistrations.and.returnValue(throwError(() => new Error('API Error')));
  }
});
