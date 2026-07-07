import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Perfil } from '../../data-access/models/perfil.model';
import { PerfilService } from '../../data-access/services/perfil.service';

export type PlanVendedor = 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO';
export type PlanVendedorRequerido = Exclude<PlanVendedor, 'GRATUITO'>;

export const vendedorPlanGuard: CanActivateFn = (route) => {
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
): PlanVendedorRequerido | null {
  const valor = route.data['vendedorPlanMinimo'];
  return valor === 'INTERMEDIO' || valor === 'AVANZADO' ? valor : null;
}

function validarPlan(
  perfil: Perfil,
  planRequerido: PlanVendedorRequerido,
  router: Router,
): boolean | UrlTree {
  if (perfil.rol !== 'VENDEDOR') {
    return true;
  }

  if (nivelPlan(normalizarPlan(perfil.plan)) >= nivelPlan(planRequerido)) {
    return true;
  }

  return router.createUrlTree(['/suscripcion']);
}

function normalizarPlan(plan: string | undefined): PlanVendedor {
  const normalizado = plan?.toUpperCase();
  if (normalizado === 'INTERMEDIO' || normalizado === 'AVANZADO') {
    return normalizado;
  }

  return 'GRATUITO';
}

function nivelPlan(plan: PlanVendedor): number {
  if (plan === 'AVANZADO') return 2;
  if (plan === 'INTERMEDIO') return 1;
  return 0;
}
