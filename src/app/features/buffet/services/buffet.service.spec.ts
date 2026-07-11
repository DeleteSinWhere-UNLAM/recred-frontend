import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { Producto } from '../models/producto.model';
import { BuffetService } from './buffet.service';

interface MenuProductoDto {
  id: string;
  nombre: string;
  precio: number;
  bloqueado?: boolean;
  motivoBloqueo?: string | null;
}

describe('BuffetService', () => {
  let service: BuffetService;
  let httpMock: HttpTestingController;

  const ALUMNO_ID = '345c0add-4188-489f-a290-bf1ab68b260a';
  const BUFFET_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BuffetService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BuffetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('dado que se inyecta el servicio, deberia crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('mapMenuProductDtoToProducto — separacion de tipos de bloqueo', () => {
    it('dado un motivo "Bloqueado por el tutor", cuando obtengo productos, deberia mapear bloqueado=true y sin estado restriccion', (done) => {
      const dto = unDtoBloqueado('prod-1', 'Coca Cola', 'Bloqueado por el tutor');

      whenObtengoProductos((productos) => {
        thenElProductoTieneBloqueado(productos[0], true);
        thenElProductoTieneBloqueadoPorRestriccion(productos[0], false);
        expect(productos[0].motivoBloqueo).toBe('Bloqueado por el tutor');
        expect(productos[0].estadoStock).toBe('SIN_STOCK');
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });

    it('dado un motivo "Contiene: Gluten (TACC)", cuando obtengo productos, deberia mapear bloqueadoPorRestriccion=true', (done) => {
      const dto = unDtoBloqueado('prod-2', 'Galletitas Oreo', 'Contiene: Gluten (TACC)');

      whenObtengoProductos((productos) => {
        thenElProductoTieneBloqueado(productos[0], false);
        thenElProductoTieneBloqueadoPorRestriccion(productos[0], true);
        expect(productos[0].motivoBloqueo).toBe('Contiene: Gluten (TACC)');
        expect(productos[0].estadoStock).toBe('SIN_STOCK');
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });

    it('dado un motivo "Contiene: Lácteos", cuando obtengo productos, deberia mapear bloqueadoPorRestriccion=true', (done) => {
      const dto = unDtoBloqueado('prod-3', 'Leche Entera', 'Contiene: Lácteos');

      whenObtengoProductos((productos) => {
        thenElProductoTieneBloqueado(productos[0], false);
        thenElProductoTieneBloqueadoPorRestriccion(productos[0], true);
        expect(productos[0].motivoBloqueo).toBe('Contiene: Lácteos');
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });

    it('dado un motivo de restriccion horaria, cuando obtengo productos, deberia mapear bloqueadoPorRestriccion=true', (done) => {
      const dto = unDtoBloqueado('prod-4', 'Alfajor', 'No permitido en este horario');

      whenObtengoProductos((productos) => {
        thenElProductoTieneBloqueado(productos[0], false);
        thenElProductoTieneBloqueadoPorRestriccion(productos[0], true);
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });

    it('dado un motivo "Supera el limite de gasto", cuando obtengo productos, deberia mapear superaPresupuesto=true sin bloqueo', (done) => {
      const dto = unDtoBloqueado('prod-5', 'Hamburguesa', 'Supera el límite de gasto');

      whenObtengoProductos((productos) => {
        thenElProductoTieneBloqueado(productos[0], false);
        thenElProductoTieneBloqueadoPorRestriccion(productos[0], false);
        expect(productos[0].superaPresupuesto).toBeTrue();
        expect(productos[0].estadoStock).toBe('DISPONIBLE');
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });

    it('dado un motivo "Supera limite de su categoria", cuando obtengo productos, deberia mapear superaPresupuesto=true', (done) => {
      const dto = unDtoBloqueado('prod-6', 'Pizza', 'Supera límite de su categoría');

      whenObtengoProductos((productos) => {
        expect(productos[0].superaPresupuesto).toBeTrue();
        thenElProductoTieneBloqueado(productos[0], false);
        thenElProductoTieneBloqueadoPorRestriccion(productos[0], false);
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });

    it('dado un producto sin bloqueo, cuando obtengo productos, deberia mapear como disponible y sin restricciones', (done) => {
      const dto = unDtoSinBloqueo('prod-7', 'Agua Mineral');

      whenObtengoProductos((productos) => {
        thenElProductoTieneBloqueado(productos[0], false);
        thenElProductoTieneBloqueadoPorRestriccion(productos[0], false);
        expect(productos[0].superaPresupuesto).toBeFalsy();
        expect(productos[0].estadoStock).toBe('DISPONIBLE');
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });

    it('dado un motivo complejo, cuando obtengo productos, deberia preservar el motivoBloqueo intacto', (done) => {
      const motivo = 'Contiene: Gluten (TACC), Azúcar';
      const dto = unDtoBloqueado('prod-8', 'Pepitos', motivo);

      whenObtengoProductos((productos) => {
        expect(productos[0].motivoBloqueo).toBe(motivo);
        done();
      });

      thenSeHizoGetAMenu().flush([dto]);
    });
  });

  describe('obtenerBuffetDelAlumno', () => {
    it('dado un alumnoId, cuando pido su buffet, deberia hacer GET al endpoint correcto', (done) => {
      service.obtenerBuffetDelAlumno(ALUMNO_ID).subscribe((buffet) => {
        expect(buffet.id).toBe('buffet-1');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${ALUMNO_ID}/buffet`);
      expect(req.request.method).toBe('GET');
      req.flush({ id: 'buffet-1', nombre: 'X', colegioId: 'c-1' });
    });
  });

  describe('getProductosDelBuffet sin alumnoId o no-UUID', () => {
    it('dado sin alumnoId, deberia hacer GET a /products con buffetId', (done) => {
      service.getProductosDelBuffet(BUFFET_ID).subscribe((prods) => {
        expect(prods.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne((r) =>
        r.url === `${environment.apiUrl}/products` && r.params.get('buffetId') === BUFFET_ID,
      );
      req.flush([{ id: 'p1', nombre: 'X', precio: 100 }]);
    });

    it('dado alumnoId NO UUID, deberia caer al fallback de /products', (done) => {
      service.getProductosDelBuffet(BUFFET_ID, 'no-uuid').subscribe((prods) => {
        expect(prods).toEqual([]);
        done();
      });

      httpMock.expectOne((r) => r.url === `${environment.apiUrl}/products`).flush([]);
    });

    it('dado buffetId NO UUID, deberia devolver lista vacia sin hacer HTTP', (done) => {
      spyOn(console, 'warn');
      service.getProductosDelBuffet('bad-buffet').subscribe((prods) => {
        expect(prods).toEqual([]);
        done();
      });

      httpMock.expectNone(`${environment.apiUrl}/products`);
    });

    it('dado que /products falla, deberia devolver lista vacia y no romper', (done) => {
      spyOn(console, 'warn');
      service.getProductosDelBuffet(BUFFET_ID).subscribe((prods) => {
        expect(prods).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/products?buffetId=${BUFFET_ID}`);
      req.error(new ProgressEvent('boom'));
    });
  });

  describe('getProductosDelBuffet con fechaHoraConsulta y fallback', () => {
    it('dado fechaHoraConsulta, deberia agregarla como query param', (done) => {
      service.getProductosDelBuffet(BUFFET_ID, ALUMNO_ID, '2026-07-15T10:00:00').subscribe((prods) => {
        expect(prods).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiUrl}/alumnos/${ALUMNO_ID}/menu-buffet` &&
          r.params.get('fechaHoraConsulta') === '2026-07-15T10:00:00',
      );
      req.flush([]);
    });

    it('dado que /menu-buffet falla, deberia hacer fallback a /products', (done) => {
      spyOn(console, 'warn');
      service.getProductosDelBuffet(BUFFET_ID, ALUMNO_ID).subscribe((prods) => {
        expect(prods).toEqual([]);
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/alumnos/${ALUMNO_ID}/menu-buffet?buffetId=${BUFFET_ID}`)
        .error(new ProgressEvent('boom'));
      httpMock.expectOne(`${environment.apiUrl}/products?buffetId=${BUFFET_ID}`).flush([]);
    });
  });

  describe('mapDtoToProducto (path /products)', () => {
    it('dado un dto sin categoria, deberia usar la categoria default "comidas"', (done) => {
      service.getProductosDelBuffet(BUFFET_ID).subscribe((prods) => {
        expect(prods[0].categoria.id).toBe('comidas');
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/products?buffetId=${BUFFET_ID}`).flush([
        { id: 'p1', nombre: 'X', precio: 100 },
      ]);
    });

    it('dado un dto con urlImagen, deberia usarla', (done) => {
      service.getProductosDelBuffet(BUFFET_ID).subscribe((prods) => {
        expect(prods[0].imagen).toBe('https://cdn/foto.jpg');
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/products?buffetId=${BUFFET_ID}`).flush([
        { id: 'p1', nombre: 'Alfajor', precio: 100, urlImagen: 'https://cdn/foto.jpg' },
      ]);
    });
  });

  describe('mapEstadoStock via /products', () => {
    function estadoDeDto(dto: Record<string, unknown>): Promise<string> {
      return new Promise((resolve) => {
        service.getProductosDelBuffet(BUFFET_ID).subscribe((prods) => resolve(prods[0].estadoStock));

        httpMock.expectOne(`${environment.apiUrl}/products?buffetId=${BUFFET_ID}`).flush([
          { id: 'p1', nombre: 'X', precio: 100, ...dto },
        ]);
      });
    }

    it('dado estadoInventario "AGOTADO", deberia devolver SIN_STOCK', async () => {
      expect(await estadoDeDto({ estadoInventario: 'AGOTADO' })).toBe('SIN_STOCK');
    });

    it('dado estadoInventario "SIN_STOCK", deberia devolver SIN_STOCK', async () => {
      expect(await estadoDeDto({ estadoInventario: 'SIN_STOCK' })).toBe('SIN_STOCK');
    });

    it('dado estadoInventario "BAJO_STOCK", deberia devolver BAJO_STOCK', async () => {
      expect(await estadoDeDto({ estadoInventario: 'BAJO_STOCK' })).toBe('BAJO_STOCK');
    });

    it('dado stockDisponible = 0, deberia devolver SIN_STOCK', async () => {
      expect(await estadoDeDto({ stockDisponible: 0 })).toBe('SIN_STOCK');
    });

    it('dado stockDisponible <= stockMinimo, deberia devolver BAJO_STOCK', async () => {
      expect(await estadoDeDto({ stockDisponible: 3, stockMinimo: 5 })).toBe('BAJO_STOCK');
    });

    it('dado stockDisponible > stockMinimo, deberia devolver DISPONIBLE', async () => {
      expect(await estadoDeDto({ stockDisponible: 10, stockMinimo: 5 })).toBe('DISPONIBLE');
    });

    it('dado solo stockActual = 0, deberia devolver SIN_STOCK', async () => {
      expect(await estadoDeDto({ stockActual: 0 })).toBe('SIN_STOCK');
    });

    it('dado sin ningun stock, deberia devolver DISPONIBLE por default', async () => {
      expect(await estadoDeDto({})).toBe('DISPONIBLE');
    });
  });

  describe('obtenerImagenProducto via /products', () => {
    function imagenParaNombre(nombre: string): Promise<string> {
      return new Promise((resolve) => {
        service.getProductosDelBuffet(BUFFET_ID).subscribe((prods) => resolve(prods[0].imagen));

        httpMock.expectOne(`${environment.apiUrl}/products?buffetId=${BUFFET_ID}`).flush([
          { id: 'p1', nombre, precio: 100 },
        ]);
      });
    }

    it('dado nombres de bebidas, deberia devolver imagen de gaseosa', async () => {
      expect(await imagenParaNombre('Coca Cola')).toContain('1622483767028');
      expect(await imagenParaNombre('Gaseosa Sprite')).toContain('1622483767028');
    });

    it('dado nombre con "agua", deberia devolver imagen de agua', async () => {
      expect(await imagenParaNombre('Agua Mineral')).toContain('1548839140');
    });

    it('dado sandwich/tostado/empanada/pizza, deberia devolver la imagen adecuada', async () => {
      expect(await imagenParaNombre('Sandwich JyQ')).toContain('1528735602780');
      expect(await imagenParaNombre('Tostado')).toContain('1528735602780');
      expect(await imagenParaNombre('Empanada de carne')).toContain('empanadas');
      expect(await imagenParaNombre('Pizza muzza')).toContain('1513104890138');
    });

    it('dado dulces/panificados/cereal/yogur/fruta, deberia devolver la imagen adecuada', async () => {
      expect(await imagenParaNombre('Alfajor')).toContain('1499636136210');
      expect(await imagenParaNombre('Medialuna')).toContain('1499636136210');
      expect(await imagenParaNombre('Barra de cereal')).toContain('1571748982800');
      expect(await imagenParaNombre('Yogur')).toContain('1488477181946');
      expect(await imagenParaNombre('Manzana')).toContain('1560806887');
    });

    it('dado un nombre desconocido, deberia devolver imagen vacia', async () => {
      expect(await imagenParaNombre('Producto Random X')).toBe('');
    });
  });

  describe('metodos deprecated', () => {
    it('dado getCategorias, deberia devolver array vacio y loguear warning', () => {
      spyOn(console, 'warn');

      expect(service.getCategorias(BUFFET_ID)).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });

    it('dado getClasificacionesSalud, deberia devolver array vacio y loguear warning', () => {
      spyOn(console, 'warn');

      expect(service.getClasificacionesSalud(BUFFET_ID)).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  function unDtoBloqueado(id: string, nombre: string, motivoBloqueo: string): MenuProductoDto {
    return { id, nombre, precio: 100, bloqueado: true, motivoBloqueo };
  }

  function unDtoSinBloqueo(id: string, nombre: string): MenuProductoDto {
    return { id, nombre, precio: 100, bloqueado: false, motivoBloqueo: null };
  }

  function whenObtengoProductos(asercion: (productos: Producto[]) => void): void {
    service.getProductosDelBuffet(BUFFET_ID, ALUMNO_ID).subscribe({
      next: asercion,
    });
  }

  function thenSeHizoGetAMenu(): TestRequest {
    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/alumnos/${ALUMNO_ID}/menu-buffet` &&
        r.params.get('buffetId') === BUFFET_ID,
    );
    expect(req.request.params.get('buffetId')).toBe(BUFFET_ID);
    return req;
  }

  function thenElProductoTieneBloqueado(p: Producto, esperado: boolean): void {
    if (esperado) expect(p.bloqueado).toBeTrue();
    else expect(p.bloqueado).toBeFalsy();
  }

  function thenElProductoTieneBloqueadoPorRestriccion(p: Producto, esperado: boolean): void {
    if (esperado) expect(p.bloqueadoPorRestriccion).toBeTrue();
    else expect(p.bloqueadoPorRestriccion).toBeFalsy();
  }
});
