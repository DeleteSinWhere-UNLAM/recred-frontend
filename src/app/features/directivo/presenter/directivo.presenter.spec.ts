import { DirectivoPresenter } from './directivo.presenter';
import { DirectivoMother } from '../directivo.mother';
import { TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { DirectivoService } from '../services/directivo.service';

describe('DirectivoPresenter (Pilar 1: MVP Testeable)', () => {
  let presenter: DirectivoPresenter;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let directivoServiceSpy: jasmine.SpyObj<DirectivoService>;

  beforeEach(() => {
    // Pilar 6: Spies Limpios
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    directivoServiceSpy = jasmine.createSpyObj('DirectivoService', ['obtenerResumenColegio']);
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
        { provide: DirectivoService, useValue: directivoServiceSpy }
      ],
    });

    presenter = TestBed.inject(DirectivoPresenter);
  });

  describe('Al inicializar el presenter', () => {
    it('debería exponer el mensaje de bienvenida con el nombre del directivo', async () => {

      const perfilDirectivo = DirectivoMother.perfilDirectivo({ nombre: 'Juan' });
      perfilServiceSpy.cargarPerfil.and.resolveTo(perfilDirectivo);


      await presenter.inicializar();


      // Pilar 2: AAA Visual
      // Pilar 4: Nombrado BDD
      // Pilar 5: RxJS Blindado (Signals)
      expect(presenter.mensajeBienvenida()).toBe('Hola bienvenido, Juan');
    });

    it('debería exponer un mensaje por defecto si la carga del perfil falla', async () => {

      perfilServiceSpy.cargarPerfil.and.rejectWith(new Error('Network error'));


      await presenter.inicializar();


      expect(presenter.mensajeBienvenida()).toBe('Hola bienvenido');
    });
  });
});
