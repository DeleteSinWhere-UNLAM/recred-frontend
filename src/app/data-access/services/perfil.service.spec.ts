import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from '../../core/auth/services/auth-session.service';
import { environment } from '../../../environments/environment';
import { Perfil } from '../models/perfil.model';
import { PerfilMother } from './alumno.mother';
import { PerfilService, UsuarioSinPerfilError } from './perfil.service';

const KEY_PERFIL = 'recred.perfil';
const KEY_HOME = 'recreopago_homeUrl';
const KEY_NAV = 'recreopago_nombreNavbar';

describe('PerfilService', () => {
  const URL_SYNC = `${environment.apiUrl}/usuarios/sync`;

  let httpMock: HttpTestingController;
  let servicioAuth: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    if (httpMock) httpMock.verify();
    localStorage.clear();
  });

  describe('estado inicial', () => {
    it('dado sin localStorage previo, cuando instancio, deberia arrancar en null', () => {
      const service = whenInstancioElService();

      expect(service.getPerfil()).toBeNull();
      expect(service.perfil()).toBeNull();
      expect(service.rol()).toBeNull();
    });

    it('dado un perfil valido en localStorage, cuando instancio, deberia leerlo al arrancar', () => {
      const perfil = PerfilMother.crear({ id: 'p1', rol: 'PADRE' });
      givenPerfilEnStorage(perfil);

      const service = whenInstancioElService();

      expect(service.getPerfil()).toEqual(perfil);
      expect(service.rol()).toBe('PADRE');
    });

    it('dado un JSON corrupto en localStorage, cuando instancio, deberia limpiarlo y arrancar en null', () => {
      localStorage.setItem(KEY_PERFIL, '{corrupto');

      const service = whenInstancioElService();

      expect(service.getPerfil()).toBeNull();
      expect(localStorage.getItem(KEY_PERFIL)).toBeNull();
    });
  });

  describe('esPlanGratuito', () => {
    it('dado sin perfil, cuando consulto esPlanGratuito, deberia ser true', () => {
      const service = whenInstancioElService();

      expect(service.esPlanGratuito()).toBeTrue();
    });

    it('dado perfil con plan INTERMEDIO, cuando consulto esPlanGratuito, deberia ser false', () => {
      givenPerfilEnStorage(PerfilMother.crear({ plan: 'INTERMEDIO' }));

      const service = whenInstancioElService();

      expect(service.esPlanGratuito()).toBeFalse();
    });

    it('dado perfil con plan AVANZADO, cuando consulto esPlanGratuito, deberia ser false', () => {
      givenPerfilEnStorage(PerfilMother.crear({ plan: 'AVANZADO' }));

      const service = whenInstancioElService();

      expect(service.esPlanGratuito()).toBeFalse();
    });
  });

  describe('cargarPerfil', () => {
    it('dado sync exitoso, cuando cargo el perfil, deberia setearlo y persistirlo', async () => {
      const service = whenInstancioElService();
      const perfil = PerfilMother.crear({ id: 'p1', rol: 'ALUMNO' });

      const resultado = await whenCargoElPerfilYElBackDevuelve(service, perfil);

      expect(resultado).toEqual(perfil);
      expect(service.getPerfil()).toEqual(perfil);
      expect(JSON.parse(localStorage.getItem(KEY_PERFIL)!)).toEqual(perfil);
    });

    it('dado rol PENDIENTE del back, cuando cargo el perfil, deberia tirar UsuarioSinPerfilError', async () => {
      const service = whenInstancioElService();

      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush({ id: 'p1', rol: 'PENDIENTE' });

      await expectAsync(promesa).toBeRejectedWithError(/perfil en el back/);
    });

    it('dado el back sin rol, cuando cargo el perfil, deberia tirar UsuarioSinPerfilError', async () => {
      const service = whenInstancioElService();

      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush({ id: 'p1' });

      await expectAsync(promesa).toBeRejected();
    });

    it('dado un error del back distinto, cuando cargo el perfil, deberia loguear y propagar', async () => {
      spyOn(console, 'error');
      const service = whenInstancioElService();

      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
      expect(console.error).toHaveBeenCalled();
    });

    it('dado dos llamadas simultaneas, cuando cargo el perfil, deberia reutilizar la misma promesa (no hacer 2 requests)', async () => {
      const service = whenInstancioElService();
      const perfil = PerfilMother.crear();

      const p1 = service.cargarPerfil();
      const p2 = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toEqual(r2);
    });
  });

  describe('asegurarPerfil', () => {
    it('dado un perfil activo cargado, cuando aseguro, deberia devolverlo sin llamar al back', async () => {
      const perfil = PerfilMother.crear({ rol: 'PADRE' });
      givenPerfilEnStorage(perfil);

      const service = whenInstancioElService();
      const resultado = await service.asegurarPerfil();

      expect(resultado).toEqual(perfil);
    });

    it('dado sin perfil, cuando aseguro, deberia disparar cargarPerfil', async () => {
      const service = whenInstancioElService();
      const perfil = PerfilMother.crear();

      const promesa = service.asegurarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);

      expect(await promesa).toEqual(perfil);
    });
  });

  describe('actualizarDatosUsuario', () => {
    it('dado sin perfil cargado, cuando actualizo, no deberia hacer nada', () => {
      const service = whenInstancioElService();

      service.actualizarDatosUsuario({ firstName: 'X' });

      expect(service.getPerfil()).toBeNull();
    });

    it('dado un perfil cargado y datos parciales, cuando actualizo, deberia mergear preservando lo existente', async () => {
      const service = whenInstancioElService();
      const perfil = PerfilMother.crear({ id: 'p1' });
      await whenCargoElPerfilYElBackDevuelve(service, perfil);

      service.actualizarDatosUsuario({
        firstName: 'Nuevo',
        lastName: 'Apellido',
        urlFotoPerfil: 'https://cdn/foto.png',
      });

      const actual = service.getPerfil()!;
      expect(actual.nombre).toBe('Nuevo');
      expect(actual.apellido).toBe('Apellido');
      expect(actual.urlFotoPerfil).toBe('https://cdn/foto.png');
    });

    it('dado fechaVencimientoPlan null, cuando actualizo, deberia limpiar la vigencia previa', async () => {
      const service = whenInstancioElService();
      const perfil = PerfilMother.crear({
        id: 'p1',
        fechaVencimientoPlan: '2026-08-05T22:48:39.49749',
      });
      await whenCargoElPerfilYElBackDevuelve(service, perfil);

      service.actualizarDatosUsuario({ fechaVencimientoPlan: null });

      expect(service.getPerfil()?.fechaVencimientoPlan).toBeNull();
    });
  });

  describe('obtenerBuffetId', () => {
    it('dado sin perfil, cuando pido el buffetId, deberia devolver null', () => {
      const service = whenInstancioElService();

      expect(service.obtenerBuffetId()).toBeNull();
    });

    it('dado un perfil con buffetId directo, cuando pido el buffetId, deberia devolverlo', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, { ...PerfilMother.crear(), buffetId: 'buffet-1' } as Perfil);

      expect(service.obtenerBuffetId()).toBe('buffet-1');
    });

    it('dado un perfil con buffet.id, cuando pido el buffetId, deberia devolverlo', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, { ...PerfilMother.crear(), buffet: { id: 'buffet-obj' } } as Perfil);

      expect(service.obtenerBuffetId()).toBe('buffet-obj');
    });

    it('dado un perfil con buffets[0].id, cuando pido el buffetId, deberia devolverlo', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, { ...PerfilMother.crear(), buffets: [{ id: 'primer-buffet' }] } as Perfil);

      expect(service.obtenerBuffetId()).toBe('primer-buffet');
    });

    it('dado un perfil solo con comercioId, cuando pido el buffetId, deberia devolverlo', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, { ...PerfilMother.crear(), comercioId: 'comercio-1' } as Perfil);

      expect(service.obtenerBuffetId()).toBe('comercio-1');
    });

    it('dado un perfil sin ningun campo de buffet, cuando pido el buffetId, deberia devolver null', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, PerfilMother.crear());

      expect(service.obtenerBuffetId()).toBeNull();
    });
  });

  describe('obtenerAlumnoId', () => {
    it('dado sin perfil, cuando pido el alumnoId, deberia devolver null', () => {
      const service = whenInstancioElService();

      expect(service.obtenerAlumnoId()).toBeNull();
    });

    it('dado un perfil con alumnoId directo, cuando pido el alumnoId, deberia devolverlo', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, { ...PerfilMother.crear(), alumnoId: 'alumno-1' } as Perfil);

      expect(service.obtenerAlumnoId()).toBe('alumno-1');
    });

    it('dado un perfil con studentId, cuando pido el alumnoId, deberia devolverlo', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, { ...PerfilMother.crear(), studentId: 'student-1' } as Perfil);

      expect(service.obtenerAlumnoId()).toBe('student-1');
    });

    it('dado un perfil sin campos especificos, cuando pido el alumnoId, deberia caer al perfil.id', async () => {
      const service = whenInstancioElService();
      await whenCargoElPerfilYElBackDevuelve(service, { ...PerfilMother.crear(), id: 'fallback-id' } as Perfil);

      expect(service.obtenerAlumnoId()).toBe('fallback-id');
    });
  });

  describe('limpiar', () => {
    it('dado un perfil y valores en storage, cuando limpio, deberia borrar perfil, homeUrl y nombreNavbar', async () => {
      const service = whenInstancioElService();
      const perfil = PerfilMother.crear();
      await whenCargoElPerfilYElBackDevuelve(service, perfil);
      localStorage.setItem(KEY_HOME, '/tutor');
      localStorage.setItem(KEY_NAV, 'Ana');

      service.limpiar();

      expect(service.getPerfil()).toBeNull();
      expect(localStorage.getItem(KEY_PERFIL)).toBeNull();
      expect(localStorage.getItem(KEY_HOME)).toBeNull();
      expect(localStorage.getItem(KEY_NAV)).toBeNull();
    });
  });

  it('dado que instancio UsuarioSinPerfilError, deberia tener el nombre y mensaje adecuados', () => {
    const err = new UsuarioSinPerfilError();

    expect(err.name).toBe('UsuarioSinPerfilError');
    expect(err.message).toContain('perfil');
  });

  function givenPerfilEnStorage(perfil: Perfil): void {
    localStorage.setItem(KEY_PERFIL, JSON.stringify(perfil));
  }

  function whenInstancioElService(): PerfilService {
    servicioAuth = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'obtenerAtributosUsuario',
    ]);
    servicioAuth.obtenerAtributosUsuario.and.resolveTo({
      email: 'a@b.com',
      nombre: 'Ana',
      apellido: 'Perez',
    });

    TestBed.configureTestingModule({
      providers: [
        PerfilService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: servicioAuth },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(PerfilService);
  }

  async function whenCargoElPerfilYElBackDevuelve(service: PerfilService, perfil: Perfil): Promise<Perfil> {
    const promesa = service.cargarPerfil();
    await flushMicrotasks();
    httpMock.expectOne(URL_SYNC).flush(perfil);
    return promesa;
  }

  async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }
});
