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

    return getRedirectTree(cachedPerfil.rol, router);
  }

  return perfilService.asegurarPerfil().then(
    (perfil) => {
      if (perfil && allowedRoles.includes(perfil.rol)) {
        return true;
      }

      return getRedirectTree(perfil?.rol, router);
    },
    () => {
      return router.createUrlTree(['/']);
    }
  );
}

function getRedirectTree(rol: RolUsuario | undefined, router: Router): UrlTree {
  if (rol === 'ALUMNO') {
    return router.createUrlTree(['/alumno']);
  } else if (rol === 'VENDEDOR') {
    return router.createUrlTree(['/kiosquero']);
  } else if (rol === 'ADMIN') {
    return router.createUrlTree(['/recred-admin']);
  } else if (rol === 'DIRECTIVO_COLEGIO') {
    return router.createUrlTree(['/directivo']);
  } else {
    return router.createUrlTree(['/tutor']);
  }
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
    return getRedirectTree(cachedPerfil.rol, router);
  }
  return perfilService.asegurarPerfil().then(
    (perfil) => {
      if (perfil && perfil.rol && perfil.rol.toString() !== 'PENDIENTE') {
        return getRedirectTree(perfil.rol, router);
      }
      return router.createUrlTree(['/']);
    },
    () => {
      return router.createUrlTree(['/']);
    }
  );
};
