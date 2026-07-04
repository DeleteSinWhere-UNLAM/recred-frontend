import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { RolUsuario } from '../../../data-access/models/perfil.model';

async function resolverRol(
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> {
  const router = inject(Router);
  const perfilService = inject(PerfilService);

  // Buscar roles permitidos ascendiendo por la jerarquía de rutas
  let allowedRoles: RolUsuario[] = [];
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    if (current.data && current.data['roles']) {
      allowedRoles = current.data['roles'] as RolUsuario[];
      break;
    }
    current = current.parent;
  }

  // Si no hay roles configurados en la jerarquía, se permite el acceso por defecto
  if (allowedRoles.length === 0) {
    return true;
  }

  try {
    const perfil = await perfilService.asegurarPerfil();
    if (perfil && allowedRoles.includes(perfil.rol)) {
      return true;
    }

    // Redirigir según el rol real si no está autorizado
    const rolReal = perfil?.rol;
    if (rolReal === 'ALUMNO') {
      return router.createUrlTree(['/alumno']);
    } else if (rolReal === 'VENDEDOR') {
      return router.createUrlTree(['/kiosquero']);
    } else {
      return router.createUrlTree(['/tutor']);
    }
  } catch (err) {
    return router.createUrlTree(['/']);
  }
}

export const rolGuard: CanActivateFn = (route) => {
  return resolverRol(route);
};

export const rolChildGuard: CanActivateChildFn = (route) => {
  return resolverRol(route);
};
