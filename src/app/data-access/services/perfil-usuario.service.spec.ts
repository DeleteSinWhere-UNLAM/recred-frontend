import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PerfilUsuario, UsuarioLogueado } from '../models/perfil-usuario.model';
import { PerfilService } from './perfil.service';
import { PerfilUsuarioService } from './perfil-usuario.service';

describe('PerfilUsuarioService', () => {
  const URL_USUARIO_LOGUEADO = `${environment.apiUrl}/users/me`;
  const URL_PERFIL = `${environment.apiUrl}/users/me/profile`;
  const URL_FOTO = `${environment.apiUrl}/users/me/profile/foto`;

  let service: PerfilUsuarioService;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  class UsuarioLogueadoMother {
    static crear(override: Partial<UsuarioLogueado> = {}): UsuarioLogueado {
      return { id: 'u1', email: 'a@b.com', ...override } as UsuarioLogueado;
    }
  }

  class PerfilUsuarioMother {
    static crear(override: Partial<PerfilUsuario> = {}): PerfilUsuario {
      return { id: 'p1', firstName: 'Ana', ...override } as PerfilUsuario;
    }
  }

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['actualizarDatosUsuario']);

    TestBed.configureTestingModule({
      providers: [
        PerfilUsuarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });
    service = TestBed.inject(PerfilUsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('dado el service, cuando pido el usuario logueado, deberia hacer GET /users/me', async () => {
    const promesa = service.obtenerUsuarioLogueado();
    const req = httpMock.expectOne(URL_USUARIO_LOGUEADO);

    expect(req.request.method).toBe('GET');
    req.flush(UsuarioLogueadoMother.crear());

    const usuario = await promesa;
    expect(usuario.id).toBe('u1');
  });

  it('dado el service, cuando pido el perfil, deberia hacer GET /users/me/profile y sincronizar con PerfilService', async () => {
    const perfil = PerfilUsuarioMother.crear();

    const promesa = service.obtenerPerfil();
    httpMock.expectOne(URL_PERFIL).flush(perfil);

    expect(await promesa).toEqual(perfil);
    thenSeSincronizoConPerfilService(perfil);
  });

  it('dado unos cambios, cuando actualizo el perfil, deberia hacer PATCH y actualizar el PerfilService', async () => {
    const cambios = { firstName: 'Nombre' };
    const perfil = PerfilUsuarioMother.crear({ firstName: 'Nombre' });

    const promesa = service.actualizarPerfil(cambios);
    const req = httpMock.expectOne(URL_PERFIL);

    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(cambios);
    req.flush(perfil);

    await promesa;
    thenSeSincronizoConPerfilService(perfil);
  });

  it('dado un archivo, cuando subo la foto de perfil, deberia hacer POST con FormData y sincronizar', async () => {
    const archivo = new File([''], 'foto.jpg', { type: 'image/jpeg' });
    const perfil = PerfilUsuarioMother.crear({ urlFotoPerfil: 'https://cdn/foto.jpg' });

    const promesa = service.subirFotoPerfil(archivo);
    const req = httpMock.expectOne(URL_FOTO);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    const formData = req.request.body as FormData;
    expect(formData.get('foto')).toBe(archivo);
    req.flush(perfil);

    expect(await promesa).toEqual(perfil);
    thenSeSincronizoConPerfilService(perfil);
  });

  function thenSeSincronizoConPerfilService(perfil: PerfilUsuario): void {
    expect(servicioPerfil.actualizarDatosUsuario).toHaveBeenCalledWith(perfil);
  }
});
