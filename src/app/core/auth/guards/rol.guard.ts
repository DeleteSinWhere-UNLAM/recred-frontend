import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { RolUsuario } from '../../../data-access/models/perfil.model';

function resolverRol(
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> | boolean | UrlTree {
  const router = inject(Router);
  const perfilService = inject(PerfilService);

  let allowedRoles: RolUsuario[] = [];
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    if (current.data && current.data['roles']) {
      allowedRoles = current.data['roles'] as RolUsuario[];
      break;
    }
    current = current.parent;
  }

  if (allowedRoles.length === 0) {
    return true;
  }

  const cachedPerfil = perfilService.getPerfil();
  if (cachedPerfil && cachedPerfil.rol && cachedPerfil.rol.toString() !== 'PENDIENTE') {
    if (allowedRoles.includes(cachedPerfil.rol)) {
      return true;
    }

    const rolReal = cachedPerfil.rol;
    if (rolReal === 'ALUMNO') {
      return router.createUrlTree(['/alumno']);
    } else if (rolReal === 'VENDEDOR') {
      return router.createUrlTree(['/kiosquero']);
    } else {
      return router.createUrlTree(['/tutor']);
    }
  }

  return perfilService.asegurarPerfil().then(
    (perfil) => {
      if (perfil && allowedRoles.includes(perfil.rol)) {
        return true;
      }

      const rolReal = perfil?.rol;
      if (rolReal === 'ALUMNO') {
        return router.createUrlTree(['/alumno']);
      } else if (rolReal === 'VENDEDOR') {
        return router.createUrlTree(['/kiosquero']);
      } else {
        return router.createUrlTree(['/tutor']);
      }
    },
    () => {
      return router.createUrlTree(['/']);
    }
  );
}

export const rolGuard: CanActivateFn = (route) => {
  return resolverRol(route);
};

export const rolChildGuard: CanActivateChildFn = (route) => {
  return resolverRol(route);
};

export const wildcardRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const perfilService = inject(PerfilService);

  const cachedPerfil = perfilService.getPerfil();
  if (cachedPerfil && cachedPerfil.rol && cachedPerfil.rol.toString() !== 'PENDIENTE') {
    const rol = cachedPerfil.rol;
    if (rol === 'ALUMNO') {
      return router.createUrlTree(['/alumno']);
    } else if (rol === 'VENDEDOR') {
      return router.createUrlTree(['/kiosquero']);
    } else {
      return router.createUrlTree(['/tutor']);
    }
  }
  return perfilService.asegurarPerfil().then(
    (perfil) => {
      if (perfil && perfil.rol && perfil.rol.toString() !== 'PENDIENTE') {
        const rol = perfil.rol;
        if (rol === 'ALUMNO') {
          return router.createUrlTree(['/alumno']);
        } else if (rol === 'VENDEDOR') {
          return router.createUrlTree(['/kiosquero']);
        } else {
          return router.createUrlTree(['/tutor']);
        }
      }
      return router.createUrlTree(['/']);
    },
    () => {
      return router.createUrlTree(['/']);
    }
  );
};
