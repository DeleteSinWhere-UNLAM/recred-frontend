import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PrediccionGastoService } from './prediccion-gasto.service';
import { environment } from '../../../../environments/environment';
import { PrediccionGasto } from '../models/prediccion-gasto.model';

describe('PrediccionGastoService', () => {
  let service: PrediccionGastoService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PrediccionGastoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PrediccionGastoService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getPrediction', () => {
    it('dado que se requiere prediccion, debe llamar a GET', () => {
      const alumnoId = '123';
      const mockResponse: PrediccionGasto = {} as any;

      service.getPrediction(alumnoId).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(
        `${environment.apiUrl}/ia/alumnos/${alumnoId}/prediccion-gasto`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('dado que falta alumnoId, debe arrojar un error', () => {
      expect(() => service.getPrediction('')).toThrowError(
        'No se encontró el ID del alumno para obtener la predicción.',
      );
      expect(() => service.getPrediction(null as any)).toThrowError(
        'No se encontró el ID del alumno para obtener la predicción.',
      );
      expect(() => service.getPrediction(undefined as any)).toThrowError(
        'No se encontró el ID del alumno para obtener la predicción.',
      );
    });
  });
});
