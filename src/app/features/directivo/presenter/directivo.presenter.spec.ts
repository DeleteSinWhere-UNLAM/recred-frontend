import { DirectivoPresenter } from './directivo.presenter';
import { DirectivoMother } from '../directivo.mother';
import { TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Perfil } from '../../../data-access/models/perfil.model';

describe('DirectivoPresenter', () => {
  let presenter: DirectivoPresenter;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);

    TestBed.configureTestingModule({
      providers: [
        DirectivoPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
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

  function givenPerfilDelDirectivo(perfil: Perfil): void {
    perfilServiceSpy.cargarPerfil.and.resolveTo(perfil);
  }

  function givenLaCargaDelPerfilFalla(): void {
    perfilServiceSpy.cargarPerfil.and.rejectWith(new Error('Network error'));
  }
});
