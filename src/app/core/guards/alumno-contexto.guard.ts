import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AlumnoContextoService } from '../services/alumno-contexto.service';

/**
 * Guard funcional que protege las rutas que requieren contexto de alumno.
 * Si no hay alumnoId activo en AlumnoContextoService, redirige a /tutor.
 */
export const alumnoContextoGuard: CanActivateFn = () => {
  const contexto = inject(AlumnoContextoService);
  const router = inject(Router);

  if (contexto.alumnoId()) {
    return true;
  }

  return router.createUrlTree(['/tutor']);
};
