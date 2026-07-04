import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
import { VentaEspontaneaService } from './venta-espontanea';

describe('VentaEspontaneaService', () => {
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

      const promesa = firstValueFrom(service.cargarAlumnos());
      const req = httpMock.expectOne(`${environment.apiUrl}/alumnos`);
      expect(req.request.method).toBe('GET');
      req.flush(alumnos);

      expect(await promesa).toEqual(alumnos);
      expect(service.alumnos()).toEqual(alumnos);
    });
  });

  describe('cargarProductosDelAlumno', () => {
    it('cuando cargo productos del alumno, deberia pedir el buffet + los productos y setear cantidad=0', async () => {
      buffetService.getProductosDelBuffet.and.returnValue(
        of([{ ...ProductoVentaMother.crear() }, { ...ProductoVentaMother.crear({ id: 'prod-2' }) }]),
      );

      const promesa = firstValueFrom(service.cargarProductosDelAlumno(ALUMNO_ID_TEST));

      await promesa;

      expect(buffetService.obtenerBuffetDelAlumno).toHaveBeenCalledWith(ALUMNO_ID_TEST);
      expect(buffetService.getProductosDelBuffet).toHaveBeenCalledWith(BUFFET_ID_TEST, ALUMNO_ID_TEST);
      expect(service.productos().length).toBe(2);
      expect(service.productos()[0].cantidad).toBe(0);
    });
  });

  describe('procesarVenta', () => {
    it('dados items y un alumno, cuando proceso, deberia hacer POST a /purchases/presential con studentId + items + buffetId + paymentMethod', async () => {
      buffetService.getProductosDelBuffet.and.returnValue(of([ProductoVentaMother.crear()]));
      await firstValueFrom(service.cargarProductosDelAlumno(ALUMNO_ID_TEST));

      const items = [ProductoVentaMother.crear({ cantidad: 2 })];
      const promesa = firstValueFrom(service.procesarVenta(ALUMNO_ID_TEST, items));
      const req = httpMock.expectOne(`${environment.apiUrl}/purchases/presential`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        studentId: ALUMNO_ID_TEST,
        items: [{ productId: 'prod-1', quantity: 2 }],
        buffetId: BUFFET_ID_TEST,
        paymentMethod: 'CREDITOS',
      });
      req.flush({});

      await promesa;
    });
  });
});
