import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Producto } from '../../buffet/models/producto.model';
import {
  ID_ALUMNO_NO_UUID,
  ProductDTOMother,
  ProductoFavoritoMother,
  UUID_ALUMNO,
  UUID_PRODUCTO,
} from '../favoritos.mother';
import { FavoritosService } from './favoritos.service';

describe('FavoritosService', () => {
  let service: FavoritosService;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
      'obtenerAlumnoId',
    ]);
    servicioPerfil.getPerfil.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        FavoritosService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });

    service = TestBed.inject(FavoritosService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('getPath (segun perfil)', () => {
    it('dado un perfil ALUMNO con mismo id, cuando pido favoritos por UUID, deberia pegarle a /usuarios/{id}/preferencias/favoritos', async () => {
      givenPerfilAlumno(UUID_ALUMNO);

      const promesa = firstValueFrom(service.getFavoritos(UUID_ALUMNO));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/usuarios/${UUID_ALUMNO}/preferencias/favoritos`,
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
      await promesa;
    });

    it('dado un perfil TUTOR, cuando pido favoritos, deberia pegarle a /alumnos/{id}/preferencias/favoritos', async () => {
      givenPerfilTutor();

      const promesa = firstValueFrom(service.getFavoritos(UUID_ALUMNO));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos`,
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
      await promesa;
    });
  });

  describe('getFavoritos', () => {
    it('dado un alumnoId que no es UUID, cuando pido favoritos, deberia leerlos de localStorage sin llamar al back', async () => {
      givenFavoritosEnLocalStorage(ID_ALUMNO_NO_UUID, [ProductoFavoritoMother.crear()]);

      const favoritos = await firstValueFrom(service.getFavoritos(ID_ALUMNO_NO_UUID));

      expect(favoritos.length).toBe(1);
      expect(favoritos[0].id).toBe(UUID_PRODUCTO);
      httpMock.expectNone(
        `${environment.apiUrl}/alumnos/${ID_ALUMNO_NO_UUID}/preferencias/favoritos`,
      );
    });

    it('dado un alumnoId UUID, cuando el back responde, deberia mapear cada DTO a Producto con estadoStock derivado del stockActual', async () => {
      const promesa = firstValueFrom(service.getFavoritos(UUID_ALUMNO));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos`,
      );
      req.flush([
        ProductDTOMother.crear(),
        { ...ProductDTOMother.crearSinStock(), id: 'prod-2' },
      ]);

      const favoritos = await promesa;
      expect(favoritos.length).toBe(2);
      expect(favoritos[0].estadoStock).toBe('DISPONIBLE');
      expect(favoritos[1].estadoStock).toBe('SIN_STOCK');
    });

    it('dado que el back falla, cuando pido favoritos, deberia caer en localStorage', async () => {
      spyOn(console, 'warn');
      givenFavoritosEnLocalStorage(UUID_ALUMNO, [ProductoFavoritoMother.crear()]);

      const promesa = firstValueFrom(service.getFavoritos(UUID_ALUMNO));
      httpMock
        .expectOne(`${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos`)
        .flush('error', { status: 500, statusText: 'Server Error' });

      const favoritos = await promesa;
      expect(favoritos.length).toBe(1);
    });
  });

  describe('agregarFavorito', () => {
    it('dado un alumnoId no UUID, cuando agrego, deberia guardarlo en localStorage sin llamar al back', async () => {
      const producto = ProductoFavoritoMother.crear();

      await firstValueFrom(service.agregarFavorito(ID_ALUMNO_NO_UUID, producto));

      const guardado = leerLocalStorage(ID_ALUMNO_NO_UUID);
      expect(guardado).toEqual([producto]);
    });

    it('dado alumnoId y productoId UUIDs, cuando agrego, deberia hacer POST y no tocar localStorage', async () => {
      const producto = ProductoFavoritoMother.crear();

      const promesa = firstValueFrom(service.agregarFavorito(UUID_ALUMNO, producto));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos/${UUID_PRODUCTO}`,
      );
      expect(req.request.method).toBe('POST');
      req.flush({});
      await promesa;

      expect(localStorage.getItem(`recred.favoritos.${UUID_ALUMNO}`)).toBeNull();
    });

    it('dado que el POST falla, cuando agrego, deberia caer en localStorage', async () => {
      spyOn(console, 'warn');
      const producto = ProductoFavoritoMother.crear();

      const promesa = firstValueFrom(service.agregarFavorito(UUID_ALUMNO, producto));
      httpMock
        .expectOne(
          `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos/${UUID_PRODUCTO}`,
        )
        .flush('error', { status: 500, statusText: 'Server Error' });
      await promesa;

      expect(leerLocalStorage(UUID_ALUMNO)).toEqual([producto]);
    });
  });

  describe('removerFavorito', () => {
    it('dado un alumnoId no UUID, cuando remuevo, deberia sacarlo de localStorage sin llamar al back', async () => {
      givenFavoritosEnLocalStorage(ID_ALUMNO_NO_UUID, [ProductoFavoritoMother.crear()]);

      await firstValueFrom(service.removerFavorito(ID_ALUMNO_NO_UUID, UUID_PRODUCTO));

      expect(leerLocalStorage(ID_ALUMNO_NO_UUID)).toEqual([]);
    });

    it('dado alumnoId y productoId UUIDs, cuando remuevo, deberia hacer DELETE', async () => {
      const promesa = firstValueFrom(service.removerFavorito(UUID_ALUMNO, UUID_PRODUCTO));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos/${UUID_PRODUCTO}`,
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({});
      await promesa;
    });

    it('dado que el DELETE falla, cuando remuevo, deberia sacarlo igual de localStorage', async () => {
      spyOn(console, 'warn');
      givenFavoritosEnLocalStorage(UUID_ALUMNO, [ProductoFavoritoMother.crear()]);

      const promesa = firstValueFrom(service.removerFavorito(UUID_ALUMNO, UUID_PRODUCTO));
      httpMock
        .expectOne(
          `${environment.apiUrl}/alumnos/${UUID_ALUMNO}/preferencias/favoritos/${UUID_PRODUCTO}`,
        )
        .flush('error', { status: 500, statusText: 'Server Error' });
      await promesa;

      expect(leerLocalStorage(UUID_ALUMNO)).toEqual([]);
    });
  });

  function givenPerfilAlumno(alumnoId: string): void {
    servicioPerfil.getPerfil.and.returnValue(
      PerfilMother.crear({ id: alumnoId, rol: 'ALUMNO' }),
    );
  }

  function givenPerfilTutor(): void {
    servicioPerfil.getPerfil.and.returnValue(PerfilMother.crearTutor());
  }

  function givenFavoritosEnLocalStorage(alumnoId: string, productos: Producto[]): void {
    localStorage.setItem(`recred.favoritos.${alumnoId}`, JSON.stringify(productos));
  }

  function leerLocalStorage(alumnoId: string): Producto[] {
    const raw = localStorage.getItem(`recred.favoritos.${alumnoId}`);
    return raw ? JSON.parse(raw) : [];
  }
});
