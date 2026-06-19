import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EstadisticaPresenter } from './estadistica.presenter';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';

describe('EstadisticaPresenter', () => {
  let presenter: EstadisticaPresenter;
  let mockRouter: any;
  let mockAlumnosService: any;
  let mockPresupuestoService: any;

  beforeEach(() => {
    mockRouter = {
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    mockAlumnosService = {
      getAlumnoById: jasmine.createSpy('getAlumnoById')
    };

    mockPresupuestoService = {
      getPrediccion: jasmine.createSpy('getPrediccion')
    };

    TestBed.configureTestingModule({
      providers: [
        EstadisticaPresenter,
        { provide: Router, useValue: mockRouter },
        { provide: AlumnosService, useValue: mockAlumnosService },
        { provide: PresupuestoService, useValue: mockPresupuestoService }
      ]
    });

    presenter = TestBed.inject(EstadisticaPresenter);
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(presenter).toBeTruthy();
  });

  describe('init', () => {
    it('dado que no se encuentra al alumno, debe navegar a /tutor', () => {
      mockAlumnosService.getAlumnoById.and.returnValue(undefined);
      
      presenter.init('123');
      
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });

    it('dado que se encuentra al alumno, debe establecer datos y prediccion', () => {
      const mockAlumno = { nombre: 'Juan', apellido: 'Perez', grado: '1A', urlFotoPerfil: 'url' };
      const mockPrediccion = { porcentajePresupuesto: 0 };
      
      mockAlumnosService.getAlumnoById.and.returnValue(mockAlumno);
      mockPresupuestoService.getPrediccion.and.returnValue(mockPrediccion);
      
      presenter.init('123');
      
      expect(presenter.alumno()).toEqual(mockAlumno as any);
      expect(presenter.prediccion()).toEqual(mockPrediccion as any);
      expect(presenter.nombreCompleto()).toBe('Juan Perez');
      expect(presenter.grado()).toBe('1A');
      expect(presenter.urlFotoPerfil()).toBe('url');
      expect(presenter.iniciales()).toBe('JP');
      expect(presenter.nivelAlerta()).toBe('ok');
    });
  });

  it('dado que se acciona volver, debe navegar a /tutor', () => {
    presenter.volver();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/tutor');
  });
});
