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
    servicio = jasmine.createSpyObj('RecredAdminService', ['getPendingRegistrations', 'approveRegistration', 'rejectRegistration']);
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

  describe('Inicialización', () => {
    it('debería cargar las solicitudes pendientes y emitirlas cuando el servicio responde correctamente', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
      let resultado: SchoolRegistration[] | undefined;
      let cargando: boolean | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => resultado = v);
      presenter.cargando$.subscribe((v: boolean) => cargando = v);

      presenter.initialize();

      expect(resultado).toEqual(solicitudes);
      expect(cargando).toBeFalse();
    });

    it('debería emitir el error cuando el servicio falla al cargar', () => {
      servicio.getPendingRegistrations.and.returnValue(throwError(() => new Error('API Error')));
      let error: string | null | undefined;
      presenter.error$.subscribe((v: string | null) => error = v);

      presenter.initialize();

      expect(error).toContain('Error al cargar');
    });
  });

  describe('Aprobación de solicitud', () => {
    it('debería aprobar la solicitud, eliminarla de la lista local y mostrar toast de éxito', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
      servicio.approveRegistration.and.returnValue(of(undefined));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => lista = v);

      presenter.aprobar('solicitud-1');

      expect(servicio.approveRegistration).toHaveBeenCalledWith('solicitud-1');
      expect(lista?.length).toBe(1);
      expect(lista?.[0].id).toBe('solicitud-2');
      expect(toast.mostrar).toHaveBeenCalledWith(jasmine.stringContaining('aprobado'), 'success');
    });

    it('debería mostrar toast de error y no modificar la lista cuando el servicio de aprobación falla', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
      servicio.approveRegistration.and.returnValue(throwError(() => new Error('API Error')));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => lista = v);

      presenter.aprobar('solicitud-1');

      expect(lista?.length).toBe(2);
      expect(toast.mostrar).toHaveBeenCalledWith('Error al aprobar la solicitud.', 'error');
    });
  });

  describe('Rechazo de solicitud', () => {
    it('debería rechazar la solicitud, eliminarla de la lista local y mostrar toast de éxito', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
      servicio.rejectRegistration.and.returnValue(of(undefined));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => lista = v);

      presenter.rechazar('solicitud-2');

      expect(servicio.rejectRegistration).toHaveBeenCalledWith('solicitud-2');
      expect(lista?.length).toBe(1);
      expect(lista?.[0].id).toBe('solicitud-1');
      expect(toast.mostrar).toHaveBeenCalledWith('Solicitud rechazada.', 'success');
    });

    it('debería mostrar toast de error y no modificar la lista cuando el servicio de rechazo falla', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
      servicio.rejectRegistration.and.returnValue(throwError(() => new Error('API Error')));
      presenter.initialize();
      let lista: SchoolRegistration[] | undefined;
      presenter.solicitudes$.subscribe((v: SchoolRegistration[]) => lista = v);

      presenter.rechazar('solicitud-2');

      expect(lista?.length).toBe(2);
      expect(toast.mostrar).toHaveBeenCalledWith('Error al rechazar la solicitud.', 'error');
    });
  });
});
