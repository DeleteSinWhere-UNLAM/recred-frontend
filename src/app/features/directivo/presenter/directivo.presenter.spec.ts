import { HttpErrorResponse } from '@angular/common/http';
import { DirectivoPresenter } from './directivo.presenter';
import { DirectivoMother } from '../directivo.mother';
import { TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { DirectivoService } from '../services/directivo.service';
import { Perfil } from '../../../data-access/models/perfil.model';
import { ToastService } from '../../../shared/services/toast.service';

describe('DirectivoPresenter', () => {
  let presenter: DirectivoPresenter;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let directivoServiceSpy: jasmine.SpyObj<DirectivoService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    directivoServiceSpy = jasmine.createSpyObj('DirectivoService', ['obtenerResumenColegio']);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    directivoServiceSpy.obtenerResumenColegio.and.resolveTo({
      id: 'colegio-1',
      nombre: 'Colegio Prueba',
      cue: '123',
      buffets: []
    });

    TestBed.configureTestingModule({
      providers: [
        DirectivoPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: DirectivoService, useValue: directivoServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ],
    });

    presenter = TestBed.inject(DirectivoPresenter);
  });

  describe('Al inicializar el presenter', () => {
    it('dado un directivo con nombre "Juan", cuando inicializo, deberia exponer el mensaje de bienvenida personalizado', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'Juan' }));

      await presenter.inicializar();

      expect(presenter.mensajeBienvenida()).toBe('Hola bienvenido, Juan');
    });

    it('dado que la carga del perfil falla, cuando inicializo, deberia exponer un mensaje por defecto', async () => {
      givenLaCargaDelPerfilFalla();

      await presenter.inicializar();

      expect(presenter.mensajeBienvenida()).toBe('Hola bienvenido');
    });
  });

  describe('errores al cargar overview', () => {
    it('dado un HttpErrorResponse 403, deberia setear mensaje de sin permisos', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'X' }));
      directivoServiceSpy.obtenerResumenColegio.and.rejectWith(new HttpErrorResponse({ status: 403 }));

      await presenter.inicializar();

      expect(presenter.error()).toBe('No tienes permisos para ver este panel.');
    });

    it('dado un HttpErrorResponse 404, deberia setear mensaje de colegio no encontrado', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'X' }));
      directivoServiceSpy.obtenerResumenColegio.and.rejectWith(new HttpErrorResponse({ status: 404 }));

      await presenter.inicializar();

      expect(presenter.error()).toBe('Colegio no encontrado para tu usuario.');
    });

    it('dado un HttpErrorResponse con otro status, deberia setear mensaje generico HTTP', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'X' }));
      directivoServiceSpy.obtenerResumenColegio.and.rejectWith(new HttpErrorResponse({ status: 500 }));

      await presenter.inicializar();

      expect(presenter.error()).toBe('Ocurrió un error al cargar los datos.');
    });

    it('dado un error no HttpErrorResponse, deberia setear mensaje de error inesperado', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'X' }));
      directivoServiceSpy.obtenerResumenColegio.and.rejectWith(new Error('boom'));

      await presenter.inicializar();

      expect(presenter.error()).toBe('Ocurrió un error inesperado al cargar los datos.');
    });
  });

  function givenPerfilDelDirectivo(perfil: Perfil): void {
    perfilServiceSpy.cargarPerfil.and.resolveTo(perfil);
  }

  function givenLaCargaDelPerfilFalla(): void {
    perfilServiceSpy.cargarPerfil.and.rejectWith(new Error('Network error'));
  }
});
