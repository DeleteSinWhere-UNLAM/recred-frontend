import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { ExitoPresenter } from './exito.presenter';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { CompraService } from '../../services/compra.service';

describe('ExitoPresenter', () => {
  let presenter: ExitoPresenter;
  let mockRouter: any;
  let mockUsuarioService: any;
  let mockCompraService: any;

  beforeEach(() => {
    mockRouter = {
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    mockUsuarioService = {
      homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/home-tutor')
    };

    mockCompraService = {
      ultimaOrden: signal({
        ordenes: [{ id: '1' }],
        codigos: { 'alumno1': 'ABCD' },
        total: 1000
      })
    };

    TestBed.configureTestingModule({
      providers: [
        ExitoPresenter,
        { provide: Router, useValue: mockRouter },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: CompraService, useValue: mockCompraService }
      ]
    });

    presenter = TestBed.inject(ExitoPresenter);
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(presenter).toBeTruthy();
  });

  it('dado que se inicializa, debe computar ordenes, codigos, total y vacia correctamente', () => {
    expect(presenter.ordenes()).toEqual([{ id: '1' }] as any);
    expect(presenter.codigos()).toEqual({ 'alumno1': 'ABCD' });
    expect(presenter.total()).toBe(1000);
    expect(presenter.vacia()).toBeFalse();
  });

  it('dado que se provee un alumnoId, debe retornar el codigo correcto', () => {
    expect(presenter.codigoDe('alumno1')).toBe('ABCD');
    expect(presenter.codigoDe('alumno2')).toBe('----');
  });

  it('dado que se invoca volverInicio(), debe navegar al homeUrl', () => {
    presenter.volverInicio();
    expect(mockUsuarioService.homeUrl).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home-tutor');
  });

  it('dado que se invoca verPendientes(), debe navegar a pendientes', () => {
    presenter.verPendientes();
    expect(mockUsuarioService.homeUrl).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home-tutor');
  });
});
