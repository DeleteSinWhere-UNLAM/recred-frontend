import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { OrdenAlumnoMother } from '../compra.mother';
import { CompraService } from './compra.service';

describe('CompraService', () => {
  const URL_ADVANCE = `${environment.apiUrl}/purchases/advance`;

  let service: CompraService;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['getPerfil']);
    servicioPerfil.getPerfil.and.returnValue(
      PerfilMother.crear({ id: 'padre-1', rol: 'PADRE' }),
    );

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
      service.iniciarOrden([OrdenAlumnoMother.crear()]);

      expect(service.ordenEnCurso()?.sugerenciaId).toBeUndefined();
    });

    it('dado una sugerencia pendiente, cuando inicio sin pasar id, deberia usar la pendiente', () => {
      service.setSugerenciaPendiente('sug-pendiente');

      service.iniciarOrden([OrdenAlumnoMother.crear()]);

      expect(service.ordenEnCurso()?.sugerenciaId).toBe('sug-pendiente');
    });

    it('dado una sugerencia pendiente ya consumida, cuando inicio otra, no deberia arrastrarla', () => {
      service.setSugerenciaPendiente('sug-pendiente');
      service.iniciarOrden([OrdenAlumnoMother.crear()]);

      service.iniciarOrden([OrdenAlumnoMother.crear()]);

      expect(service.ordenEnCurso()?.sugerenciaId).toBeUndefined();
    });

    it('dado un id explicito y una pendiente, cuando inicio, deberia priorizar el explicito', () => {
      service.setSugerenciaPendiente('sug-pendiente');

      service.iniciarOrden([OrdenAlumnoMother.crear()], 'sug-explicita');

      expect(service.ordenEnCurso()?.sugerenciaId).toBe('sug-explicita');
    });

    it('dado ordenes con distintos subtotales, cuando inicio, deberia calcular el total como suma de subtotales', () => {
      const ordenes = [
        OrdenAlumnoMother.crear({ subtotal: 500 }),
        OrdenAlumnoMother.crear({ subtotal: 300 }),
      ];

      service.iniciarOrden(ordenes);

      expect(service.ordenEnCurso()?.total).toBe(800);
    });
  });

  describe('procesarPago', () => {
    it('dado sin orden en curso, cuando proceso, deberia devolver una orden vacia sin llamar al back', async () => {
      const resultado = await firstValueFrom(service.procesarPago());

      expect(resultado.ordenes).toEqual([]);
      httpMock.expectNone(URL_ADVANCE);
    });

    it('dado un tutor y ordenes, cuando proceso, deberia hacer POST con buyerType TUTOR y mapear recessTime', async () => {
      service.iniciarOrden([
        OrdenAlumnoMother.crear({
          alumno: { ...OrdenAlumnoMother.crear().alumno, id: 'alumno-1' },
          buffetId: 'buffet-x',
          recreo: 'SEGUNDO_RECREO',
        }),
      ]);

      const promesa = firstValueFrom(service.procesarPago());
      const req = httpMock.expectOne(URL_ADVANCE);

      expect(req.request.method).toBe('POST');
      expect(req.request.body.orders[0].buffetId).toBe('buffet-x');
      expect(req.request.body.orders[0].studentId).toBe('alumno-1');
      expect(req.request.body.orders[0].buyerType).toBe('TUTOR');
      expect(req.request.body.orders[0].recessTime).toBe('SECOND_RECESS');

      req.flush({ orderId: 'orden-1', codes: { 'alumno-1': 'ABC' }, total: 500 });
      const pagada = await promesa;
      expect(pagada.id).toBe('orden-1');
      expect(pagada.codigos).toEqual({ 'alumno-1': 'ABC' });
      expect(service.ultimaOrden()?.id).toBe('orden-1');
      expect(service.ordenEnCurso()).toBeNull();
    });

    it('dado un rol ALUMNO, cuando proceso, deberia mandar buyerType STUDENT', async () => {
      servicioPerfil.getPerfil.and.returnValue(
        PerfilMother.crear({ id: 'alumno-x', rol: 'ALUMNO' }),
      );
      service.iniciarOrden([OrdenAlumnoMother.crear()]);

      const promesa = firstValueFrom(service.procesarPago());
      const req = httpMock.expectOne(URL_ADVANCE);
      expect(req.request.body.orders[0].buyerType).toBe('STUDENT');
      req.flush({ orderId: 'x', codes: {}, total: 0 });
      await promesa;
    });

    it('dado que no hay perfil, cuando proceso, deberia tirar el error de usuario no autenticado', () => {
      servicioPerfil.getPerfil.and.returnValue(null);
      service.iniciarOrden([OrdenAlumnoMother.crear()]);

      expect(() => service.procesarPago()).toThrowError(
        'Usuario no autenticado o sin perfil.',
      );
    });
  });

  describe('cancelarOrden', () => {
    it('dado una orden en curso, cuando cancelo, deberia dejar la orden en null', () => {
      service.iniciarOrden([OrdenAlumnoMother.crear()]);

      service.cancelarOrden();

      expect(service.ordenEnCurso()).toBeNull();
    });
  });

  describe('deliver', () => {
    it('dado un purchaseId y un code, cuando entrego, deberia hacer POST /purchases/{id}/deliver con el withdrawalCode', async () => {
      const promesa = firstValueFrom(service.deliver('compra-1', 'CODE'));

      const req = httpMock.expectOne(`${environment.apiUrl}/purchases/compra-1/deliver`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ withdrawalCode: 'CODE' });
      req.flush(null);
      await promesa;
    });
  });
});
