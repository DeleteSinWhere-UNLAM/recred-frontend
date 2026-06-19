import { TestBed } from '@angular/core/testing';
import { ConfirmarPresenter } from './confirmar.presenter';
import { CompraService } from '../../services/compra.service';
import { CarritoService } from '../../services/carrito.service';
import { SugerenciasService } from '../../../sugerencias/services/sugerencias.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { OrdenCompra } from '../../models/orden-compra.model';

describe('ConfirmarPresenter', () => {
  let presenter: ConfirmarPresenter;
  let compraServiceSpy: jasmine.SpyObj<CompraService>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let sugerenciasServiceSpy: jasmine.SpyObj<SugerenciasService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    compraServiceSpy = jasmine.createSpyObj('CompraService', ['procesarPago', 'cancelarOrden']);
    carritoServiceSpy = jasmine.createSpyObj('CarritoService', ['limpiarAlumno']);
    sugerenciasServiceSpy = jasmine.createSpyObj('SugerenciasService', ['comprarSugerencia']);
    toastSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    // Mock ordenEnCurso as a signal property
    (compraServiceSpy as any).ordenEnCurso = signal<OrdenCompra | null>(null);

    TestBed.configureTestingModule({
      providers: [
        ConfirmarPresenter,
        { provide: CompraService, useValue: compraServiceSpy },
        { provide: CarritoService, useValue: carritoServiceSpy },
        { provide: SugerenciasService, useValue: sugerenciasServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    presenter = TestBed.inject(ConfirmarPresenter);
  });

  it('deberia crearse', () => {
    expect(presenter).toBeTruthy();
  });

  describe('computeds iniciales', () => {
    it('debe tener valores por defecto si no hay orden', () => {
      expect(presenter.vacia()).toBeTrue();
      expect(presenter.total()).toBe(0);
      expect(presenter.ordenes().length).toBe(0);
      expect(presenter.advertenciaSaldo()).toBeNull();
    });

    it('debe calcular advertencia de saldo y totales', () => {
      const mockOrden: OrdenCompra = {
        id: '1',
        total: 500,
        codigos: {},
        ordenes: [
          { alumno: { id: 'a1', nombre: 'Juan', saldo: 100 } as any, subtotal: 200, items: [], buffetId: 'b', fecha: 'f', recreo: 'PRIMER_RECREO' },
          { alumno: { id: 'a2', nombre: 'Maria', saldo: 500 } as any, subtotal: 300, items: [], buffetId: 'b', fecha: 'f', recreo: 'PRIMER_RECREO' }
        ]
      };
      (compraServiceSpy as any).ordenEnCurso.set(mockOrden);

      expect(presenter.vacia()).toBeFalse();
      expect(presenter.total()).toBe(500);
      expect(presenter.advertenciaSaldo()).toContain('Saldo insuficiente para: Juan');
    });

    it('recreoLabel debe retornar el label correcto', () => {
      expect(presenter.recreoLabel('PRIMER_RECREO')).toBe('1er Recreo');
    });
  });

  describe('confirmar', () => {
    it('no debe hacer nada si esta cargando o vacia', () => {
      presenter.confirmar(); // Vacia = true
      expect(compraServiceSpy.procesarPago).not.toHaveBeenCalled();
    });

    it('procesa el pago exitosamente sin sugerenciaId', () => {
      const mockOrden: OrdenCompra = {
        id: '1',
        total: 100,
        codigos: {},
        ordenes: [
          { alumno: { id: 'a1' } as any, subtotal: 100, items: [], buffetId: 'b', fecha: 'f', recreo: 'PRIMER_RECREO' }
        ]
      };
      (compraServiceSpy as any).ordenEnCurso.set(mockOrden);
      compraServiceSpy.procesarPago.and.returnValue(of(mockOrden));

      presenter.confirmar();

      expect(compraServiceSpy.procesarPago).toHaveBeenCalled();
      expect(carritoServiceSpy.limpiarAlumno).toHaveBeenCalledWith('a1');
      expect(presenter.cargando()).toBeFalse();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/compra/exito');
    });

    it('procesa el pago usando comprarSugerencia si tiene sugerenciaId', () => {
      const mockOrden: OrdenCompra = {
        id: '1',
        total: 100,
        codigos: {},
        sugerenciaId: 'sug-1',
        ordenes: [
          { alumno: { id: 'a1' } as any, subtotal: 100, items: [], buffetId: 'b', fecha: 'f', recreo: 'PRIMER_RECREO' }
        ]
      };
      (compraServiceSpy as any).ordenEnCurso.set(mockOrden);
      
      sugerenciasServiceSpy.comprarSugerencia.and.returnValue(of({} as any));
      compraServiceSpy.procesarPago.and.returnValue(of(mockOrden));

      presenter.confirmar();

      expect(sugerenciasServiceSpy.comprarSugerencia).toHaveBeenCalledWith('sug-1');
      expect(compraServiceSpy.procesarPago).toHaveBeenCalled();
    });

    it('maneja error en el pago', () => {
      const mockOrden: OrdenCompra = {
        id: '1', total: 100, codigos: {}, ordenes: [
          { alumno: { id: 'a1' } as any, subtotal: 100, items: [], buffetId: 'b', fecha: 'f', recreo: 'PRIMER_RECREO' }
        ]
      };
      (compraServiceSpy as any).ordenEnCurso.set(mockOrden);
      compraServiceSpy.procesarPago.and.returnValue(throwError(() => new Error('Error')));

      presenter.confirmar();

      expect(toastSpy.mostrar).toHaveBeenCalledWith('No pudimos procesar el pago. Intentalo de nuevo.', 'error');
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('cancelar', () => {
    it('debe cancelar orden y navegar', () => {
      presenter.cancelar();
      expect(compraServiceSpy.cancelarOrden).toHaveBeenCalled();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/compra');
    });
  });
});
