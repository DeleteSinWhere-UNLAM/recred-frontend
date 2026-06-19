import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PerfilUsuarioService } from './perfil-usuario.service';
import { PerfilService } from './perfil.service';
import { environment } from '../../../environments/environment';
import { PerfilUsuario, UsuarioLogueado } from '../models/perfil-usuario.model';

describe('PerfilUsuarioService', () => {
  let service: PerfilUsuarioService;
  let httpMock: HttpTestingController;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('PerfilService', ['actualizarDatosUsuario']);

    TestBed.configureTestingModule({
      providers: [
        PerfilUsuarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: spy }
      ]
    });
    service = TestBed.inject(PerfilUsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
    perfilServiceSpy = TestBed.inject(PerfilService) as jasmine.SpyObj<PerfilService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('obtenerUsuarioLogueado', () => {
    it('dado que se llama a obtenerUsuarioLogueado, debería hacer un GET a /users/me', (done) => {
      const mockUsuario = { id: '1', email: 'test@test.com' } as UsuarioLogueado;

      service.obtenerUsuarioLogueado().then(usuario => {
        expect(usuario).toEqual(mockUsuario);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsuario);
    });
  });

  describe('obtenerPerfil', () => {
    it('dado que se llama a obtenerPerfil, debería hacer un GET a /users/me/profile y actualizar datos', (done) => {
      const mockPerfil = { id: '1', firstName: 'Juan' } as PerfilUsuario;

      service.obtenerPerfil().then(perfil => {
        expect(perfil).toEqual(mockPerfil);
        expect(perfilServiceSpy.actualizarDatosUsuario).toHaveBeenCalledWith(mockPerfil);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/me/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPerfil);
    });
  });

  describe('actualizarPerfil', () => {
    it('dado que se llama a actualizarPerfil, debería hacer un PATCH y actualizar datos', (done) => {
      const cambios = { firstName: 'Pedro' };
      const mockPerfil = { id: '1', firstName: 'Pedro' } as PerfilUsuario;

      service.actualizarPerfil(cambios).then(perfil => {
        expect(perfil).toEqual(mockPerfil);
        expect(perfilServiceSpy.actualizarDatosUsuario).toHaveBeenCalledWith(mockPerfil);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/me/profile`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(cambios);
      req.flush(mockPerfil);
    });
  });

  describe('subirFotoPerfil', () => {
    it('dado que se llama a subirFotoPerfil, debería hacer un POST a /users/me/profile/foto y actualizar datos', (done) => {
      const archivo = new File([''], 'foto.png', { type: 'image/png' });
      const mockPerfil = { id: '1', urlFotoPerfil: 'url' } as unknown as PerfilUsuario;

      service.subirFotoPerfil(archivo).then(perfil => {
        expect(perfil).toEqual(mockPerfil);
        expect(perfilServiceSpy.actualizarDatosUsuario).toHaveBeenCalledWith(mockPerfil);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users/me/profile/foto`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).has('foto')).toBeTrue();
      req.flush(mockPerfil);
    });
  });
});
