import { TestBed } from '@angular/core/testing';
import { CompraService } from './compra.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { environment } from '../../../../environments/environment';
import { OrdenAlumno } from '../models/orden-compra.model';
import { signal } from '@angular/core';

describe('CompraService', () => {
  let service: CompraService;
  let httpMock: HttpTestingController;
  let perfilSpy: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    perfilSpy = jasmine.createSpyObj('PerfilService', ['getPerfil']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CompraService,
        { provide: PerfilService, useValue: perfilSpy }
      ]
    });
    service = TestBed.inject(CompraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('setSugerenciaPendiente cambia el estado', () => {
    service.setSugerenciaPendiente('sug-1');
    expect(service['sugerenciaPendienteState']()).toBe('sug-1');
  });

  describe('iniciarOrden', () => {
    it('inicia orden con sugerencia explicitamente', () => {
      const ordenes = [{ subtotal: 100 } as OrdenAlumno];
      service.iniciarOrden(ordenes, 'sug-explicit');
      
      const enCurso = service.ordenEnCurso();
      expect(enCurso?.total).toBe(100);
      expect(enCurso?.sugerenciaId).toBe('sug-explicit');
    });

    it('inicia orden con sugerencia pendiente state y lo limpia', () => {
      service.setSugerenciaPendiente('sug-state');
      const ordenes = [{ subtotal: 200 } as OrdenAlumno];
      service.iniciarOrden(ordenes);
      
      const enCurso = service.ordenEnCurso();
      expect(enCurso?.total).toBe(200);
      expect(enCurso?.sugerenciaId).toBe('sug-state');
      expect(service['sugerenciaPendienteState']()).toBeNull();
    });
  });

  it('cancelarOrden limpia el state', () => {
    service.iniciarOrden([{ subtotal: 100 } as OrdenAlumno]);
    expect(service.ordenEnCurso()).not.toBeNull();
    service.cancelarOrden();
    expect(service.ordenEnCurso()).toBeNull();
  });

  describe('procesarPago', () => {
    it('retorna mock si no hay orden o esta vacia', (done) => {
      service.procesarPago().subscribe(res => {
        expect(res.id).toBe('');
        expect(res.total).toBe(0);
        done();
      });
    });

    it('lanza error si no hay perfil', () => {
      service.iniciarOrden([{ subtotal: 100 } as OrdenAlumno]);
      perfilSpy.getPerfil.and.returnValue(null);
      expect(() => service.procesarPago()).toThrowError('Usuario no autenticado o sin perfil.');
    });

    it('hace post con mapeos correctos para PADRE y STUDENT, mapping de recreos', () => {
      const ordenes: OrdenAlumno[] = [
        {
          alumno: { id: 'st1' } as any,
          buffetId: 'bf1',
          items: [{ producto: { id: 'p1' } as any, cantidad: 2, id: 'i1', alumnoId: 'a1' }],
          fecha: '2023-10-10',
          recreo: 'SEGUNDO_RECREO',
          subtotal: 100
        },
        {
          alumno: { id: 'st2' } as any,
          buffetId: 'bf2',
          items: [],
          fecha: '2023-10-11',
          recreo: 'DESCONOCIDO' as any,
          subtotal: 0
        }
      ];
      service.iniciarOrden(ordenes);

      perfilSpy.getPerfil.and.returnValue({ id: 'parent1', rol: 'PADRE' } as any);

      service.procesarPago().subscribe(res => {
        expect(res.id).toBe('ord-123');
        expect(res.codigos).toEqual({ 'st1': 'CODE1' });
        expect(res.total).toBe(100); // From response
        expect(service.ordenEnCurso()).toBeNull();
        expect(service.ultimaOrden()?.id).toBe('ord-123');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/purchases/advance`);
      expect(req.request.method).toBe('POST');
      const body = req.request.body;
      expect(body.orders[0].buyerType).toBe('TUTOR');
      expect(body.orders[0].recessTime).toBe('SECOND_RECESS');
      expect(body.orders[1].recessTime).toBe('FIRST_RECESS'); // Fallback para DESCONOCIDO
      
      req.flush({ orderId: 'ord-123', codes: { 'st1': 'CODE1' }, total: 100 });
    });

    it('procesa fallback de buyerType y orderId fallback a uuid y total a enCurso', () => {
      const ordenes = [{ alumno: { id: 'st1' }, buffetId: 'bf1', items: [], fecha: '2023-10-10', recreo: 'PRIMER_RECREO', subtotal: 300 } as any];
      service.iniciarOrden(ordenes);
      perfilSpy.getPerfil.and.returnValue({ id: 'stu1', rol: 'ALUMNO' } as any); // fallback a STUDENT

      service.procesarPago().subscribe(res => {
        expect(res.id).toBeTruthy(); // Fallback uuid
        expect(res.total).toBe(300); // Fallback enCurso.total
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/purchases/advance`);
      expect(req.request.body.orders[0].buyerType).toBe('STUDENT');
      req.flush({}); // empty response fallback
    });
  });

  it('deliver hace post con codigo', () => {
    service.deliver('purch-1', 'CODE').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/purch-1/deliver`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ withdrawalCode: 'CODE' });
    req.flush(null);
  });
});
