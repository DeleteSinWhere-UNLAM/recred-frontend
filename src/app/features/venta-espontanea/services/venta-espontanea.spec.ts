import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BuffetService } from '../../buffet/services/buffet.service';
import {
  ALUMNO_ID_TEST,
  AlumnoResumenMother,
  BUFFET_ID_TEST,
  BuffetMother,
  ProductoVentaMother,
} from '../venta-espontanea.mother';
import { ProductoVenta, VentaEspontaneaService } from './venta-espontanea';

describe('VentaEspontaneaService', () => {
  const URL_ALUMNOS = `${environment.apiUrl}/alumnos`;
  const URL_PURCHASES_PRESENTIAL = `${environment.apiUrl}/purchases/presential`;

  let service: VentaEspontaneaService;
  let httpMock: HttpTestingController;
  let buffetService: jasmine.SpyObj<BuffetService>;

  beforeEach(() => {
    buffetService = jasmine.createSpyObj<BuffetService>('BuffetService', [
      'obtenerBuffetDelAlumno',
      'getProductosDelBuffet',
    ]);
    buffetService.obtenerBuffetDelAlumno.and.returnValue(of(BuffetMother.crear()));
    buffetService.getProductosDelBuffet.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        VentaEspontaneaService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BuffetService, useValue: buffetService },
      ],
    });
    service = TestBed.inject(VentaEspontaneaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('cargarAlumnos', () => {
    it('cuando cargo alumnos, deberia hacer GET a /alumnos y actualizar el signal', async () => {
      const alumnos = AlumnoResumenMother.crearVarios();

      const promesa = whenCargoAlumnos();
      const req = httpMock.expectOne(URL_ALUMNOS);
      expect(req.request.method).toBe('GET');
      req.flush(alumnos);

      expect(await promesa).toEqual(alumnos);
      expect(service.alumnos()).toEqual(alumnos);
    });
  });

  describe('cargarProductosDelAlumno', () => {
    it('cuando cargo productos del alumno, deberia pedir el buffet + los productos y setear cantidad=0', async () => {
      givenProductosDelBuffet([ProductoVentaMother.crear(), ProductoVentaMother.crear({ id: 'prod-2' })]);

      await whenCargoProductosDelAlumno(ALUMNO_ID_TEST);

      expect(buffetService.obtenerBuffetDelAlumno).toHaveBeenCalledWith(ALUMNO_ID_TEST);
      expect(buffetService.getProductosDelBuffet).toHaveBeenCalledWith(BUFFET_ID_TEST, ALUMNO_ID_TEST);
      expect(service.productos().length).toBe(2);
      expect(service.productos()[0].cantidad).toBe(0);
    });
  });

  describe('procesarVenta', () => {
    it('dado un alumno, items y buffet, cuando proceso la venta, deberia hacer POST /purchases/presential con studentId, items, buffetId y paymentMethod', async () => {
      givenProductosDelBuffet([ProductoVentaMother.crear()]);
      await whenCargoProductosDelAlumno(ALUMNO_ID_TEST);

      const promesa = whenProcesoVentaPara(ALUMNO_ID_TEST, [ProductoVentaMother.crear({ cantidad: 2 })]);

      thenSeLlamaPOSTPresentialCon(
        ALUMNO_ID_TEST,
        [{ productId: 'prod-1', quantity: 2 }],
        BUFFET_ID_TEST,
        'CREDITOS',
      ).flush({});

      await promesa;
    });
  });

  function givenProductosDelBuffet(productos: ProductoVenta[]): void {
    buffetService.getProductosDelBuffet.and.returnValue(of(productos));
  }

  function whenCargoAlumnos(): Promise<unknown[]> {
    return firstValueFrom(service.cargarAlumnos()) as Promise<unknown[]>;
  }

  function whenCargoProductosDelAlumno(alumnoId: string): Promise<unknown> {
    return firstValueFrom(service.cargarProductosDelAlumno(alumnoId));
  }

  function whenProcesoVentaPara(alumnoId: string, items: ProductoVenta[]): Promise<unknown> {
    return firstValueFrom(service.procesarVenta(alumnoId, items));
  }

  function thenSeLlamaPOSTPresentialCon(
    studentId: string,
    items: { productId: string; quantity: number }[],
    buffetId: string,
    paymentMethod: string,
  ): TestRequest {
    const req = httpMock.expectOne(URL_PURCHASES_PRESENTIAL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.studentId).toBe(studentId);
    expect(req.request.body.items).toEqual(items);
    expect(req.request.body.buffetId).toBe(buffetId);
    expect(req.request.body.paymentMethod).toBe(paymentMethod);
    return req;
  }
});
