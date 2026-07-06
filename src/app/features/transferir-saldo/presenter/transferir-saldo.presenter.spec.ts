import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BilleteraService } from '../../billetera/services/billetera.service';
import { TransferirSaldoPresenter } from './transferir-saldo.presenter';

const ALUMNO_ID = 'alumno-1';
const OTRO_ALUMNO_ID = 'alumno-2';

class ResumenBilleteraMother {
  static crearVacio(): { movimientos: never[] } {
    return { movimientos: [] };
  }

  static crearConTransferencias(): { movimientos: unknown[] } {
    return {
      movimientos: [
        {
          id: 'mov-1',
          tipo: 'AJUSTE',
          descripcion: 'Transferencia enviada a Ana',
          direccion: 'SALIDA',
          monto: -500,
          fechaHora: '2026-07-01T10:00:00Z',
        },
        {
          id: 'mov-2',
          tipo: 'AJUSTE',
          descripcion: 'Transferencia recibida de Papá',
          direccion: 'ENTRADA',
          monto: 800,
          fechaHora: '2026-07-02T11:00:00Z',
        },
      ],
    };
  }
}

describe('TransferirSaldoPresenter', () => {
  let presenter: TransferirSaldoPresenter;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let billeteraService: jasmine.SpyObj<BilleteraService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    alumnosService = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
      'cargarHijosDelTutor',
      'alumnos',
    ]);
    billeteraService = jasmine.createSpyObj<BilleteraService>('BilleteraService', [
      'getResumen',
      'transferirSaldo',
    ]);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    alumnosService.asegurarCargados.and.resolveTo([]);
    alumnosService.cargarHijosDelTutor.and.resolveTo([]);
    (alumnosService.alumnos as unknown as jasmine.Spy).and.returnValue([
      AlumnoMother.crear({ id: ALUMNO_ID, saldo: 1000 }),
      AlumnoMother.crear({ id: OTRO_ALUMNO_ID, saldo: 500 }),
    ]);
    alumnosService.getAlumnoById.and.returnValue(
      AlumnoMother.crear({ id: ALUMNO_ID, saldo: 1000, nombre: 'Juan', apellido: 'Perez', grado: '5to A' }),
    );
    billeteraService.getResumen.and.returnValue(of(ResumenBilleteraMother.crearVacio()) as never);
    billeteraService.transferirSaldo.and.returnValue(of(undefined) as never);

    TestBed.configureTestingModule({
      providers: [
        TransferirSaldoPresenter,
        { provide: AlumnosService, useValue: alumnosService },
        { provide: BilleteraService, useValue: billeteraService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(TransferirSaldoPresenter);
  });

  describe('init', () => {
    it('dado un alumnoId valido, cuando inicializo, deberia cargar el alumno origen y limpiar cargando', async () => {
      await presenter.init(ALUMNO_ID);

      expect(alumnosService.asegurarCargados).toHaveBeenCalled();
      expect(alumnosService.getAlumnoById).toHaveBeenCalledWith(ALUMNO_ID);
      expect(presenter.alumnoOrigen()?.id).toBe(ALUMNO_ID);
      expect(presenter.nombreCompleto()).toBe('Juan Perez');
      expect(presenter.grado()).toBe('5to A');
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado que el alumno no existe, cuando inicializo, deberia navegar a /tutor', async () => {
      givenAlumnoInexistente();

      await presenter.init('inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(presenter.alumnoOrigen()).toBeUndefined();
    });

    it('dado un resumen con transferencias, cuando inicializo, deberia mapear las transferencias al VM', async () => {
      givenResumenDelBack(ResumenBilleteraMother.crearConTransferencias());

      await presenter.init(ALUMNO_ID);

      const transferencias = presenter.historialTransferencias();
      expect(transferencias.length).toBe(2);
      expect(transferencias[0].tipo).toBe('ENVIADA');
      expect(transferencias[0].montoFormateado).toContain('500');
      expect(transferencias[1].tipo).toBe('RECIBIDA');
    });

    it('dado que la carga falla, cuando inicializo, deberia mostrar toast de error y dejar cargando en false', async () => {
      spyOn(console, 'error');
      alumnosService.asegurarCargados.and.rejectWith(new Error('boom'));

      await presenter.init(ALUMNO_ID);

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'No pudimos cargar la información del alumno.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('otrosHijos', () => {
    it('dado el alumno origen cargado, cuando pido otrosHijos, deberia devolver los demas hijos del tutor', async () => {
      await presenter.init(ALUMNO_ID);

      const otros = presenter.otrosHijos();
      expect(otros.length).toBe(1);
      expect(otros[0].id).toBe(OTRO_ALUMNO_ID);
    });

    it('dado sin alumno origen, cuando pido otrosHijos, deberia devolver lista vacia', () => {
      expect(presenter.otrosHijos()).toEqual([]);
    });
  });

  describe('transferir', () => {
    beforeEach(async () => {
      await presenter.init(ALUMNO_ID);
    });

    it('dado sin destino, cuando transfiero, deberia mostrar toast de error y devolver false', async () => {
      const resultado = await presenter.transferir('', 100);

      expect(resultado).toBeFalse();
      expect(toastService.mostrar).toHaveBeenCalledWith('Debes seleccionar un hijo de destino.', 'error');
      expect(billeteraService.transferirSaldo).not.toHaveBeenCalled();
    });

    it('dado un monto 0 o negativo, cuando transfiero, deberia mostrar toast de error', async () => {
      const resultado = await presenter.transferir(OTRO_ALUMNO_ID, 0);

      expect(resultado).toBeFalse();
      expect(toastService.mostrar).toHaveBeenCalledWith('El monto debe ser mayor a 0.', 'error');
    });

    it('dado un monto mayor al saldo, cuando transfiero, deberia mostrar toast de error', async () => {
      const resultado = await presenter.transferir(OTRO_ALUMNO_ID, 99999);

      expect(resultado).toBeFalse();
      expect(toastService.mostrar).toHaveBeenCalledWith(
        'El monto a transferir no puede superar el saldo actual.',
        'error',
      );
    });

    it('dado una transferencia valida, cuando transfiero, deberia llamar al service y mostrar toast de exito', async () => {
      const resultado = await presenter.transferir(OTRO_ALUMNO_ID, 500);

      expect(billeteraService.transferirSaldo).toHaveBeenCalledWith(ALUMNO_ID, OTRO_ALUMNO_ID, 500);
      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Transferencia realizada correctamente.',
        'success',
      );
      expect(resultado).toBeTrue();
    });

    it('dado que el service falla, cuando transfiero, deberia mostrar toast de error y devolver false', async () => {
      spyOn(console, 'error');
      billeteraService.transferirSaldo.and.returnValue(throwError(() => new Error('boom')) as never);

      const resultado = await presenter.transferir(OTRO_ALUMNO_ID, 500);

      expect(resultado).toBeFalse();
      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Hubo un problema al realizar la transferencia. Intentá de nuevo más tarde.',
        'error',
      );
    });
  });

  describe('volver', () => {
    it('dado el presenter, cuando llamo volver, deberia navegar a /tutor', () => {
      presenter.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  function givenAlumnoInexistente(): void {
    alumnosService.getAlumnoById.and.returnValue(undefined);
  }

  function givenResumenDelBack(resumen: unknown): void {
    billeteraService.getResumen.and.returnValue(of(resumen) as never);
  }
});
