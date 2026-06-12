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

describe('CompraService', () => {
  let service: CompraService;
  let httpMock: HttpTestingController;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;

  const mockOrdenes: OrdenAlumno[] = [
    {
      alumno: { id: 'alumno-1', nombre: 'Juan', apellido: 'Perez', saldo: 100 } as unknown as Alumno,
      items: [],
      fecha: '2026-06-11',
      recreo: 'PRIMER_RECREO',
      subtotal: 50
    }
  ];

  beforeEach(() => {
    const perfilSpy = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
    ]);

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
    perfilServiceSpy = TestBed.inject(PerfilService) as jasmine.SpyObj<PerfilService>;
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
});
