import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { PerfilMother } from '../../data-access/services/alumno.mother';
import { PerfilService } from '../../data-access/services/perfil.service';
import { vendedorPlanGuard } from './vendedor-plan.guard';

describe('vendedorPlanGuard', () => {
  let perfilService: jasmine.SpyObj<PerfilService>;
  let router: Router;

  beforeEach(() => {
    perfilService = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
      'asegurarPerfil',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PerfilService, useValue: perfilService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('dado una ruta sin plan minimo, deberia permitir el acceso', () => {
    givenPerfilCacheado(null);

    const resultado = ejecutarGuard();

    expect(resultado).toBeTrue();
  });

  it('dado vendedor intermedio y ruta intermedia, deberia permitir el acceso', () => {
    givenPerfilCacheado({ rol: 'VENDEDOR', plan: 'INTERMEDIO' });

    const resultado = ejecutarGuard('INTERMEDIO');

    expect(resultado).toBeTrue();
  });

  it('dado vendedor avanzado y ruta avanzada, deberia permitir el acceso', () => {
    givenPerfilCacheado({ rol: 'VENDEDOR', plan: 'AVANZADO' });

    const resultado = ejecutarGuard('AVANZADO');

    expect(resultado).toBeTrue();
  });

  it('dado vendedor gratuito y ruta intermedia, deberia redirigir a suscripcion', () => {
    givenPerfilCacheado({ rol: 'VENDEDOR', plan: 'GRATUITO' });

    const resultado = ejecutarGuard('INTERMEDIO');

    expect(serializeUrl(resultado)).toBe('/suscripcion');
  });

  it('dado vendedor intermedio y ruta avanzada, deberia redirigir a suscripcion', () => {
    givenPerfilCacheado({ rol: 'VENDEDOR', plan: 'INTERMEDIO' });

    const resultado = ejecutarGuard('AVANZADO');

    expect(serializeUrl(resultado)).toBe('/suscripcion');
  });

  it('dado un usuario no vendedor, no deberia bloquear por plan de vendedor', () => {
    givenPerfilCacheado({ rol: 'PADRE', plan: 'GRATUITO' });

    const resultado = ejecutarGuard('AVANZADO');

    expect(resultado).toBeTrue();
  });

  it('dado sin perfil cacheado, deberia asegurar perfil antes de validar', async () => {
    givenPerfilCacheado(null);
    perfilService.asegurarPerfil.and.resolveTo(
      PerfilMother.crear({ rol: 'VENDEDOR', plan: 'AVANZADO' }),
    );

    const resultado = await ejecutarGuard('AVANZADO');

    expect(perfilService.asegurarPerfil).toHaveBeenCalled();
    expect(resultado).toBeTrue();
  });

  function ejecutarGuard(planMinimo?: 'INTERMEDIO' | 'AVANZADO') {
    const route = {
      data: planMinimo ? { vendedorPlanMinimo: planMinimo } : {},
    } as ActivatedRouteSnapshot;

    return TestBed.runInInjectionContext(() =>
      vendedorPlanGuard(route, {} as RouterStateSnapshot),
    );
  }

  function givenPerfilCacheado(
    perfil: { rol: 'VENDEDOR' | 'PADRE'; plan: string } | null,
  ): void {
    perfilService.getPerfil.and.returnValue(
      perfil
        ? PerfilMother.crear({ rol: perfil.rol, plan: perfil.plan })
        : null,
    );
  }

  function serializeUrl(resultado: unknown): string {
    return router.serializeUrl(resultado as UrlTree);
  }
});
