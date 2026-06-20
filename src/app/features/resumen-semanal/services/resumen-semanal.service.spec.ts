import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResumenSemanalService } from './resumen-semanal.service';
import { environment } from '../../../../environments/environment';
import { ResumenSemanal } from '../models/resumen-semanal.model';

describe('ResumenSemanalService', () => {
  let service: ResumenSemanalService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResumenSemanalService]
    });
    service = TestBed.inject(ResumenSemanalService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('dado que se inyecta, debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getResumen', () => {
    it('dado que se requiere resumen semanal, debe llamar a GET', () => {
      const usuarioId = '123';
      const mockResponse: ResumenSemanal = { usuarioId } as any;

      service.getResumen(usuarioId).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/resumen/${usuarioId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
