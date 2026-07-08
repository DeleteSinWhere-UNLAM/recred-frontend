import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { SugerenciasService } from '../../../sugerencias/services/sugerencias.service';
import { OrdenAlumnoMother, OrdenCompraMother } from '../../compra.mother';
import { OrdenCompra } from '../../models/orden-compra.model';
import { CarritoService } from '../../services/carrito.service';
import { CompraService } from '../../services/compra.service';
import { ConfirmarPresenter } from './confirmar.presenter';

describe('ConfirmarPresenter', () => {
  let presenter: ConfirmarPresenter;
  let servicioCompra: jasmine.SpyObj<CompraService>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let router: jasmine.SpyObj<Router>;
  let ordenEnCurso: WritableSignal<OrdenCompra | null>;

  beforeEach(() => {
    ordenEnCurso = signal<OrdenCompra | null>(OrdenCompraMother.crear());

    servicioCompra = jasmine.createSpyObj('CompraService', ['procesarPago', 'cancelarOrden'], {
      ordenEnCurso: ordenEnCurso.asReadonly(),
    });
    servicioCarrito = jasmine.createSpyObj('CarritoService', ['limpiarAlumno']);
    servicioSugerencias = jasmine.createSpyObj('SugerenciasService', ['comprarSugerencia']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['perfil', 'rol']);
    servicioPerfil.perfil.and.returnValue({ plan: 'AVANZADO' } as never);
    servicioPerfil.rol.and.returnValue('PADRE');
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        ConfirmarPresenter,
        { provide: CompraService, useValue: servicioCompra },
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: SugerenciasService, useValue: servicioSugerencias },
        { provide: ToastService, useValue: servicioToast },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(ConfirmarPresenter);
  });

  describe('Estado inicial derivado de la orden en curso', () => {
    it('dado una orden en curso, cuando leo ordenes/total/vacia, deberia reflejar el estado', () => {
      expect(presenter.ordenes().length).toBe(1);
      expect(presenter.total()).toBe(500);
      expect(presenter.vacia()).toBeFalse();
    });

    it('dado sin orden en curso, cuando leo vacia, deberia ser true', () => {
      givenSinOrdenEnCurso();

      expect(presenter.vacia()).toBeTrue();
    });
  });

  describe('advertenciaSaldo', () => {
    it('dado todos los alumnos con saldo suficiente, cuando pido la advertencia, no deberia haber ninguna', () => {
      expect(presenter.advertenciaSaldo()).toBeNull();
    });

    it('dado un alumno con saldo insuficiente, cuando pido la advertencia, deberia listar su nombre', () => {
      givenOrdenEnCurso(OrdenCompraMother.crear({
        ordenes: [OrdenAlumnoMother.crearSinSaldo()],
      }));

      expect(presenter.advertenciaSaldo()).toContain('Saldo insuficiente');
    });
  });

  describe('recreoLabel', () => {
    it('dado PRIMER_RECREO, cuando pido el label, deberia devolverlo en espanol', () => {
      expect(presenter.recreoLabel('PRIMER_RECREO')).toBe('1er Recreo');
    });
  });

  describe('formatearFecha', () => {
    it('dado una fecha ISO, cuando formateo, deberia devolverla como dd-MM-yyyy', () => {
      expect(presenter.formatearFecha('2026-07-15')).toBe('15-07-2026');
    });

    it('dado string vacio, cuando formateo, deberia devolver string vacio', () => {
      expect(presenter.formatearFecha('')).toBe('');
    });
  });

  describe('confirmar', () => {
    it('dado una orden sin sugerencia, cuando confirmo, deberia procesar pago, limpiar carrito y navegar a /compra/exito', () => {
      givenProcesarPagoResuelveCon(OrdenCompraMother.crearPagada());

      presenter.confirmar();

      expect(servicioSugerencias.comprarSugerencia).not.toHaveBeenCalled();
      expect(servicioCompra.procesarPago).toHaveBeenCalled();
      expect(servicioCarrito.limpiarAlumno).toHaveBeenCalledWith('alumno-1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra/exito');
    });

    it('dado una orden con sugerenciaId, cuando confirmo, deberia primero comprar la sugerencia y despues procesar pago', () => {
      givenOrdenEnCurso(OrdenCompraMother.crear({ sugerenciaId: 'sug-123' }));
      givenPlan('AVANZADO');
      servicioSugerencias.comprarSugerencia.and.returnValue(of(undefined));
      givenProcesarPagoResuelveCon(OrdenCompraMother.crearPagada());

      presenter.confirmar();

      expect(servicioSugerencias.comprarSugerencia).toHaveBeenCalledWith('sug-123');
      expect(servicioCompra.procesarPago).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra/exito');
    });

    it('dado una orden con sugerenciaId sin plan avanzado, cuando confirmo, deberia bloquear la compra IA', () => {
      givenOrdenEnCurso(OrdenCompraMother.crear({ sugerenciaId: 'sug-123' }));
      givenPlan('INTERMEDIO');

      presenter.confirmar();

      expect(servicioSugerencias.comprarSugerencia).not.toHaveBeenCalled();
      expect(servicioCompra.procesarPago).not.toHaveBeenCalled();
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Comprar sugerencias IA esta disponible con plan Avanzado.',
        'info',
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith('/suscripcion');
    });

    it('dado que el pago falla, cuando confirmo, deberia mostrar el toast de error', () => {
      servicioCompra.procesarPago.and.returnValue(throwError(() => new Error('boom')));

      presenter.confirmar();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'error');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('dado sin orden en curso, cuando confirmo, no deberia hacer nada', () => {
      givenSinOrdenEnCurso();

      presenter.confirmar();

      expect(servicioCompra.procesarPago).not.toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    it('dado la page abierta, cuando cancelo, deberia cancelar la orden y navegar a /compra', () => {
      presenter.cancelar();

      expect(servicioCompra.cancelarOrden).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra');
    });
  });

  function givenOrdenEnCurso(orden: OrdenCompra): void {
    ordenEnCurso.set(orden);
  }

  function givenSinOrdenEnCurso(): void {
    ordenEnCurso.set(null);
  }

  function givenProcesarPagoResuelveCon(orden: OrdenCompra): void {
    servicioCompra.procesarPago.and.returnValue(of(orden));
  }

  function givenPlan(plan: string): void {
    servicioPerfil.perfil.and.returnValue({ plan } as never);
  }
});
