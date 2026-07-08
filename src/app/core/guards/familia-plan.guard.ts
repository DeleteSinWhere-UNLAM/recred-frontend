import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Perfil } from '../../data-access/models/perfil.model';
import { PerfilService } from '../../data-access/services/perfil.service';

export type PlanFamilia = 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO';
export type PlanFamiliaRequerido = Exclude<PlanFamilia, 'GRATUITO'>;

export const familiaPlanGuard: CanActivateFn = (route) => {
  const perfilService = inject(PerfilService);
  const router = inject(Router);
  const planRequerido = obtenerPlanRequerido(route);

  if (!planRequerido) {
    return true;
  }

  const perfilCacheado = perfilService.getPerfil();
  if (perfilCacheado) {
    return validarPlan(perfilCacheado, planRequerido, router);
  }

  return perfilService.asegurarPerfil().then(
    (perfil) => validarPlan(perfil, planRequerido, router),
    () => router.createUrlTree(['/']),
  );
};

function obtenerPlanRequerido(
  route: ActivatedRouteSnapshot,
): PlanFamiliaRequerido | null {
  const valor = route.data['familiaPlanMinimo'];
  return valor === 'INTERMEDIO' || valor === 'AVANZADO' ? valor : null;
}

function validarPlan(
  perfil: Perfil,
  planRequerido: PlanFamiliaRequerido,
  router: Router,
): boolean | UrlTree {
  if (perfil.rol !== 'PADRE' && perfil.rol !== 'ALUMNO') {
    return true;
  }

  if (nivelPlan(normalizarPlan(perfil.plan)) >= nivelPlan(planRequerido)) {
    return true;
  }

  return router.createUrlTree([perfil.rol === 'ALUMNO' ? '/alumno' : '/suscripcion']);
}

function normalizarPlan(plan: string | undefined): PlanFamilia {
  const normalizado = plan?.toUpperCase();
  if (normalizado === 'INTERMEDIO' || normalizado === 'AVANZADO') {
    return normalizado;
  }

  return 'GRATUITO';
}

function nivelPlan(plan: PlanFamilia): number {
  if (plan === 'AVANZADO') return 2;
  if (plan === 'INTERMEDIO') return 1;
  return 0;
}
