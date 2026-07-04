import { DirectivoPresenter } from './directivo.presenter';
import { DirectivoMother } from '../directivo.mother';
import { TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';

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
    it('debería exponer el mensaje de bienvenida con el nombre del directivo', async () => {
      const perfilDirectivo = DirectivoMother.perfilDirectivo({ nombre: 'Juan' });
      
      givenCargaPerfilExitosa(perfilDirectivo);
      await whenInicializoPresenter();
      thenElMensajeDeBienvenidaEs('Hola bienvenido, Juan');
    });

    it('debería exponer un mensaje por defecto si la carga del perfil falla', async () => {
      givenCargaPerfilFalla();
      await whenInicializoPresenter();
      thenElMensajeDeBienvenidaEs('Hola bienvenido');
    });
  });

  function givenCargaPerfilExitosa(perfil: any): void {
    perfilServiceSpy.cargarPerfil.and.resolveTo(perfil);
  }

  function givenCargaPerfilFalla(): void {
    perfilServiceSpy.cargarPerfil.and.rejectWith(new Error('Network error'));
  }

  async function whenInicializoPresenter(): Promise<void> {
    await presenter.inicializar();
  }

  function thenElMensajeDeBienvenidaEs(mensaje: string): void {
    expect(presenter.mensajeBienvenida()).toBe(mensaje);
  }
});
