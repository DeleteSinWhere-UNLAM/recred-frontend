import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PerfilService } from '../../data-access/services/perfil.service';

export const adminGuard: CanActivateFn = () => {
  const perfilService = inject(PerfilService);
  const router = inject(Router);

  const rol = perfilService.rol();
  if (rol === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/']);
};
