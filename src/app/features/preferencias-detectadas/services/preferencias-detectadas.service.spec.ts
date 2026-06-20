import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreferenciasDetectadasService } from './preferencias-detectadas.service';
import { environment } from '../../../../environments/environment';
import { PreferenciaDetectada } from '../models/preferencia-detectada.model';

describe('PreferenciasDetectadasService', () => {
  let service: PreferenciasDetectadasService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PreferenciasDetectadasService]
    });
    service = TestBed.inject(PreferenciasDetectadasService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getPreferencias', () => {
    it('dado que se requieren preferencias, debe llamar a GET', () => {
      const usuarioId = '456';
      const mockResponse: PreferenciaDetectada[] = [];

      service.getPreferencias(usuarioId).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/usuarios/${usuarioId}/preferencias?tipo=PREFERENCIA_DETECTADA`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
