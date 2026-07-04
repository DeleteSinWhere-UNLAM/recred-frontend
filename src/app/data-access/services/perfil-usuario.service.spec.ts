import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PerfilUsuario } from '../models/perfil-usuario.model';
import { PerfilService } from './perfil.service';
import { PerfilUsuarioService } from './perfil-usuario.service';

describe('PerfilUsuarioService', () => {
  let service: PerfilUsuarioService;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

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

  it('obtenerUsuarioLogueado hace GET /users/me', async () => {
    const promesa = service.obtenerUsuarioLogueado();
    const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);

    expect(req.request.method).toBe('GET');
    req.flush({ id: 'u1', email: 'a@b.com' });

    const usuario = await promesa;
    expect(usuario.id).toBe('u1');
  });

  it('obtenerPerfil hace GET /users/me/profile y sincroniza con PerfilService', async () => {
    const perfil = { id: 'p1', firstName: 'Ana' } as unknown as PerfilUsuario;

    const promesa = service.obtenerPerfil();
    httpMock.expectOne(`${environment.apiUrl}/users/me/profile`).flush(perfil);

    expect(await promesa).toEqual(perfil);
    expect(servicioPerfil.actualizarDatosUsuario).toHaveBeenCalledWith(perfil);
  });

  it('actualizarPerfil hace PATCH y actualiza los datos del PerfilService', async () => {
    const cambios = { firstName: 'Nombre' };
    const perfil = { id: 'p1', firstName: 'Nombre' } as unknown as PerfilUsuario;

    const promesa = service.actualizarPerfil(cambios);
    const req = httpMock.expectOne(`${environment.apiUrl}/users/me/profile`);

    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(cambios);
    req.flush(perfil);

    await promesa;
    expect(servicioPerfil.actualizarDatosUsuario).toHaveBeenCalledWith(perfil);
  });

  it('subirFotoPerfil hace POST /users/me/profile/foto con FormData y sincroniza', async () => {
    const archivo = new File([''], 'foto.jpg', { type: 'image/jpeg' });
    const perfil = { id: 'p1', urlFotoPerfil: 'https://cdn/foto.jpg' } as unknown as PerfilUsuario;

    const promesa = service.subirFotoPerfil(archivo);
    const req = httpMock.expectOne(`${environment.apiUrl}/users/me/profile/foto`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    const formData = req.request.body as FormData;
    expect(formData.get('foto')).toBe(archivo);
    req.flush(perfil);

    expect(await promesa).toEqual(perfil);
    expect(servicioPerfil.actualizarDatosUsuario).toHaveBeenCalledWith(perfil);
  });
});
