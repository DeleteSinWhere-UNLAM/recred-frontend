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
