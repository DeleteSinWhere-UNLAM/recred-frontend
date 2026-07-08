import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from '../../core/auth/services/auth-session.service';
import { Perfil, RolUsuario } from '../models/perfil.model';

const PERFIL_STORAGE_KEY = 'recred.perfil';

export class UsuarioSinPerfilError extends Error {
  constructor() {
    super(
      'El usuario está autenticado en Cognito pero no tiene perfil en el back',
    );
    this.name = 'UsuarioSinPerfilError';
  }
}

interface SyncPerfilRequest {
  readonly email?: string;
  readonly nombre?: string;
  readonly apellido?: string;
}

interface DatosUsuarioActualizados {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly role?: RolUsuario;
  readonly phone?: string | null;
  readonly documentNumber?: string | null;
  readonly urlFotoPerfil?: string | null;
  readonly fechaVencimientoPlan?: string | null;
  readonly colegioId?: string | null;
  readonly schoolId?: string | null;
  readonly estadoLicenciaColegio?: string | null;
  readonly fechaVencimientoLicenciaColegio?: string | null;
  readonly fechaVencimientoLicencia?: string | null;
  readonly fechaVencimientoSuscripcionColegio?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);

  private readonly perfilState = signal<Perfil | null>(this.leerDeStorage());
  private syncPerfilEnCurso: Promise<Perfil> | null = null;
  private versionPerfil = 0;

  readonly perfil: Signal<Perfil | null> = this.perfilState.asReadonly();
  readonly rol: Signal<RolUsuario | null> = computed(
    () => this.perfilState()?.rol ?? null,
  );
  readonly esPlanGratuito: Signal<boolean> = computed(
    () => {
      const plan = this.perfilState()?.plan?.toUpperCase();
      return plan !== 'INTERMEDIO' && plan !== 'AVANZADO';
    },
  );

  async cargarPerfil(): Promise<Perfil> {
    if (this.syncPerfilEnCurso) {
      return this.syncPerfilEnCurso;
    }

    const versionSolicitud = this.versionPerfil;
    const syncPromise = this.sincronizarPerfil(versionSolicitud);
    this.syncPerfilEnCurso = syncPromise;

    syncPromise.then(
      () => this.limpiarSyncEnCurso(syncPromise),
      () => this.limpiarSyncEnCurso(syncPromise),
    );

    return syncPromise;
  }

  async asegurarPerfil(): Promise<Perfil> {
    const perfilActual = this.perfilState();

    if (this.esPerfilActivo(perfilActual)) {
      return perfilActual;
    }

    return this.cargarPerfil();
  }

  getPerfil(): Perfil | null {
    return this.perfilState();
  }

  actualizarDatosUsuario(datos: DatosUsuarioActualizados): void {
    const perfil = this.perfilState();
    if (!perfil) return;

    const actualizado: Perfil = {
      ...perfil,
      email: datos.email ?? perfil.email,
      nombre: datos.firstName ?? perfil.nombre,
      apellido: datos.lastName ?? perfil.apellido,
      rol: datos.role ?? perfil.rol,
      phone: datos.phone ?? perfil.phone,
      documentNumber: datos.documentNumber ?? perfil.documentNumber,
      urlFotoPerfil: datos.urlFotoPerfil ?? perfil.urlFotoPerfil,
      colegioId: datos.colegioId ?? perfil.colegioId,
      schoolId: datos.schoolId ?? perfil.schoolId,
      fechaVencimientoPlan:
        datos.fechaVencimientoPlan !== undefined
          ? datos.fechaVencimientoPlan
          : perfil.fechaVencimientoPlan,
      estadoLicenciaColegio:
        datos.estadoLicenciaColegio !== undefined
          ? datos.estadoLicenciaColegio
          : perfil.estadoLicenciaColegio,
      fechaVencimientoLicenciaColegio:
        datos.fechaVencimientoLicenciaColegio !== undefined
          ? datos.fechaVencimientoLicenciaColegio
          : perfil.fechaVencimientoLicenciaColegio,
      fechaVencimientoLicencia:
        datos.fechaVencimientoLicencia !== undefined
          ? datos.fechaVencimientoLicencia
          : perfil.fechaVencimientoLicencia,
      fechaVencimientoSuscripcionColegio:
        datos.fechaVencimientoSuscripcionColegio !== undefined
          ? datos.fechaVencimientoSuscripcionColegio
          : perfil.fechaVencimientoSuscripcionColegio,
    };

    this.perfilState.set(actualizado);
    this.guardarEnStorage(actualizado);
  }

  obtenerBuffetId(): string | null {
    const perfil = this.perfilState();
    if (!perfil) return null;

    const candidatos = [
      perfil.buffetId,
      perfil.buffet?.id,
      perfil.buffets?.[0]?.id,
      perfil.comercioId,
      perfil.comercio?.id,
      perfil.kioscoId,
      perfil.kiosco?.id,
    ];

    return (
      candidatos.find(
        (valor): valor is string =>
          typeof valor === 'string' && valor.trim().length > 0,
      ) ?? null
    );
  }

  obtenerAlumnoId(): string | null {
    const perfil = this.perfilState();
    if (!perfil) return null;

    const candidatos = [
      perfil.alumnoId,
      perfil.alumno?.id,
      perfil.alumnoEntity?.id,
      perfil.studentId,
      perfil.student?.id,
      perfil.id,
    ];

    return (
      candidatos.find(
        (valor): valor is string =>
          typeof valor === 'string' && valor.trim().length > 0,
      ) ?? null
    );
  }

  limpiar(): void {
    this.versionPerfil++;
    this.syncPerfilEnCurso = null;
    this.perfilState.set(null);
    localStorage.removeItem(PERFIL_STORAGE_KEY);
    localStorage.removeItem('recreopago_homeUrl');
    localStorage.removeItem('recreopago_nombreNavbar');
  }

  private async sincronizarPerfil(versionSolicitud: number): Promise<Perfil> {
    try {
      const syncRequest = await this.armarSyncRequest();
      const perfil = await firstValueFrom(
        this.http.post<Perfil>(
          `${environment.apiUrl}/usuarios/sync`,
          syncRequest,
        ),
      );

      if (!perfil.rol || perfil.rol.toString() === 'PENDIENTE') {
        throw new UsuarioSinPerfilError();
      }

      if (versionSolicitud === this.versionPerfil) {
        this.perfilState.set(perfil);
        this.guardarEnStorage(perfil);
      }

      return perfil;
    } catch (err) {
      if (err instanceof UsuarioSinPerfilError) {
        throw err;
      }
      console.error('Error al sincronizar el perfil:', err);
      throw err;
    }
  }

  private leerDeStorage(): Perfil | null {
    const raw = localStorage.getItem(PERFIL_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Perfil;
    } catch {
      localStorage.removeItem(PERFIL_STORAGE_KEY);
      return null;
    }
  }

  private guardarEnStorage(perfil: Perfil): void {
    localStorage.setItem(PERFIL_STORAGE_KEY, JSON.stringify(perfil));
  }

  private esPerfilActivo(perfil: Perfil | null): perfil is Perfil {
    return !!perfil?.rol && perfil.rol.toString() !== 'PENDIENTE';
  }

  private limpiarSyncEnCurso(syncPromise: Promise<Perfil>): void {
    if (this.syncPerfilEnCurso === syncPromise) {
      this.syncPerfilEnCurso = null;
    }
  }

  private async armarSyncRequest(): Promise<SyncPerfilRequest> {
    const attrs = await this.authSessionService.obtenerAtributosUsuario();
    return {
      email: attrs.email,
      nombre: attrs.nombre,
      apellido: attrs.apellido,
    };
  }
}
