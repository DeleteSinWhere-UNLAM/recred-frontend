import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CompraService } from './compra.service';
import { OrdenAlumno } from '../models/orden-compra.model';
import { Alumno } from '../../../data-access/models/alumno.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { environment } from '../../../../environments/environment';

describe('CompraService', () => {
  let service: CompraService;
  let httpMock: HttpTestingController;
  let perfilSpy: jasmine.SpyObj<PerfilService>;

  const mockOrdenes: OrdenAlumno[] = [
    {
      alumno: { id: 'alumno-1', nombre: 'Juan', apellido: 'Perez', saldo: 100 } as unknown as Alumno,
      buffetId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      items: [],
      fecha: '2026-06-11',
      recreo: 'PRIMER_RECREO',
      subtotal: 50
    }
  ];

  beforeEach(() => {
    perfilSpy = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
    ]);
    perfilSpy.getPerfil.and.returnValue({
      id: 'usuario-1',
      email: 'padre@test.com',
      nombre: 'Padre',
      apellido: 'Test',
      rol: 'PADRE',
    });

    TestBed.configureTestingModule({
      providers: [
        CompraService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: perfilSpy },
      ]
    });

    service = TestBed.inject(CompraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debe iniciar una orden sin sugerenciaId si no hay una pendiente', () => {
    service.iniciarOrden(mockOrdenes);
    const orden = service.ordenEnCurso();
    expect(orden?.sugerenciaId).toBeUndefined();
  });

  it('debe iniciar una orden con sugerenciaId si hay una pendiente', () => {
    service.setSugerenciaPendiente('sug-123');
    service.iniciarOrden(mockOrdenes);
    const orden = service.ordenEnCurso();
    expect(orden?.sugerenciaId).toBe('sug-123');
  });

  it('debe limpiar la sugerencia pendiente después de iniciar la orden', () => {
    service.setSugerenciaPendiente('sug-123');
    service.iniciarOrden(mockOrdenes);

    service.iniciarOrden(mockOrdenes);
    const orden = service.ordenEnCurso();
    expect(orden?.sugerenciaId).toBeUndefined();
  });

  it('debe priorizar sugerenciaId pasado por parámetro sobre la pendiente', () => {
    service.setSugerenciaPendiente('sug-pendiente');
    service.iniciarOrden(mockOrdenes, 'sug-explicita');
    const orden = service.ordenEnCurso();
    expect(orden?.sugerenciaId).toBe('sug-explicita');
  });
  it('debe enviar buffetId en cada orden al procesar el pago', (done) => {
    service.iniciarOrden(mockOrdenes);

    service.procesarPago().subscribe({
      next: () => done(),
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/advance`);
    expect(req.request.body.orders[0].buffetId).toBe(mockOrdenes[0].buffetId);
    expect(req.request.body.orders[0].studentId).toBe('alumno-1');
    req.flush({ orderId: 'orden-1', codes: {}, total: 50 });
  });
});
