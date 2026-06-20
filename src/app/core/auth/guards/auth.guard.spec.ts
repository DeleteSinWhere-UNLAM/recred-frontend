import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, authChildGuard } from './auth.guard';
import { AuthSessionService } from '../services/auth-session.service';
import { PerfilService, UsuarioSinPerfilError } from '../../../data-access/services/perfil.service';

describe('AuthGuards', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthSessionService: jasmine.SpyObj<AuthSessionService>;
  let mockPerfilService: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);
    mockAuthSessionService = jasmine.createSpyObj('AuthSessionService', ['esperarSesionAutenticada']);
    mockPerfilService = jasmine.createSpyObj('PerfilService', ['asegurarPerfil']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthSessionService, useValue: mockAuthSessionService },
        { provide: PerfilService, useValue: mockPerfilService }
      ]
    });
  });

  const runGuard = async (url: string = '/'): Promise<any> => {
    const mockState = { url } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, mockState));
    // Esperamos a que la promesa resuelva ya que la funcion base devuelve Promise
    return await result;
  };

  const runChildGuard = async (url: string = '/'): Promise<any> => {
    const mockState = { url } as RouterStateSnapshot;
    return await TestBed.runInInjectionContext(() => authChildGuard({} as any, mockState));
  };

  describe('authGuard (CanActivate)', () => {
    it('dado que no hay sesion autenticada, debe devolver un UrlTree apuntando a /', async () => {
      mockAuthSessionService.esperarSesionAutenticada.and.returnValue(Promise.resolve(null));
      const mockTree = {} as UrlTree;
      mockRouter.createUrlTree.withArgs(['/']).and.returnValue(mockTree);

      const resultado = await runGuard('/privado');
      expect(resultado).toBe(mockTree);
    });

    it('dado que hay sesion y el perfil se asegura bien, debe retornar true', async () => {
      mockAuthSessionService.esperarSesionAutenticada.and.returnValue(Promise.resolve({} as any));
      mockPerfilService.asegurarPerfil.and.returnValue(Promise.resolve({} as any));

      const resultado = await runGuard('/privado');
      expect(resultado).toBeTrue();
    });

    it('dado que hay sesion pero arroja UsuarioSinPerfilError, debe retornar UrlTree a seleccion-tipo-cuenta', async () => {
      mockAuthSessionService.esperarSesionAutenticada.and.returnValue(Promise.resolve({} as any));
      mockPerfilService.asegurarPerfil.and.returnValue(Promise.reject(new UsuarioSinPerfilError()));
      
      const mockTree = {} as UrlTree;
      mockRouter.createUrlTree.withArgs(['/seleccion-tipo-cuenta']).and.returnValue(mockTree);

      const resultado = await runGuard('/privado');
      expect(resultado).toBe(mockTree);
    });

    it('dado que hay sesion, arroja UsuarioSinPerfilError y ESTAMOS en seleccion-tipo-cuenta, debe retornar true', async () => {
      mockAuthSessionService.esperarSesionAutenticada.and.returnValue(Promise.resolve({} as any));
      mockPerfilService.asegurarPerfil.and.returnValue(Promise.reject(new UsuarioSinPerfilError()));

      const resultado = await runGuard('/seleccion-tipo-cuenta');
      expect(resultado).toBeTrue();
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('dado que arroja un error desconocido en el perfil, debe retornar UrlTree apuntando a /', async () => {
      mockAuthSessionService.esperarSesionAutenticada.and.returnValue(Promise.resolve({} as any));
      mockPerfilService.asegurarPerfil.and.returnValue(Promise.reject(new Error('Fatal API crash')));
      
      const mockTree = {} as UrlTree;
      mockRouter.createUrlTree.withArgs(['/']).and.returnValue(mockTree);

      const resultado = await runGuard('/privado');
      expect(resultado).toBe(mockTree);
    });
  });

  describe('authChildGuard (CanActivateChild)', () => {
    it('debe ejecutar la misma logica de resolverAutenticacion', async () => {
      mockAuthSessionService.esperarSesionAutenticada.and.returnValue(Promise.resolve({} as any));
      mockPerfilService.asegurarPerfil.and.returnValue(Promise.resolve({} as any));

      const resultado = await runChildGuard('/privado');
      expect(resultado).toBeTrue();
    });
  });
});
