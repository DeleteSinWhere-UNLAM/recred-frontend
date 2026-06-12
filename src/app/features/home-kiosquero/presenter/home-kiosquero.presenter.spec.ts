import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeKiosqueroPresenter } from './home-kiosquero.presenter';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { HomeKiosqueroService } from '../services/home-kiosquero.service';
import { AccionKiosquero } from '../models/accion-kiosquero.model';

describe('HomeKiosqueroPresenter', () => {
  let presenter: HomeKiosqueroPresenter;
  let mockPerfilService: jasmine.SpyObj<PerfilService>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;
  let mockHomeKiosqueroService: jasmine.SpyObj<HomeKiosqueroService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockPerfilService = jasmine.createSpyObj('PerfilService', ['getPerfil']);
    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['setHomeUrl', 'setNombreNavbar']);
    mockHomeKiosqueroService = jasmine.createSpyObj('HomeKiosqueroService', ['getResumen', 'getNombreKiosquero']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        HomeKiosqueroPresenter,
        { provide: PerfilService, useValue: mockPerfilService },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: HomeKiosqueroService, useValue: mockHomeKiosqueroService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    presenter = TestBed.inject(HomeKiosqueroPresenter);
  });

  describe('init', () => {
    it('Dado que init es llamado, debería setear el resumen y el nombre correctamente', () => {
      mockHomeKiosqueroService.getResumen.and.returnValue({
        gananciasHoy: 1000,
        ventasHoy: 10,
        productosSinStock: 2
      });

      mockPerfilService.getPerfil.and.returnValue({ nombre: 'Carlos', apellido: 'Kiosquero' } as import('../../../data-access/models/perfil.model').Perfil);

      presenter.init();

      expect(presenter.ventasHoy()).toBe(10);
      expect(presenter.productosSinStock()).toBe(2);
      expect(presenter.nombreKiosquero()).toBe('Carlos Kiosquero');
    });
  });

  describe('ejecutarAccion', () => {
    it('Dado que ejecutarAccion es llamado con una accion, debería navegar a la ruta correspondiente', () => {
      const mockAction: AccionKiosquero = {
        id: 'promociones',
        titulo: 'Promociones',
        descripcion: 'Gestión',
        icono: 'fa-tags',
        ruta: '/promociones',
        color: 'violeta'
      };

      presenter.ejecutarAccion(mockAction);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/promociones');
    });
  });

  describe('acciones', () => {
    it('Dado que se obtienen las acciones, debería incluir la tarjeta de promociones', () => {
      const acciones = presenter.acciones();
      const promociones = acciones.find(a => a.id === 'promociones');
      expect(promociones).toBeDefined();
      expect(promociones?.ruta).toBe('/promociones');
    });
  });
});
