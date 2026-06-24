import { Injectable, signal } from '@angular/core';

const SESSION_KEY = 'recred_alumno_id';

/**
 * Servicio de contexto compartido que almacena el alumnoId activo
 * entre navegaciones sin exponerlo en la URL (Opción B2 — sessionStorage).
 *
 * - Persiste en sessionStorage → sobrevive F5 dentro de la misma pestaña.
 * - Se borra automáticamente al cerrar la pestaña.
 * - El guard `alumnoContextoGuard` redirige a /tutor si no hay valor.
 */
@Injectable({ providedIn: 'root' })
export class AlumnoContextoService {
  private readonly _alumnoId = signal<string>(
    sessionStorage.getItem(SESSION_KEY) ?? ''
  );

  /** ID del alumno activo. Vacío si no hay contexto. */
  readonly alumnoId = this._alumnoId.asReadonly();

  /** Establece el alumno activo y persiste en sessionStorage. */
  setAlumnoId(id: string): void {
    this._alumnoId.set(id);
    sessionStorage.setItem(SESSION_KEY, id);
  }

  /** Limpia el contexto (útil al hacer logout). */
  limpiar(): void {
    this._alumnoId.set('');
    sessionStorage.removeItem(SESSION_KEY);
  }
}
