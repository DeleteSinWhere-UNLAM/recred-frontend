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
      let resultado: SchoolRegistration[] | undefined;
      let cargando: boolean | undefined;

      givenSolicitudes(solicitudes);
      whenInicializoPresenter(
        val => resultado = val,
        val => cargando = val
      );
      thenSeCargaronLasSolicitudes(solicitudes, resultado, cargando);
    });

    it('debería emitir el error cuando el servicio falla al cargar', () => {
      let error: string | null | undefined;

      givenErrorEnSolicitudes();
      whenInicializoPresenterConError(val => error = val);
      thenSeEmitioError(error);
    });
  });

  describe('Aprobación de solicitud', () => {
    it('debería aprobar la solicitud, eliminarla de la lista local y mostrar toast de éxito', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      let lista: SchoolRegistration[] | undefined;

      givenAprobacionExitosa(solicitudes);
      whenAprobarSolicitud('solicitud-1', val => lista = val);
      thenSolicitudFueAprobada('solicitud-1', 'solicitud-2', lista);
    });

    it('debería mostrar toast de error y no modificar la lista cuando el servicio de aprobación falla', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      let lista: SchoolRegistration[] | undefined;

      givenAprobacionFallida(solicitudes);
      whenAprobarSolicitud('solicitud-1', val => lista = val);
      thenAprobacionFallo(lista);
    });
  });

  describe('Rechazo de solicitud', () => {
    it('debería rechazar la solicitud, eliminarla de la lista local y mostrar toast de éxito', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      let lista: SchoolRegistration[] | undefined;

      givenRechazoExitoso(solicitudes);
      whenRechazarSolicitud('solicitud-2', val => lista = val);
      thenSolicitudFueRechazada('solicitud-2', 'solicitud-1', lista);
    });

    it('debería mostrar toast de error y no modificar la lista cuando el servicio de rechazo falla', () => {
      const solicitudes = RecredAdminMother.crearListaSolicitudes();
      let lista: SchoolRegistration[] | undefined;

      givenRechazoFallido(solicitudes);
      whenRechazarSolicitud('solicitud-2', val => lista = val);
      thenRechazoFallo(lista);
    });
  });

  function givenSolicitudes(solicitudes: SchoolRegistration[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
  }

  function givenErrorEnSolicitudes(): void {
    servicio.getPendingRegistrations.and.returnValue(throwError(() => new Error('API Error')));
  }

  function givenAprobacionExitosa(solicitudes: SchoolRegistration[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.approveRegistration.and.returnValue(of(undefined));
  }

  function givenAprobacionFallida(solicitudes: SchoolRegistration[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.approveRegistration.and.returnValue(throwError(() => new Error('API Error')));
  }

  function givenRechazoExitoso(solicitudes: SchoolRegistration[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.rejectRegistration.and.returnValue(of(undefined));
  }

  function givenRechazoFallido(solicitudes: SchoolRegistration[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.rejectRegistration.and.returnValue(throwError(() => new Error('API Error')));
  }

  function whenInicializoPresenter(cbResultado: (val: any) => void, cbCargando: (val: any) => void): void {
    presenter.solicitudes$.subscribe(cbResultado);
    presenter.cargando$.subscribe(cbCargando);
    presenter.initialize();
  }

  function whenInicializoPresenterConError(cbError: (val: any) => void): void {
    presenter.error$.subscribe(cbError);
    presenter.initialize();
  }

  function whenAprobarSolicitud(id: string, cbLista: (val: any) => void): void {
    presenter.initialize();
    presenter.solicitudes$.subscribe(cbLista);
    presenter.aprobar(id);
  }

  function whenRechazarSolicitud(id: string, cbLista: (val: any) => void): void {
    presenter.initialize();
    presenter.solicitudes$.subscribe(cbLista);
    presenter.rechazar(id);
  }

  function thenSeCargaronLasSolicitudes(solicitudes: SchoolRegistration[], resultado: any, cargando: any): void {
    expect(resultado).toEqual(solicitudes);
    expect(cargando).toBeFalse();
  }

  function thenSeEmitioError(error: any): void {
    expect(error).toContain('Error al cargar');
  }

  function thenSolicitudFueAprobada(idAprobado: string, idRestante: string, lista: any): void {
    expect(servicio.approveRegistration).toHaveBeenCalledWith(idAprobado);
    expect(lista?.length).toBe(1);
    expect(lista?.[0].id).toBe(idRestante);
    expect(toast.mostrar).toHaveBeenCalledWith(jasmine.stringContaining('aprobado'), 'success');
  }

  function thenAprobacionFallo(lista: any): void {
    expect(lista?.length).toBe(2);
    expect(toast.mostrar).toHaveBeenCalledWith('Error al aprobar la solicitud.', 'error');
  }

  function thenSolicitudFueRechazada(idRechazado: string, idRestante: string, lista: any): void {
    expect(servicio.rejectRegistration).toHaveBeenCalledWith(idRechazado);
    expect(lista?.length).toBe(1);
    expect(lista?.[0].id).toBe(idRestante);
    expect(toast.mostrar).toHaveBeenCalledWith('Solicitud rechazada.', 'success');
  }

  function thenRechazoFallo(lista: any): void {
    expect(lista?.length).toBe(2);
    expect(toast.mostrar).toHaveBeenCalledWith('Error al rechazar la solicitud.', 'error');
  }
});
