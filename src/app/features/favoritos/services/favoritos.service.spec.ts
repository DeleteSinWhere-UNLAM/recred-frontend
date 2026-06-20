import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FavoritosService } from './favoritos.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { environment } from '../../../../environments/environment';
import { Producto } from '../../buffet/models/producto.model';

describe('FavoritosService', () => {
  let service: FavoritosService;
  let httpMock: HttpTestingController;
  let perfilSpy: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    perfilSpy = jasmine.createSpyObj('PerfilService', ['getPerfil']);
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'recred.favoritos.a-invalid') {
        return JSON.stringify([{ id: 'p-invalid', nombre: 'Test Prod' }]);
      }
      return null;
    });
    spyOn(localStorage, 'setItem').and.stub();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FavoritosService,
        { provide: PerfilService, useValue: perfilSpy }
      ]
    });
    service = TestBed.inject(FavoritosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  describe('getPath', () => {
    it('retorna usuarios/id si es ALUMNO', () => {
      perfilSpy.getPerfil.and.returnValue({ rol: 'ALUMNO', id: '123' } as any);
      expect(service['getPath']('123')).toBe('usuarios/123');
    });

    it('retorna alumnos/id si no es ALUMNO o id distinto', () => {
      perfilSpy.getPerfil.and.returnValue({ rol: 'PADRE', id: 'parent-1' } as any);
      expect(service['getPath']('child-1')).toBe('alumnos/child-1');
    });
  });

  describe('getFavoritos', () => {
    it('retorna de localstorage si alumnoId no es uuid', (done) => {
      service.getFavoritos('a-invalid').subscribe(res => {
        expect(res.length).toBe(1);
        expect(res[0].nombre).toBe('Test Prod');
        done();
      });
    });

    it('retorna del backend mapeado correctamente si es uuid valido', () => {
      perfilSpy.getPerfil.and.returnValue({ rol: 'ALUMNO', id: '00000000-0000-0000-0000-000000000000' } as any);
      const uuid = '00000000-0000-0000-0000-000000000000';
      service.getFavoritos(uuid).subscribe(res => {
        expect(res.length).toBe(1);
        expect(res[0].nombre).toBe('Coca Cola');
        expect(res[0].imagen).toContain('unsplash');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${uuid}/preferencias/favoritos`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 'p1', nombre: 'Coca Cola', precio: 100 }]); // Sin URL imagen, sin stockActual -> Default DISPONIBLE
    });

    it('fallback a localstorage si falla backend', () => {
      const uuid = '00000000-0000-0000-0000-000000000000';
      perfilSpy.getPerfil.and.returnValue({ rol: 'PADRE', id: 'p1' } as any);
      service.getFavoritos(uuid).subscribe(res => {
        // En localstorage mock devuelve null para uuid genericos, o array vacio.
        expect(res).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${uuid}/preferencias/favoritos`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('agregarFavorito', () => {
    it('guarda en localstorage si ids no son uuid', (done) => {
      service.agregarFavorito('a-invalid', { id: 'p-new', nombre: 'N' } as any).subscribe(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
        done();
      });
    });

    it('llama al backend si son uuid validos', () => {
      const u1 = '00000000-0000-0000-0000-000000000000';
      const p1 = '00000000-0000-0000-0000-000000000001';
      service.agregarFavorito(u1, { id: p1 } as any).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${u1}/preferencias/favoritos/${p1}`);
      expect(req.request.method).toBe('POST');
      req.flush(null);
    });

    it('fallback a localstorage si backend post falla', () => {
      const u1 = '00000000-0000-0000-0000-000000000000';
      const p1 = '00000000-0000-0000-0000-000000000001';
      service.agregarFavorito(u1, { id: p1 } as any).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${u1}/preferencias/favoritos/${p1}`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('removerFavorito', () => {
    it('remueve de localstorage si no son uuid', (done) => {
      service.removerFavorito('a-invalid', 'p-invalid').subscribe(() => {
        expect(localStorage.setItem).toHaveBeenCalled(); // update array
        done();
      });
    });

    it('llama al backend si son uuid validos', () => {
      const u1 = '00000000-0000-0000-0000-000000000000';
      const p1 = '00000000-0000-0000-0000-000000000001';
      service.removerFavorito(u1, p1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${u1}/preferencias/favoritos/${p1}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('fallback a localstorage si backend delete falla', () => {
      const u1 = '00000000-0000-0000-0000-000000000000';
      const p1 = '00000000-0000-0000-0000-000000000001';
      service.removerFavorito(u1, p1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${u1}/preferencias/favoritos/${p1}`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('mapDtoToProducto', () => {
    it('mapea stock 0 a SIN_STOCK', () => {
      const mapped = service['mapDtoToProducto']({ id: '1', nombre: 'A', precio: 10, stockActual: 0 });
      expect(mapped.estadoStock).toBe('SIN_STOCK');
    });

    it('mapea stock undefined a DISPONIBLE por default 1', () => {
      const mapped = service['mapDtoToProducto']({ id: '1', nombre: 'A', precio: 10 });
      expect(mapped.estadoStock).toBe('DISPONIBLE');
    });

    it('obtenerImagenProducto machea palabras clave', () => {
      expect(service['obtenerImagenProducto']('coca cola')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('agua')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('sandwich')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('empanada')).toContain('lanacion');
      expect(service['obtenerImagenProducto']('alfajor')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('cereal')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('yogur')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('manzana')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('pizza')).toContain('unsplash');
      expect(service['obtenerImagenProducto']('desconocido')).toBe('');
    });
  });
});
