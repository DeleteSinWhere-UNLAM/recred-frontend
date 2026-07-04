import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSessionService = inject(AuthSessionService);

  const esApiPropia = esUrlDeApiPropia(req.url);
  const esRegistroColegioPublico = req.method === 'POST' && req.url.endsWith('/school-registrations');

  if (!esApiPropia || esRegistroColegioPublico) {
    return next(req);
  }

  return from(
    authSessionService.obtenerAccessTokenParaApi({
      reintentos: 20,
      intervaloMs: 250,
    }),
  ).pipe(
    switchMap((token) => {
      if (!token) {
        console.error('Request protegida sin token disponible:', req.url);
        return throwError(() => new Error('No hay token de Cognito disponible'));
      }

      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status !== 401) {
            return throwError(() => err);
          }

          return from(
            authSessionService.obtenerAccessTokenParaApi({
              forceRefresh: true,
              reintentos: 4,
              intervaloMs: 250,
            }),
          ).pipe(
            switchMap((tokenRefrescado) => {
              if (!tokenRefrescado) {
                return throwError(() => err);
              }

              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${tokenRefrescado}`,
                },
              });

              return next(retryReq);
            }),
          );
        }),
      );
    }),
  );
};

function esUrlDeApiPropia(url: string): boolean {
  try {
    const requestUrl = new URL(url, window.location.origin);
    const apiUrl = new URL(environment.apiUrl, window.location.origin);

    const esDominioApi = requestUrl.origin === apiUrl.origin;
    const esDominioInventario = requestUrl.origin === 'https://18-119-187-167.sslip.io';

    return esDominioApi || esDominioInventario;
  } catch {
    return url.startsWith(environment.apiUrl) || url.startsWith('https://18-119-187-167.sslip.io');
  }
}
