import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PreferenciasDetectadasService } from './preferencias-detectadas.service';
import { PreferenciaDetectada } from '../models/preferencia-detectada.model';
import { PreferenciasDetectadasMother } from '../preferencias-detectadas.mother';

describe('PreferenciasDetectadasService', () => {
  let service: PreferenciasDetectadasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PreferenciasDetectadasService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PreferenciasDetectadasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Obtención de preferencias', () => {
    it('debería solicitar las preferencias del tutor realizando un GET al endpoint correspondiente', () => {
      
      const userIdMock = 'user-123';
      const mockRespuesta: PreferenciaDetectada[] = [PreferenciasDetectadasMother.crearPreferencia()];
      let respuestaObtenida: PreferenciaDetectada[] | undefined;

      service.getPreferencias(userIdMock).subscribe((data) => {
        respuestaObtenida = data;
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userIdMock}/preferencias?tipo=PREFERENCIA_DETECTADA`);
      req.flush(mockRespuesta);

      expect(req.request.method).toBe('GET');
      expect(respuestaObtenida).toEqual(mockRespuesta);
    });
  });
});
