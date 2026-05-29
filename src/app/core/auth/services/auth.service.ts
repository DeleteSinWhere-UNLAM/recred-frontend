import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { CredencialesLogin } from '../login/models/credenciales-login.model';
import { ConfirmacionRecuperacion } from '../recuperar-password/models/confirmacion-recuperacion.model';
import { SolicitudRecuperacion } from '../recuperar-password/models/solicitud-recuperacion.model';
import { DatosRegistro } from '../registro/models/datos-registro.model';

export interface ResultadoLogin {
  readonly exito: boolean;
}

export interface ResultadoRegistro {
  readonly exito: boolean;
}

export interface ResultadoRecuperacion {
  readonly exito: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(credenciales: CredencialesLogin): Observable<ResultadoLogin> {
    const exito =
      credenciales.email.trim().length > 0 &&
      credenciales.password.length > 0;
    return of({ exito }).pipe(delay(500));
  }

  registrar(datos: DatosRegistro): Observable<ResultadoRegistro> {
    const exito =
      datos.email.trim().length > 0 &&
      datos.password.length > 0 &&
      datos.nombreCompleto.trim().length > 0;
    return of({ exito }).pipe(delay(500));
  }

  enviarCodigoRecuperacion(
    solicitud: SolicitudRecuperacion,
  ): Observable<ResultadoRecuperacion> {
    const exito = solicitud.email.trim().length > 0;
    return of({ exito }).pipe(delay(500));
  }

  confirmarNuevaPassword(
    confirmacion: ConfirmacionRecuperacion,
  ): Observable<ResultadoRecuperacion> {
    const exito =
      confirmacion.email.trim().length > 0 &&
      /^\d{6}$/.test(confirmacion.codigo) &&
      confirmacion.nuevaPassword.length >= 6;
    return of({ exito }).pipe(delay(500));
  }
}
