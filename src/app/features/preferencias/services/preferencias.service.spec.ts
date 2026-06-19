import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PreferenciasService } from './preferencias.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { environment } from '../../../../environments/environment';
import { Preferencia } from '../models/preferencia.model';

describe('PreferenciasService', () => {
  let service: PreferenciasService;
  let httpMock: HttpTestingController;
  let mockPerfilService: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    mockPerfilService = jasmine.createSpyObj('PerfilService', ['getPerfil', 'obtenerAlumnoId']);

    TestBed.configureTestingModule({
      providers: [
        PreferenciasService,
        { provide: PerfilService, useValue: mockPerfilService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PreferenciasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('dado que el perfil es ALUMNO y es el id solicitado, la ruta de la api debe ser usuarios/{id}', () => {
    const alumnoId = '123';
    mockPerfilService.obtenerAlumnoId.and.returnValue(alumnoId);
    mockPerfilService.getPerfil.and.returnValue({ rol: 'ALUMNO', id: '123' } as any);

    const expectedUrl = `${environment.apiUrl}/usuarios/123/preferencias?ultima=true`;

    service.getPreferencias().subscribe();

    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('dado que el perfil NO es ALUMNO (ej tutor), la ruta debe ser alumnos/{id}', () => {
    const alumnoId = '123';
    mockPerfilService.obtenerAlumnoId.and.returnValue(alumnoId);
    mockPerfilService.getPerfil.and.returnValue({ rol: 'PADRE', id: '999' } as any);

    const expectedUrl = `${environment.apiUrl}/alumnos/123/preferencias?ultima=true`;

    service.getPreferencias().subscribe();

    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('dado que obtenerAlumnoId es nulo, debe usar el fallback id', () => {
    mockPerfilService.obtenerAlumnoId.and.returnValue(null);
    mockPerfilService.getPerfil.and.returnValue(null as any); // sin perfil
    
    // el fallbackAlumnoId definido en el servicio es '7058aa34-c843-41ca-a8dc-27c496fa7413'
    const expectedUrl = `${environment.apiUrl}/alumnos/7058aa34-c843-41ca-a8dc-27c496fa7413/preferencias?ultima=true`;

    service.getPreferencias().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].titulo).toBe('Mock Preferencia');
    });

    const req = httpMock.expectOne(expectedUrl);
    req.flush([{ titulo: 'Mock Preferencia' }] as Preferencia[]);
  });
});
