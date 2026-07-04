import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  ALUMNO_ID_TEST,
  FALLBACK_ALUMNO_ID,
  PreferenciaMother,
} from '../preferencias.mother';
import { PreferenciasService } from './preferencias.service';

describe('PreferenciasService', () => {
  let service: PreferenciasService;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['getPerfil', 'obtenerAlumnoId']);
    servicioPerfil.getPerfil.and.returnValue(null);
    servicioPerfil.obtenerAlumnoId.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        PreferenciasService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });
    service = TestBed.inject(PreferenciasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('resolucion del alumnoId', () => {
    it('dado un alumnoId explicito, cuando pido preferencias, deberia usarlo aunque haya uno en el perfil', async () => {
      servicioPerfil.obtenerAlumnoId.and.returnValue('otro-alumno');

      const promesa = firstValueFrom(service.getPreferencias(ALUMNO_ID_TEST));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${ALUMNO_ID_TEST}/preferencias?ultima=true`,
      );
      expect(req.request.method).toBe('GET');
      req.flush([PreferenciaMother.crear()]);
      await promesa;
    });

    it('dado sin alumnoId explicito pero con uno en el perfil, deberia usar el del perfil', async () => {
      servicioPerfil.obtenerAlumnoId.and.returnValue('alumno-perfil');

      const promesa = firstValueFrom(service.getPreferencias());
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/alumno-perfil/preferencias?ultima=true`,
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
      await promesa;
    });

    it('dado sin alumnoId explicito ni en el perfil, deberia usar el fallback interno', async () => {
      const promesa = firstValueFrom(service.getPreferencias());
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${FALLBACK_ALUMNO_ID}/preferencias?ultima=true`,
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
      await promesa;
    });
  });

  describe('getPath segun el perfil', () => {
    it('dado un perfil ALUMNO con mismo id que el alumnoId, deberia usar la ruta /usuarios/{id}', async () => {
      servicioPerfil.getPerfil.and.returnValue(
        PerfilMother.crear({ id: ALUMNO_ID_TEST, rol: 'ALUMNO' }),
      );

      const promesa = firstValueFrom(service.getPreferencias(ALUMNO_ID_TEST));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/usuarios/${ALUMNO_ID_TEST}/preferencias?ultima=true`,
      );
      expect(req.request.url).toContain(`/usuarios/${ALUMNO_ID_TEST}`);
      req.flush([]);
      await promesa;
    });

    it('dado un perfil PADRE, deberia usar la ruta /alumnos/{id}', async () => {
      servicioPerfil.getPerfil.and.returnValue(PerfilMother.crearTutor());

      const promesa = firstValueFrom(service.getPreferencias(ALUMNO_ID_TEST));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${ALUMNO_ID_TEST}/preferencias?ultima=true`,
      );
      expect(req.request.url).toContain(`/alumnos/${ALUMNO_ID_TEST}`);
      req.flush([]);
      await promesa;
    });

    it('dado un perfil ALUMNO pero con id distinto al alumnoId, deberia usar la ruta /alumnos/{id}', async () => {
      servicioPerfil.getPerfil.and.returnValue(
        PerfilMother.crear({ id: 'otro-id', rol: 'ALUMNO' }),
      );

      const promesa = firstValueFrom(service.getPreferencias(ALUMNO_ID_TEST));
      const req = httpMock.expectOne(
        `${environment.apiUrl}/alumnos/${ALUMNO_ID_TEST}/preferencias?ultima=true`,
      );
      expect(req.request.url).toContain(`/alumnos/${ALUMNO_ID_TEST}`);
      req.flush([]);
      await promesa;
    });
  });

  describe('respuesta del back', () => {
    it('dado que el back devuelve una lista de preferencias, deberia devolver esa lista', async () => {
      const preferencias = [PreferenciaMother.crear(), PreferenciaMother.crearJugo()];

      const promesa = firstValueFrom(service.getPreferencias(ALUMNO_ID_TEST));
      httpMock
        .expectOne(`${environment.apiUrl}/alumnos/${ALUMNO_ID_TEST}/preferencias?ultima=true`)
        .flush(preferencias);

      expect(await promesa).toEqual(preferencias);
    });
  });
});
