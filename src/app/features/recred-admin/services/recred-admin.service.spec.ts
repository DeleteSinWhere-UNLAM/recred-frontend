import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecredAdminService } from './recred-admin.service';
import { environment } from '../../../../environments/environment';
import { SchoolRegistration } from '../models/solicitud-colegio.model';

describe('RecredAdminService', () => {
  let service: RecredAdminService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/school-registrations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecredAdminService]
    });
    service = TestBed.inject(RecredAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería obtener solicitudes pendientes', () => {
    const mockData: SchoolRegistration[] = [];
    let result: any;
    
    whenObtenerSolicitudesPendientes((res) => result = res);
    thenSolicitudEsGetYDevuelve(mockData, result);
  });

  it('debería aprobar una solicitud', () => {
    let result: any;
    
    whenAprobarSolicitud('123', (res) => result = res);
    thenSolicitudEsAprobarPostYDevuelveVacio(result);
  });

  it('debería rechazar una solicitud', () => {
    let result: any;
    
    whenRechazarSolicitud('123', (res) => result = res);
    thenSolicitudEsRechazarPostYDevuelveVacio(result);
  });

  function whenObtenerSolicitudesPendientes(cb: (res: any) => void): void {
    service.getPendingRegistrations().subscribe(cb);
  }

  function whenAprobarSolicitud(id: string, cb: (res: any) => void): void {
    service.approveRegistration(id).subscribe(cb);
  }

  function whenRechazarSolicitud(id: string, cb: (res: any) => void): void {
    service.rejectRegistration(id).subscribe(cb);
  }

  function thenSolicitudEsGetYDevuelve(mockData: any, result: any): void {
    const req = httpMock.expectOne(`${apiUrl}?status=PENDING`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
    expect(result).toEqual(mockData);
  }

  function thenSolicitudEsAprobarPostYDevuelveVacio(result: any): void {
    const req = httpMock.expectOne(`${apiUrl}/123/approve`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    expect(result).toBeNull();
  }

  function thenSolicitudEsRechazarPostYDevuelveVacio(result: any): void {
    const req = httpMock.expectOne(`${apiUrl}/123/reject`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    expect(result).toBeNull();
  }
});
