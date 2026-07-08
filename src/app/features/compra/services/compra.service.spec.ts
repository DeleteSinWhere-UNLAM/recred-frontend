import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { OrdenAlumnoMother } from '../compra.mother';
import { OrdenAlumno, OrdenCompra, Recreo } from '../models/orden-compra.model';
import { CompraService } from './compra.service';

interface BackendPurchaseResponse {
  orderId?: string;
  codes?: Record<string, string>;
  total?: number;
}

describe('CompraService', () => {
  const URL_ADVANCE = `${environment.apiUrl}/purchases/advance`;
  const URL_DELIVER = (id: string): string => `${environment.apiUrl}/purchases/${id}/deliver`;

  let service: CompraService;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['getPerfil']);
    givenPerfilLogueado(PerfilMother.crear({ id: 'padre-1', rol: 'PADRE' }));

    TestBed.configureTestingModule({
      providers: [
        CompraService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });

    service = TestBed.inject(CompraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('iniciarOrden', () => {
    it('dado que no hay sugerencia pendiente, cuando inicio, la orden deberia no tener sugerenciaId', () => {
      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      thenLaSugerenciaIdEnCursoEs(undefined);
    });

    it('dado una sugerencia pendiente, cuando inicio sin pasar id, deberia usar la pendiente', () => {
      givenSugerenciaPendiente('sug-pendiente');

      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      thenLaSugerenciaIdEnCursoEs('sug-pendiente');
    });

    it('dado una sugerencia pendiente ya consumida, cuando inicio otra, no deberia arrastrarla', () => {
      givenSugerenciaPendiente('sug-pendiente');
      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      thenLaSugerenciaIdEnCursoEs(undefined);
    });

    it('dado un id explicito y una pendiente, cuando inicio, deberia priorizar el explicito', () => {
      givenSugerenciaPendiente('sug-pendiente');

      whenInicioOrdenCon([OrdenAlumnoMother.crear()], 'sug-explicita');

      thenLaSugerenciaIdEnCursoEs('sug-explicita');
    });

    it('dado ordenes con distintos subtotales, cuando inicio, deberia calcular el total como suma de subtotales', () => {
      const ordenes = [
        OrdenAlumnoMother.crear({ subtotal: 500 }),
        OrdenAlumnoMother.crear({ subtotal: 300 }),
      ];

      whenInicioOrdenCon(ordenes);

      thenElTotalEnCursoEs(800);
    });
  });

  describe('procesarPago', () => {
    it('dado sin orden en curso, cuando proceso, deberia devolver una orden vacia sin llamar al back', async () => {
      const resultado = await firstValueFrom(service.procesarPago());

      expect(resultado.ordenes).toEqual([]);
      httpMock.expectNone(URL_ADVANCE);
    });

    it('dado un tutor y una orden con buffet SEGUNDO_RECREO, cuando proceso, deberia mandar buffetId, studentId, buyerType TUTOR y recessTime SECOND_RECESS', async () => {
      whenInicioOrdenCon([
        OrdenAlumnoMother.crear({
          alumno: { ...OrdenAlumnoMother.crear().alumno, id: 'alumno-1' },
          buffetId: 'buffet-x',
          recreo: 'SEGUNDO_RECREO',
        }),
      ]);

      const promesa = firstValueFrom(service.procesarPago());

      const req = thenLaPrimeraOrdenDelPOSTLlevaValores('buffet-x', 'alumno-1', 'TUTOR', 'SECOND_RECESS');

      whenElBackAdvanceResponde(req, { orderId: 'orden-1', codes: { 'alumno-1': 'ABC' }, total: 500 });
      const pagada = await promesa;
      expect(pagada.id).toBe('orden-1');
      expect(pagada.codigos).toEqual({ 'alumno-1': 'ABC' });
      expect(service.ultimaOrden()?.id).toBe('orden-1');
      expect(service.ordenEnCurso()).toBeNull();
    });

    it('dado un rol ALUMNO, cuando proceso, deberia mandar buyerType STUDENT', async () => {
      givenPerfilLogueado(PerfilMother.crear({ id: 'alumno-x', rol: 'ALUMNO' }));
      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      const promesa = firstValueFrom(service.procesarPago());

      const req = thenLaPrimeraOrdenDelPOSTTieneBuyerType('STUDENT');

      whenElBackAdvanceResponde(req, { orderId: 'x', codes: {}, total: 0 });
      await promesa;
    });

    it('dado que no hay perfil, cuando proceso, deberia tirar el error de usuario no autenticado', () => {
      givenPerfilLogueado(null);
      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      expect(() => service.procesarPago()).toThrowError('Usuario no autenticado o sin perfil.');
    });
  });

  describe('cancelarOrden', () => {
    it('dado una orden en curso, cuando cancelo, deberia dejar la orden en null', () => {
      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      service.cancelarOrden();

      expect(service.ordenEnCurso()).toBeNull();
    });
  });

  describe('deliver', () => {
    it('dado un purchaseId y un code, cuando entrego, deberia hacer POST /purchases/{id}/deliver con el withdrawalCode', async () => {
      const promesa = firstValueFrom(service.deliver('compra-1', 'CODE'));

      const req = httpMock.expectOne(URL_DELIVER('compra-1'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ withdrawalCode: 'CODE' });
      req.flush(null);
      await promesa;
    });
  });

  describe('procesarPago con fallbacks', () => {
    it('dado un recreo desconocido, cuando proceso, deberia mapearlo a FIRST_RECESS', async () => {
      whenInicioOrdenCon([OrdenAlumnoMother.crear({ recreo: 'RARO' as unknown as Recreo })]);

      const promesa = firstValueFrom(service.procesarPago());
      const req = thenSeHizoPostAdvance();

      expect(req.request.body.orders[0].recessTime).toBe('FIRST_RECESS');
      whenElBackAdvanceResponde(req, { orderId: 'x', codes: {}, total: 0 });
      await promesa;
    });

    it('dado que el back responde sin orderId ni codes, cuando proceso, deberia generar un UUID y usar codigos vacios', async () => {
      spyOn(crypto, 'randomUUID').and.returnValue('uuid-de-test-4444-1111-1111-1111-111111111111');
      whenInicioOrdenCon([OrdenAlumnoMother.crear()]);

      const promesa = firstValueFrom(service.procesarPago());
      whenElBackAdvanceRespondeCon({});
      const pagada = await promesa;

      expect(pagada.id).toBe('uuid-de-test-4444-1111-1111-1111-111111111111');
      expect(pagada.codigos).toEqual({});
    });

    it('dado que el back responde sin total, cuando proceso, deberia preservar el total en curso', async () => {
      whenInicioOrdenCon([OrdenAlumnoMother.crear({ subtotal: 750 })]);

      const promesa = firstValueFrom(service.procesarPago());
      whenElBackAdvanceRespondeCon({ orderId: 'ok', codes: {} });
      const pagada = await promesa;

      expect(pagada.total).toBe(750);
    });
  });

  function givenPerfilLogueado(perfil: ReturnType<typeof PerfilMother.crear> | null): void {
    servicioPerfil.getPerfil.and.returnValue(perfil);
  }

  function givenSugerenciaPendiente(sugerenciaId: string): void {
    service.setSugerenciaPendiente(sugerenciaId);
  }

  function whenInicioOrdenCon(ordenes: OrdenAlumno[], sugerenciaId?: string): void {
    service.iniciarOrden(ordenes, sugerenciaId);
  }

  function whenElBackAdvanceResponde(
    req: ReturnType<HttpTestingController['expectOne']>,
    body: BackendPurchaseResponse,
  ): void {
    req.flush(body);
  }

  function whenElBackAdvanceRespondeCon(body: BackendPurchaseResponse): void {
    httpMock.expectOne(URL_ADVANCE).flush(body);
  }

  function thenLaSugerenciaIdEnCursoEs(esperada: OrdenCompra['sugerenciaId']): void {
    expect(service.ordenEnCurso()?.sugerenciaId).toBe(esperada);
  }

  function thenElTotalEnCursoEs(total: number): void {
    expect(service.ordenEnCurso()?.total).toBe(total);
  }

  function thenSeHizoPostAdvance(): ReturnType<HttpTestingController['expectOne']> {
    const req = httpMock.expectOne(URL_ADVANCE);
    expect(req.request.method).toBe('POST');
    return req;
  }

  function thenLaPrimeraOrdenDelPOSTLlevaValores(
    buffetId: string,
    studentId: string,
    buyerType: string,
    recessTime: string,
  ): ReturnType<HttpTestingController['expectOne']> {
    const req = thenSeHizoPostAdvance();
    expect(req.request.body.orders[0].buffetId).toBe(buffetId);
    expect(req.request.body.orders[0].studentId).toBe(studentId);
    expect(req.request.body.orders[0].buyerType).toBe(buyerType);
    expect(req.request.body.orders[0].recessTime).toBe(recessTime);
    return req;
  }

  function thenLaPrimeraOrdenDelPOSTTieneBuyerType(
    buyerType: string,
  ): ReturnType<HttpTestingController['expectOne']> {
    const req = thenSeHizoPostAdvance();
    expect(req.request.body.orders[0].buyerType).toBe(buyerType);
    return req;
  }
});
