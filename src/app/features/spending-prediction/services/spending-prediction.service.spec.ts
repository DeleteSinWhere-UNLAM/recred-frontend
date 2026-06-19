import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SpendingPredictionService } from './spending-prediction.service';
import { environment } from '../../../../environments/environment';
import { SpendingPrediction } from '../models/spending-prediction.interface';

describe('SpendingPredictionService', () => {
  let service: SpendingPredictionService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SpendingPredictionService]
    });
    service = TestBed.inject(SpendingPredictionService);
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
      const mockResponse: SpendingPrediction = {} as any;

      service.getPrediction(alumnoId).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/ia/alumnos/${alumnoId}/prediccion-gasto`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('dado que falta alumnoId, debe arrojar un error', () => {
      expect(() => service.getPrediction('')).toThrowError('No se encontró el ID del alumno para obtener la predicción.');
      expect(() => service.getPrediction(null as any)).toThrowError('No se encontró el ID del alumno para obtener la predicción.');
      expect(() => service.getPrediction(undefined as any)).toThrowError('No se encontró el ID del alumno para obtener la predicción.');
    });
  });
});
