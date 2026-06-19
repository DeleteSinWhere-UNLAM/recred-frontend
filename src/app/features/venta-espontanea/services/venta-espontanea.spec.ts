import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { VentaEspontaneaService, AlumnoResumen, ProductoVenta } from './venta-espontanea';
import { BuffetService } from '../../buffet/services/buffet.service';
import { environment } from '../../../../environments/environment';
import { Producto } from '../../buffet/models/producto.model';

describe('VentaEspontaneaService', () => {
  let service: VentaEspontaneaService;
  let httpMock: HttpTestingController;
  let buffetServiceSpy: jasmine.SpyObj<BuffetService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('BuffetService', ['obtenerBuffetDelAlumno', 'getProductosDelBuffet']);
    
    TestBed.configureTestingModule({
      providers: [
        VentaEspontaneaService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BuffetService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(VentaEspontaneaService);
    httpMock = TestBed.inject(HttpTestingController);
    buffetServiceSpy = TestBed.inject(BuffetService) as jasmine.SpyObj<BuffetService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que se llama a cargarAlumnos, deberia hacer la peticion GET y setear el estado', () => {
    const mockAlumnos: AlumnoResumen[] = [
      { id: '1', nombre: 'A', apellido: 'B', dni: '123' }
    ];

    service.cargarAlumnos().subscribe(alumnos => {
      expect(alumnos).toEqual(mockAlumnos);
      expect(service.alumnos()).toEqual(mockAlumnos);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/alumnos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAlumnos);
  });

  it('dado que se llama a cargarProductosDelAlumno, deberia mapear productos con cantidad cero y setear estado', () => {
    const mockBuffet = { id: 'buffet-1', nombre: 'Test Buffet', colegioId: 'col-1' };
    const mockProductos: Producto[] = [
      { id: 'prod-1', nombre: 'P1', descripcion: 'D1', precio: 100, categoria: { id: 'c1', descripcion: 'C1' }, clasificacionesSalud: [], imagen: 'img.jpg', estadoStock: 'DISPONIBLE' }
    ];

    buffetServiceSpy.obtenerBuffetDelAlumno.and.returnValue(of(mockBuffet));
    buffetServiceSpy.getProductosDelBuffet.and.returnValue(of(mockProductos));

    service.cargarProductosDelAlumno('alumno-1').subscribe(productos => {
      expect(productos.length).toBe(1);
    });

    expect(buffetServiceSpy.obtenerBuffetDelAlumno).toHaveBeenCalledWith('alumno-1');
    expect(buffetServiceSpy.getProductosDelBuffet).toHaveBeenCalledWith('buffet-1', 'alumno-1');
    
    const expectedProdsVenta: ProductoVenta[] = [{ ...mockProductos[0], cantidad: 0 }];
    expect(service.productos()).toEqual(expectedProdsVenta);
  });

  it('dado que se procesa una venta, deberia enviar payload con CREDITOS', () => {
    const items: ProductoVenta[] = [
      { id: 'prod-1', nombre: 'P1', descripcion: 'D', precio: 10, categoria: { id: 'c1', descripcion: 'C1' }, clasificacionesSalud: [], imagen: 'img.jpg', estadoStock: 'DISPONIBLE', cantidad: 2 }
    ];

    service.procesarVenta('alumno-1', items).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/presential`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      studentId: 'alumno-1',
      items: [{ productId: 'prod-1', quantity: 2 }],
      paymentMethod: 'CREDITOS'
    });
    req.flush({});
  });
});
