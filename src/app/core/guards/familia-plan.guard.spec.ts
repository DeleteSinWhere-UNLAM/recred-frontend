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
import { familiaPlanGuard } from './familia-plan.guard';

describe('familiaPlanGuard', () => {
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

  it('dado tutor intermedio y ruta intermedia, deberia permitir el acceso', () => {
    givenPerfilCacheado({ rol: 'PADRE', plan: 'INTERMEDIO' });

    const resultado = ejecutarGuard('INTERMEDIO');

    expect(resultado).toBeTrue();
  });

  it('dado tutor avanzado y ruta avanzada, deberia permitir el acceso', () => {
    givenPerfilCacheado({ rol: 'PADRE', plan: 'AVANZADO' });

    const resultado = ejecutarGuard('AVANZADO');

    expect(resultado).toBeTrue();
  });

  it('dado tutor gratuito y ruta intermedia, deberia redirigir a suscripcion', () => {
    givenPerfilCacheado({ rol: 'PADRE', plan: 'GRATUITO' });

    const resultado = ejecutarGuard('INTERMEDIO');

    expect(serializeUrl(resultado)).toBe('/suscripcion');
  });

  it('dado alumno gratuito y ruta intermedia, deberia redirigir a home alumno', () => {
    givenPerfilCacheado({ rol: 'ALUMNO', plan: 'GRATUITO' });

    const resultado = ejecutarGuard('INTERMEDIO');

    expect(serializeUrl(resultado)).toBe('/alumno');
  });

  it('dado tutor intermedio y ruta avanzada, deberia redirigir a suscripcion', () => {
    givenPerfilCacheado({ rol: 'PADRE', plan: 'INTERMEDIO' });

    const resultado = ejecutarGuard('AVANZADO');

    expect(serializeUrl(resultado)).toBe('/suscripcion');
  });

  it('dado un usuario no familia, no deberia bloquear por plan de familia', () => {
    givenPerfilCacheado({ rol: 'VENDEDOR', plan: 'GRATUITO' });

    const resultado = ejecutarGuard('AVANZADO');

    expect(resultado).toBeTrue();
  });

  it('dado sin perfil cacheado, deberia asegurar perfil antes de validar', async () => {
    givenPerfilCacheado(null);
    perfilService.asegurarPerfil.and.resolveTo(
      PerfilMother.crear({ rol: 'PADRE', plan: 'AVANZADO' }),
    );

    const resultado = await ejecutarGuard('AVANZADO');

    expect(perfilService.asegurarPerfil).toHaveBeenCalled();
    expect(resultado).toBeTrue();
  });

  function ejecutarGuard(planMinimo?: 'INTERMEDIO' | 'AVANZADO') {
    const route = {
      data: planMinimo ? { familiaPlanMinimo: planMinimo } : {},
    } as ActivatedRouteSnapshot;

    return TestBed.runInInjectionContext(() =>
      familiaPlanGuard(route, {} as RouterStateSnapshot),
    );
  }

  function givenPerfilCacheado(
    perfil: { rol: 'PADRE' | 'ALUMNO' | 'VENDEDOR'; plan: string } | null,
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
