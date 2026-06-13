import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConfirmarPresenter } from './confirmar.presenter';
import { CompraService } from '../../services/compra.service';
import { CarritoService } from '../../services/carrito.service';
import { SugerenciasService } from '../../../sugerencias/services/sugerencias.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { signal } from '@angular/core';

import { OrdenCompra } from '../../models/orden-compra.model';

import { Alumno } from '../../../../data-access/models/alumno.model';

describe('ConfirmarPresenter', () => {
  let presenter: ConfirmarPresenter;
  let compraServiceSpy: jasmine.SpyObj<CompraService>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let sugerenciasServiceSpy: jasmine.SpyObj<SugerenciasService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockOrdenBase: OrdenCompra = {
    id: '',
    total: 100,
    ordenes: [
      { alumno: { id: 'alumno-1', nombre: 'Juan' } as unknown as Alumno, subtotal: 100, items: [], fecha: '', recreo: 'PRIMER_RECREO' }
    ],
    codigos: {}
  };

  // Usamos un signal real para que la reactividad funcione en el presenter
  const ordenEnCursoSignal = signal<OrdenCompra | null>(mockOrdenBase);

  beforeEach(() => {
    compraServiceSpy = jasmine.createSpyObj('CompraService', ['procesarPago', 'cancelarOrden'], {
      ordenEnCurso: ordenEnCursoSignal.asReadonly()
    });
    carritoServiceSpy = jasmine.createSpyObj('CarritoService', ['limpiarAlumno']);
    sugerenciasServiceSpy = jasmine.createSpyObj('SugerenciasService', ['comprarSugerencia']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        ConfirmarPresenter,
        { provide: CompraService, useValue: compraServiceSpy },
        { provide: CarritoService, useValue: carritoServiceSpy },
        { provide: SugerenciasService, useValue: sugerenciasServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
      ]
    });

    presenter = TestBed.inject(ConfirmarPresenter);
    ordenEnCursoSignal.set(mockOrdenBase); // Resetear al valor base
  });

  it('debe confirmar la compra SIN sugerenciaId correctamente', () => {
    compraServiceSpy.procesarPago.and.returnValue(of({ ...mockOrdenBase, id: 'orden-1' }));

    presenter.confirmar();

    expect(sugerenciasServiceSpy.comprarSugerencia).not.toHaveBeenCalled();
    expect(compraServiceSpy.procesarPago).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/compra/exito');
  });

  it('debe confirmar la compra CON sugerenciaId llamando primero al servicio de sugerencias', () => {
    const ordenConSugerencia = { ...mockOrdenBase, sugerenciaId: 'sug-123' };
    ordenEnCursoSignal.set(ordenConSugerencia);
    
    sugerenciasServiceSpy.comprarSugerencia.and.returnValue(of(undefined));
    compraServiceSpy.procesarPago.and.returnValue(of({ ...ordenConSugerencia, id: 'orden-1' }));

    presenter.confirmar();

    expect(sugerenciasServiceSpy.comprarSugerencia).toHaveBeenCalledWith('sug-123');
    expect(compraServiceSpy.procesarPago).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/compra/exito');
  });

  it('debe mostrar toast de error si falla el pago', () => {
    compraServiceSpy.procesarPago.and.returnValue(throwError(() => new Error('Error')));

    presenter.confirmar();

    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });
});
