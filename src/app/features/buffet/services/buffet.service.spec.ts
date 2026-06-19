import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BuffetService } from './buffet.service';
import { environment } from '../../../../environments/environment';

describe('BuffetService', () => {
  let service: BuffetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BuffetService]
    });
    service = TestBed.inject(BuffetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerBuffetDelAlumno', () => {
    it('debería retornar un Buffet', () => {
      const mockBuffet = { id: 'b1', nombre: 'Buffet Test' };
      service.obtenerBuffetDelAlumno('a1').subscribe(res => {
        expect(res).toEqual(mockBuffet as any);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/a1/buffet`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBuffet);
    });
  });

  describe('getProductosDelBuffet', () => {
    const validUuid = '12345678-1234-1234-1234-1234567890ab';
    const invalidUuid = 'invalid-id';
    
    it('debería hacer GET a menu-buffet si se provee alumnoId válido', () => {
      const mockDto = [{ id: 'p1', nombre: 'P1', precio: 100 }];
      service.getProductosDelBuffet('buffet1', validUuid, '2023-01-01T10:00:00').subscribe(res => {
        expect(res.length).toBe(1);
        expect(res[0].id).toBe('p1');
        expect(res[0].estadoStock).toBe('DISPONIBLE');
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/alumnos/${validUuid}/menu-buffet` &&
        request.params.get('buffetId') === 'buffet1' &&
        request.params.get('fechaHoraConsulta') === '2023-01-01T10:00:00'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockDto);
    });

    it('debería hacer fallback a products si menu-buffet falla', () => {
      const mockDto = [{ id: 'p1', nombre: 'P1', precio: 100 }];
      service.getProductosDelBuffet(validUuid, validUuid).subscribe(res => {
        expect(res.length).toBe(1);
      });

      const reqMenu = httpMock.expectOne(request => request.url === `${environment.apiUrl}/alumnos/${validUuid}/menu-buffet`);
      reqMenu.error(new ProgressEvent('error'));

      const reqProducts = httpMock.expectOne(request => request.url === `${environment.apiUrl}/products`);
      reqProducts.flush(mockDto);
    });

    it('debería llamar a getProductosByBuffetId si no se pasa alumnoId', () => {
      const mockDto = [{ id: 'p1', nombre: 'P1', precio: 100 }];
      service.getProductosDelBuffet(validUuid).subscribe(res => {
        expect(res.length).toBe(1);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/products` &&
        request.params.get('buffetId') === validUuid
      );
      req.flush(mockDto);
    });

    it('debería retornar array vacío y no hacer http call si buffetId es inválido en getProductosByBuffetId', () => {
      service.getProductosDelBuffet(invalidUuid).subscribe(res => {
        expect(res).toEqual([]);
      });
      httpMock.expectNone(`${environment.apiUrl}/products`);
    });

    it('debería retornar array vacío si ocurre un error en products endpoint', () => {
      service.getProductosDelBuffet(validUuid).subscribe(res => {
        expect(res).toEqual([]);
      });
      const req = httpMock.expectOne(request => request.url === `${environment.apiUrl}/products`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('getCategorias y getClasificacionesSalud', () => {
    it('debería retornar array vacío y advertir por consola', () => {
      spyOn(console, 'warn');
      expect(service.getCategorias('b1')).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(jasmine.stringContaining('getCategorias(b1) is deprecated'));
      
      expect(service.getClasificacionesSalud('b1')).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(jasmine.stringContaining('getClasificacionesSalud(b1) is deprecated'));
    });
  });

  describe('Mapeo de Productos y Estado de Stock', () => {
    const validUuid = '12345678-1234-1234-1234-1234567890ab';

    it('debería mapear correctamente desde ProductDTO', () => {
      const mockDto = [{
        id: '1', nombre: 'Coca Cola', precio: 100, descripcion: null, 
        categoria: null, clasificacionesSalud: null, estadoInventario: 'agotado'
      }];
      service.getProductosDelBuffet(validUuid).subscribe(res => {
        const p = res[0];
        expect(p.id).toBe('1');
        expect(p.descripcion).toBe('');
        expect(p.categoria.id).toBe('comidas');
        expect(p.clasificacionesSalud.length).toBe(0);
        expect(p.imagen).toContain('unsplash');
        expect(p.estadoStock).toBe('SIN_STOCK');
      });
      httpMock.expectOne(request => request.url === `${environment.apiUrl}/products`).flush(mockDto);
    });

    it('debería mapear stock min/actual/disponible en ProductDTO', () => {
      const mockDto = [
        { id: '1', nombre: 'Agua', precio: 100, stockDisponible: 0, estadoInventario: '' },
        { id: '2', nombre: 'Sandwich', precio: 100, stockDisponible: 5, stockMinimo: 5 },
        { id: '3', nombre: 'P1', precio: 100, estadoInventario: 'bajo stock' },
        { id: '4', nombre: 'P2', precio: 100, stockActual: null, stockDisponible: null },
      ];
      service.getProductosDelBuffet(validUuid).subscribe(res => {
        expect(res[0].estadoStock).toBe('SIN_STOCK');
        expect(res[1].estadoStock).toBe('BAJO_STOCK');
        expect(res[2].estadoStock).toBe('BAJO_STOCK');
        expect(res[3].estadoStock).toBe('DISPONIBLE');
      });
      httpMock.expectOne(request => request.url === `${environment.apiUrl}/products`).flush(mockDto);
    });

    it('debería mapear MenuProductoDTO y bloqueos', () => {
      const mockDto = [
        { id: '1', nombre: 'Empanada', precio: 100, bloqueado: true, motivoBloqueo: 'supera el gasto de su categoria' },
        { id: '2', nombre: 'Alfajor', precio: 100, bloqueado: true, motivoBloqueo: 'bloqueado por el tutor' },
        { id: '3', nombre: 'Barra Cereal', precio: 100, bloqueado: true, motivoBloqueo: 'contiene tacc' },
        { id: '4', nombre: 'Yogur', precio: 100, urlImagen: 'http://img' }
      ];
      service.getProductosDelBuffet('b1', validUuid).subscribe(res => {
        expect(res[0].superaPresupuesto).toBeTrue();
        expect(res[0].estadoStock).toBe('DISPONIBLE');
        
        expect(res[1].bloqueado).toBeTrue();
        expect(res[1].estadoStock).toBe('SIN_STOCK');
        
        expect(res[2].bloqueadoPorRestriccion).toBeTrue();
        expect(res[2].estadoStock).toBe('SIN_STOCK');
        
        expect(res[3].imagen).toBe('http://img');
      });
      httpMock.expectOne(request => request.url === `${environment.apiUrl}/alumnos/${validUuid}/menu-buffet`).flush(mockDto);
    });

    it('debería asignar imágenes por defecto según nombre', () => {
      const mockDto = [
        { id: '1', nombre: 'Manzana', precio: 10 },
        { id: '2', nombre: 'Pizza', precio: 10 },
        { id: '3', nombre: 'Tostado', precio: 10 },
        { id: '4', nombre: 'Cookie', precio: 10 },
        { id: '5', nombre: 'Desconocido', precio: 10 }
      ];
      service.getProductosDelBuffet(validUuid).subscribe(res => {
        expect(res[0].imagen).toContain('unsplash');
        expect(res[1].imagen).toContain('unsplash');
        expect(res[2].imagen).toContain('unsplash');
        expect(res[3].imagen).toContain('unsplash');
        expect(res[4].imagen).toBe('');
      });
      httpMock.expectOne(request => request.url === `${environment.apiUrl}/products`).flush(mockDto);
    });
  });
});
