import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { FavoritosService } from './favoritos.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Producto } from '../../buffet/models/producto.model';
import { Perfil } from '../../../data-access/models/perfil.model';

describe('FavoritosService', () => {
  let service: FavoritosService;
  let httpMock: HttpTestingController;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;

  const uuidAlumno = '12345678-1234-1234-1234-1234567890ab';
  const uuidProducto = 'abcdefab-abcd-abcd-abcd-abcdefabcdef';

  const mockProductDTO = {
    id: uuidProducto,
    nombre: 'Tostado de Jamón y Queso',
    descripcion: 'Tostado clásico',
    precio: 1500,
    stockActual: 5,
    categoria: { id: 'comidas', descripcion: 'Comidas' },
    clasificacionesSalud: []
  };

  const mockProducto: Producto = {
    id: uuidProducto,
    nombre: 'Tostado de Jamón y Queso',
    descripcion: 'Tostado clásico',
    precio: 1500,
    categoria: { id: 'comidas', descripcion: 'Comidas' },
    clasificacionesSalud: [],
    imagen: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    estadoStock: 'DISPONIBLE'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj<PerfilService>('PerfilService', ['getPerfil', 'obtenerAlumnoId']);

    TestBed.configureTestingModule({
      providers: [
        FavoritosService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: spy }
      ],
    });

    service = TestBed.inject(FavoritosService);
    httpMock = TestBed.inject(HttpTestingController);
    perfilServiceSpy = TestBed.inject(PerfilService) as jasmine.SpyObj<PerfilService>;

    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('getPath', () => {
    it('debería usar la ruta de usuarios si el perfil coincide con el alumno actual', () => {
      const mockPerfil: Perfil = {
        id: uuidAlumno,
        email: 'alumno@recred.com',
        nombre: 'Julián',
        apellido: 'García',
        rol: 'ALUMNO',
      };
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfil);

      service.getFavoritos(uuidAlumno).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${uuidAlumno}/preferencias/favoritos`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('debería usar la ruta de alumnos si el perfil no coincide o no es rol ALUMNO', () => {
      const mockPerfil: Perfil = {
        id: 'tutor-123',
        email: 'tutor@recred.com',
        nombre: 'Martín',
        apellido: 'García',
        rol: 'PADRE',
      };
      perfilServiceSpy.getPerfil.and.returnValue(mockPerfil);

      service.getFavoritos(uuidAlumno).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuidAlumno}/preferencias/favoritos`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getFavoritos', () => {
    it('debería retornar desde localStorage si el alumnoId no es un UUID válido', (done) => {
      const key = 'recred.favoritos.julian-garcia';
      localStorage.setItem(key, JSON.stringify([mockProducto]));

      service.getFavoritos('julian-garcia').subscribe({
        next: (favoritos) => {
          expect(favoritos).toEqual([mockProducto]);
          done();
        }
      });
    });

    it('debería hacer un request GET y retornar los productos mapeados si el alumnoId es UUID', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);

      service.getFavoritos(uuidAlumno).subscribe({
        next: (favoritos) => {
          expect(favoritos.length).toBe(1);
          expect(favoritos[0].id).toBe(uuidProducto);
          expect(favoritos[0].nombre).toBe('Tostado de Jamón y Queso');
          expect(favoritos[0].estadoStock).toBe('DISPONIBLE');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuidAlumno}/preferencias/favoritos`);
      expect(req.request.method).toBe('GET');
      req.flush([mockProductDTO]);
    });

    it('debería caer en localStorage si el request GET al backend falla', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);
      const key = `recred.favoritos.${uuidAlumno}`;
      localStorage.setItem(key, JSON.stringify([mockProducto]));

      service.getFavoritos(uuidAlumno).subscribe({
        next: (favoritos) => {
          expect(favoritos).toEqual([mockProducto]);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuidAlumno}/preferencias/favoritos`);
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('agregarFavorito', () => {
    it('debería guardar en localStorage si el alumnoId no es UUID', (done) => {
      service.agregarFavorito('julian-garcia', mockProducto).subscribe({
        next: () => {
          const key = 'recred.favoritos.julian-garcia';
          const stored = JSON.parse(localStorage.getItem(key) || '[]');
          expect(stored).toEqual([mockProducto]);
          done();
        }
      });
    });

    it('debería enviar un request POST al backend si alumnoId y productoId son UUIDs', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);

      service.agregarFavorito(uuidAlumno, mockProducto).subscribe({
        next: () => {
          const key = `recred.favoritos.${uuidAlumno}`;
          expect(localStorage.getItem(key)).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuidAlumno}/preferencias/favoritos/${uuidProducto}`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('debería guardar en localStorage si el request POST al backend falla', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);

      service.agregarFavorito(uuidAlumno, mockProducto).subscribe({
        next: () => {
          const key = `recred.favoritos.${uuidAlumno}`;
          const stored = JSON.parse(localStorage.getItem(key) || '[]');
          expect(stored).toEqual([mockProducto]);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuidAlumno}/preferencias/favoritos/${uuidProducto}`);
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('removerFavorito', () => {
    it('debería eliminar de localStorage si el alumnoId no es UUID', (done) => {
      const key = 'recred.favoritos.julian-garcia';
      localStorage.setItem(key, JSON.stringify([mockProducto]));

      service.removerFavorito('julian-garcia', uuidProducto).subscribe({
        next: () => {
          const stored = JSON.parse(localStorage.getItem(key) || '[]');
          expect(stored.length).toBe(0);
          done();
        }
      });
    });

    it('debería enviar un request DELETE al backend si alumnoId y productoId son UUIDs', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);

      service.removerFavorito(uuidAlumno, uuidProducto).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuidAlumno}/preferencias/favoritos/${uuidProducto}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('debería remover de localStorage si el request DELETE al backend falla', (done) => {
      perfilServiceSpy.getPerfil.and.returnValue(null);
      const key = `recred.favoritos.${uuidAlumno}`;
      localStorage.setItem(key, JSON.stringify([mockProducto]));

      service.removerFavorito(uuidAlumno, uuidProducto).subscribe({
        next: () => {
          const stored = JSON.parse(localStorage.getItem(key) || '[]');
          expect(stored.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuidAlumno}/preferencias/favoritos/${uuidProducto}`);
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });
});
