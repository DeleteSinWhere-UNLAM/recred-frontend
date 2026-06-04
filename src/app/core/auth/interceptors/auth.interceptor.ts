import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSessionService = inject(AuthSessionService);

  return from(authSessionService.obtenerIdTokenParaApi()).pipe(
    switchMap((token) => {
      if (token) {
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(authReq);
      }
      return next(req);
    }),
  );
};
