import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  RespuestaProductoIaMother,
  SolicitudGuardarProductoMother,
} from '../../cargar-producto-ia.mother';
import { RespuestaProductoIa } from '../../models/producto-ia-response.interface';
import { IaVisionService } from './ia-vision-service';

describe('IaVisionService', () => {
  const URL_UPLOAD = `${environment.apiUrl}/load-stock/upload-image`;
  const URL_SAVE = `${environment.apiUrl}/load-stock/save-product`;

  let service: IaVisionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IaVisionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('analyzeImage', () => {
    it('dado un archivo de imagen, cuando llamo al service, deberia hacer POST /load-stock/upload-image con FormData', async () => {
      const archivo = crearImagen('foto.jpg');

      const promesa = firstValueFrom(service.analyzeImage(archivo));

      const req = thenSeHaceUnPostA(URL_UPLOAD);
      thenElBodyEsFormDataConImagen(req.request.body, archivo);
      req.flush(RespuestaProductoIaMother.crear());
      await promesa;
    });

    it('dado que el back devuelve un producto, cuando llamo al service, deberia resolver con esa respuesta', async () => {
      const archivo = crearImagen('foto.jpg');
      const respuesta = RespuestaProductoIaMother.crearConAlergenos();

      const promesa = firstValueFrom(service.analyzeImage(archivo));
      givenElBackDeUploadResponde(respuesta);

      const resultado = await promesa;
      expect(resultado.nombre).toBe('Alfajor de chocolate');
      expect(resultado.contiene_tacc).toBeTrue();
    });
  });

  describe('saveProduct', () => {
    it('dado un request de producto, cuando llamo al service, deberia hacer POST /load-stock/save-product con el body', async () => {
      const request = SolicitudGuardarProductoMother.crear({ nombre: 'Alfajor' });

      const promesa = firstValueFrom(service.saveProduct(request));

      const req = thenSeHaceUnPostA(URL_SAVE);
      expect(req.request.body).toEqual(request);
      req.flush({});
      await promesa;
    });
  });

  function crearImagen(nombre: string): File {
    return new File(['contenido'], nombre, { type: 'image/jpeg' });
  }

  function givenElBackDeUploadResponde(respuesta: RespuestaProductoIa): void {
    httpMock.expectOne(URL_UPLOAD).flush(respuesta);
  }

  function thenSeHaceUnPostA(url: string) {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    return req;
  }

  function thenElBodyEsFormDataConImagen(body: unknown, archivoEsperado: File): void {
    expect(body instanceof FormData).toBeTrue();
    const imagen = (body as FormData).get('image');
    expect(imagen).toBe(archivoEsperado);
  }
});
