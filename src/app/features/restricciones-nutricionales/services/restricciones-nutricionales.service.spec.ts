import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import {
  ClasificacionSaludBackend,
  RestriccionesNutricionalesService,
} from './restricciones-nutricionales.service';

describe('RestriccionesNutricionalesService', () => {
  const apiBase = environment.apiUrl;
  let service: RestriccionesNutricionalesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestriccionesNutricionalesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RestriccionesNutricionalesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getCatalogo pega a /clasificaciones-salud', async () => {
    const catalogoEsperado: ClasificacionSaludBackend[] = [
      { id: 'uuid-1', descripcion: 'Sin TACC', activo: true },
      { id: 'uuid-2', descripcion: 'Sin azúcar', activo: true },
    ];

    const promesa = service.getCatalogo();
    const req = httpMock.expectOne(`${apiBase}/clasificaciones-salud`);
    expect(req.request.method).toBe('GET');
    req.flush(catalogoEsperado);

    await expectAsync(promesa).toBeResolvedTo(catalogoEsperado);
  });

  it('getRestriccionesAlumno usa la ruta de control-parental con el alumnoId', async () => {
    const alumnoId = 'alumno-42';
    const activas: ClasificacionSaludBackend[] = [
      { id: 'uuid-1', descripcion: 'Sin TACC', activo: true },
    ];

    const promesa = service.getRestriccionesAlumno(alumnoId);
    const req = httpMock.expectOne(
      `${apiBase}/control-parental/alumnos/${alumnoId}/obtener-restricciones-salud`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(activas);

    await expectAsync(promesa).toBeResolvedTo(activas);
  });

  it('actualizarRestricciones manda PUT con clasificacionesIds en el body', async () => {
    const alumnoId = 'alumno-42';
    const ids = ['uuid-1', 'uuid-3'];

    const promesa = service.actualizarRestricciones(alumnoId, ids);
    const req = httpMock.expectOne(
      `${apiBase}/control-parental/alumnos/${alumnoId}/actualizar-restricciones-salud`,
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ clasificacionesIds: ids });
    req.flush(null);

    await expectAsync(promesa).toBeResolved();
  });

  it('rechaza la promesa cuando el back devuelve error', async () => {
    const promesa = service.getCatalogo();
    const req = httpMock.expectOne(`${apiBase}/clasificaciones-salud`);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    await expectAsync(promesa).toBeRejected();
  });
});
