import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreferenciasService } from './preferencias.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { environment } from '../../../../environments/environment';

describe('PreferenciasService', () => {
  let service: PreferenciasService;
  let httpMock: HttpTestingController;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['getPerfil', 'obtenerAlumnoId']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PreferenciasService,
        { provide: PerfilService, useValue: perfilServiceSpy }
      ]
    });

    service = TestBed.inject(PreferenciasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería hacer GET a usuarios si el perfil es ALUMNO y el id coincide', () => {
    const mockData = [{ titulo: 'T1', mensaje: 'M1', productoId: '1', razonIA: 'R1' }];
    const state: any = {};

    givenPerfilAlumno('alumno-1');
    whenObtengoPreferencias('alumno-1', res => state.result = res);
    thenPeticionEsHaciaUsuarios('alumno-1', mockData, state);
  });

  it('debería hacer GET a alumnos si el perfil no es ALUMNO', () => {
    const mockData = [{ titulo: 'T1', mensaje: 'M1', productoId: '1', razonIA: 'R1' }];
    const state: any = {};

    givenPerfilTutor();
    whenObtengoPreferencias('alumno-2', res => state.result = res);
    thenPeticionEsHaciaAlumnos('alumno-2', mockData, state);
  });

  it('debería usar fallbackAlumnoId si no hay id proporcionado ni en perfilService', () => {
    const mockData: any[] = [];
    const state: any = {};

    givenSinPerfilNiAlumnoId();
    whenObtengoPreferenciasSinId(res => state.result = res);
    thenPeticionUsaFallbackId(mockData, state);
  });

  function givenPerfilAlumno(id: string): void {
    perfilServiceSpy.getPerfil.and.returnValue({ rol: 'ALUMNO', id: id } as any);
  }

  function givenPerfilTutor(): void {
    perfilServiceSpy.getPerfil.and.returnValue({ rol: 'TUTOR', id: 'tutor-1' } as any);
  }

  function givenSinPerfilNiAlumnoId(): void {
    perfilServiceSpy.getPerfil.and.returnValue(null);
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);
  }

  function whenObtengoPreferencias(id: string, cb: (res: any) => void): void {
    service.getPreferencias(id).subscribe(cb);
  }

  function whenObtengoPreferenciasSinId(cb: (res: any) => void): void {
    service.getPreferencias().subscribe(cb);
  }

  function thenPeticionEsHaciaUsuarios(id: string, mockData: any, state: any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${id}/preferencias?ultima=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
    expect(state.result).toEqual(mockData);
  }

  function thenPeticionEsHaciaAlumnos(id: string, mockData: any, state: any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/${id}/preferencias?ultima=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
    expect(state.result).toEqual(mockData);
  }

  function thenPeticionUsaFallbackId(mockData: any, state: any): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/alumnos/7058aa34-c843-41ca-a8dc-27c496fa7413/preferencias?ultima=true`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
    expect(state.result).toEqual(mockData);
  }
});
