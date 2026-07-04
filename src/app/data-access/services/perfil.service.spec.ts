import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from '../../core/auth/services/auth-session.service';
import { environment } from '../../../environments/environment';
import { Perfil } from '../models/perfil.model';
import { PerfilMother } from './alumno.mother';
import { PerfilService, UsuarioSinPerfilError } from './perfil.service';

describe('PerfilService', () => {
  const URL_SYNC = `${environment.apiUrl}/usuarios/sync`;

  let httpMock: HttpTestingController;
  let servicioAuth: jasmine.SpyObj<AuthSessionService>;

  function crearService(): PerfilService {
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

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    if (httpMock) httpMock.verify();
    localStorage.clear();
  });

  describe('estado inicial', () => {
    it('dado sin localStorage previo, deberia arrancar en null', () => {
      const service = crearService();

      expect(service.getPerfil()).toBeNull();
      expect(service.perfil()).toBeNull();
      expect(service.rol()).toBeNull();
    });

    it('dado un perfil valido en localStorage, deberia leerlo al arrancar', () => {
      const perfil = PerfilMother.crear({ id: 'p1', rol: 'PADRE' });
      localStorage.setItem('recred.perfil', JSON.stringify(perfil));

      const service = crearService();

      expect(service.getPerfil()).toEqual(perfil);
      expect(service.rol()).toBe('PADRE');
    });

    it('dado un JSON corrupto en localStorage, deberia limpiarlo y arrancar en null', () => {
      localStorage.setItem('recred.perfil', '{corrupto');

      const service = crearService();

      expect(service.getPerfil()).toBeNull();
      expect(localStorage.getItem('recred.perfil')).toBeNull();
    });
  });

  describe('esPlanGratuito', () => {
    it('dado sin perfil, deberia ser true', () => {
      const service = crearService();

      expect(service.esPlanGratuito()).toBeTrue();
    });

    it('dado perfil con plan PREMIUM, deberia ser false', () => {
      localStorage.setItem('recred.perfil', JSON.stringify(PerfilMother.crear({ plan: 'PREMIUM' })));

      const service = crearService();

      expect(service.esPlanGratuito()).toBeFalse();
    });
  });

  describe('cargarPerfil', () => {
    it('dado sync exitoso, deberia setear el perfil y persistirlo', async () => {
      const service = crearService();
      const perfil = PerfilMother.crear({ id: 'p1', rol: 'ALUMNO' });

      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      const req = httpMock.expectOne(URL_SYNC);
      expect(req.request.method).toBe('POST');
      req.flush(perfil);

      const resultado = await promesa;
      expect(resultado).toEqual(perfil);
      expect(service.getPerfil()).toEqual(perfil);
      expect(JSON.parse(localStorage.getItem('recred.perfil')!)).toEqual(perfil);
    });

    it('dado rol PENDIENTE del back, deberia tirar UsuarioSinPerfilError', async () => {
      const service = crearService();

      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush({ id: 'p1', rol: 'PENDIENTE' });

      await expectAsync(promesa).toBeRejectedWithError(/perfil en el back/);
    });

    it('dado el back sin rol, deberia tirar UsuarioSinPerfilError', async () => {
      const service = crearService();

      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush({ id: 'p1' });

      await expectAsync(promesa).toBeRejected();
    });

    it('dado un error del back distinto, deberia loguear y propagar', async () => {
      spyOn(console, 'error');
      const service = crearService();

      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
      expect(console.error).toHaveBeenCalled();
    });

    it('dado dos llamadas simultaneas, deberia reutilizar la misma promesa (no hacer 2 requests)', async () => {
      const service = crearService();
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
    it('dado un perfil activo cargado, deberia devolverlo sin llamar al back', async () => {
      const perfil = PerfilMother.crear({ rol: 'PADRE' });
      localStorage.setItem('recred.perfil', JSON.stringify(perfil));

      const service = crearService();
      const resultado = await service.asegurarPerfil();

      expect(resultado).toEqual(perfil);
    });

    it('dado sin perfil, deberia disparar cargarPerfil', async () => {
      const service = crearService();
      const perfil = PerfilMother.crear();

      const promesa = service.asegurarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);

      expect(await promesa).toEqual(perfil);
    });
  });

  describe('actualizarDatosUsuario', () => {
    it('dado sin perfil cargado, no deberia hacer nada', () => {
      const service = crearService();

      service.actualizarDatosUsuario({ firstName: 'X' });

      expect(service.getPerfil()).toBeNull();
    });

    it('dado un perfil cargado y datos parciales, deberia mergear preservando lo existente', async () => {
      const service = crearService();
      const perfil = PerfilMother.crear({ id: 'p1' });
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

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
  });

  describe('obtenerBuffetId', () => {
    it('dado sin perfil, deberia devolver null', () => {
      const service = crearService();

      expect(service.obtenerBuffetId()).toBeNull();
    });

    it('dado un perfil con buffetId directo, deberia devolverlo', async () => {
      const service = crearService();
      const perfil = { ...PerfilMother.crear(), buffetId: 'buffet-1' } as Perfil;
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerBuffetId()).toBe('buffet-1');
    });

    it('dado un perfil con buffet.id, deberia devolverlo', async () => {
      const service = crearService();
      const perfil = { ...PerfilMother.crear(), buffet: { id: 'buffet-obj' } } as Perfil;
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerBuffetId()).toBe('buffet-obj');
    });

    it('dado un perfil con buffets[0].id, deberia devolverlo', async () => {
      const service = crearService();
      const perfil = { ...PerfilMother.crear(), buffets: [{ id: 'primer-buffet' }] } as Perfil;
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerBuffetId()).toBe('primer-buffet');
    });

    it('dado un perfil solo con comercioId, deberia devolverlo como buffetId', async () => {
      const service = crearService();
      const perfil = { ...PerfilMother.crear(), comercioId: 'comercio-1' } as Perfil;
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerBuffetId()).toBe('comercio-1');
    });

    it('dado un perfil sin ningun campo de buffet, deberia devolver null', async () => {
      const service = crearService();
      const perfil = PerfilMother.crear();
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerBuffetId()).toBeNull();
    });
  });

  describe('obtenerAlumnoId', () => {
    it('dado sin perfil, deberia devolver null', () => {
      const service = crearService();

      expect(service.obtenerAlumnoId()).toBeNull();
    });

    it('dado un perfil con alumnoId directo, deberia devolverlo', async () => {
      const service = crearService();
      const perfil = { ...PerfilMother.crear(), alumnoId: 'alumno-1' } as Perfil;
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerAlumnoId()).toBe('alumno-1');
    });

    it('dado un perfil con studentId, deberia devolverlo', async () => {
      const service = crearService();
      const perfil = { ...PerfilMother.crear(), studentId: 'student-1' } as Perfil;
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerAlumnoId()).toBe('student-1');
    });

    it('dado un perfil sin campos especificos, deberia caer al perfil.id', async () => {
      const service = crearService();
      const perfil = { ...PerfilMother.crear(), id: 'fallback-id' } as Perfil;
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;

      expect(service.obtenerAlumnoId()).toBe('fallback-id');
    });
  });

  describe('limpiar', () => {
    it('deberia borrar el perfil, homeUrl y nombreNavbar del localStorage', async () => {
      const service = crearService();
      const perfil = PerfilMother.crear();
      const promesa = service.cargarPerfil();
      await flushMicrotasks();
      httpMock.expectOne(URL_SYNC).flush(perfil);
      await promesa;
      localStorage.setItem('recreopago_homeUrl', '/tutor');
      localStorage.setItem('recreopago_nombreNavbar', 'Ana');

      service.limpiar();

      expect(service.getPerfil()).toBeNull();
      expect(localStorage.getItem('recred.perfil')).toBeNull();
      expect(localStorage.getItem('recreopago_homeUrl')).toBeNull();
      expect(localStorage.getItem('recreopago_nombreNavbar')).toBeNull();
    });
  });

  it('UsuarioSinPerfilError deberia tener el nombre y mensaje adecuados', () => {
    const err = new UsuarioSinPerfilError();

    expect(err.name).toBe('UsuarioSinPerfilError');
    expect(err.message).toContain('perfil');
  });

  async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }
});
