import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {
  PerfilService,
  UsuarioSinPerfilError,
} from '../../../data-access/services/perfil.service';
import { AuthSessionService } from '../services/auth-session.service';

async function resolverAutenticacion(
  state: RouterStateSnapshot,
): Promise<boolean | UrlTree> {
  const router = inject(Router);
  const authSessionService = inject(AuthSessionService);
  const perfilService = inject(PerfilService);

  const session = await authSessionService.esperarSesionAutenticada({
    reintentos: 20,
    intervaloMs: 250,
  });

  if (!session) {
    return router.createUrlTree(['/']);
  }

  try {
    await perfilService.asegurarPerfil();
    return true;
  } catch (err) {
    if (err instanceof UsuarioSinPerfilError) {
      return state.url === '/seleccion-tipo-cuenta'
        ? true
        : router.createUrlTree(['/seleccion-tipo-cuenta']);
    }

    return router.createUrlTree(['/']);
  }
}

export const authGuard: CanActivateFn = (_route, state) =>
  resolverAutenticacion(state);

export const authChildGuard: CanActivateChildFn = (_route, state) =>
  resolverAutenticacion(state);
