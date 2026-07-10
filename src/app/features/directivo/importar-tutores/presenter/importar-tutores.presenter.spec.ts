import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { InvitacionesTutorService } from '../../services/invitaciones-tutor.service';
import { ReporteImportacionCsv } from '../../models/invitacion-tutor.model';
import {
  ArchivoCsvMother,
  ReporteImportacionCsvMother,
} from '../importar-tutores.mother';
import { ImportarTutoresPresenter } from './importar-tutores.presenter';

describe('ImportarTutoresPresenter', () => {
  let presenter: ImportarTutoresPresenter;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    servicioInvitaciones = jasmine.createSpyObj<InvitacionesTutorService>(
      'InvitacionesTutorService',
      ['importarCsv'],
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        ImportarTutoresPresenter,
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(ImportarTutoresPresenter);
  });

  it('dado el presenter recien creado, deberia tener los signals en sus valores iniciales', () => {
    expect(presenter.loading()).toBeFalse();
    expect(presenter.error()).toBeNull();
    expect(presenter.reporte()).toBeNull();
  });

  describe('importar', () => {
    it('dado un archivo valido, cuando importo, deberia exponer el reporte en el signal', async () => {
      const reporte = ReporteImportacionCsvMother.sinErrores();
      givenElBackDevuelve(reporte);

      await whenImporto(ArchivoCsvMother.valido());

      expect(servicioInvitaciones.importarCsv).toHaveBeenCalled();
      expect(presenter.reporte()).toEqual(reporte);
      expect(presenter.error()).toBeNull();
      expect(presenter.loading()).toBeFalse();
    });

    it('dado un archivo con errores por fila, cuando importo, deberia exponerlos en el reporte', async () => {
      givenElBackDevuelve(ReporteImportacionCsvMother.conErrores());

      await whenImporto(ArchivoCsvMother.valido());

      expect(presenter.reporte()?.errors.length).toBe(2);
    });

    it('dado un error 400 con mensaje del back, cuando importo, deberia usar ese mensaje', async () => {
      givenElBackFallaCon(400, 'Formato CSV invalido');

      await whenImporto(ArchivoCsvMother.valido());

      expect(presenter.error()).toBe('Formato CSV invalido');
      expect(presenter.reporte()).toBeNull();
    });

    it('dado un error 400 sin body, cuando importo, deberia usar el mensaje por defecto', async () => {
      givenElBackFallaCon(400);

      await whenImporto(ArchivoCsvMother.valido());

      expect(presenter.error()).toBe('El archivo CSV es inválido.');
    });

    it('dado un error 403, cuando importo, deberia mostrar el mensaje de sin permisos', async () => {
      givenElBackFallaCon(403);

      await whenImporto(ArchivoCsvMother.valido());

      expect(presenter.error()).toBe('No tenés permisos para importar tutores.');
    });

    it('dado un error 500, cuando importo, deberia mostrar mensaje de error del servidor', async () => {
      givenElBackFallaCon(500);

      await whenImporto(ArchivoCsvMother.valido());

      expect(presenter.error()).toBe('Error del servidor. Intentá más tarde.');
    });

    it('dado un error que no es HTTP, cuando importo, deberia usar el mensaje generico', async () => {
      servicioInvitaciones.importarCsv.and.rejectWith(new Error('boom'));

      await whenImporto(ArchivoCsvMother.valido());

      expect(presenter.error()).toBe(
        'No se pudo importar el archivo. Intentá nuevamente.',
      );
    });
  });

  describe('limpiar', () => {
    it('dado un reporte y un error previo, cuando limpio, deberia dejar ambos signals en null', async () => {
      givenElBackDevuelve(ReporteImportacionCsvMother.sinErrores());
      await whenImporto(ArchivoCsvMother.valido());

      presenter.limpiar();

      expect(presenter.reporte()).toBeNull();
      expect(presenter.error()).toBeNull();
    });
  });

  describe('volver', () => {
    it('cuando llamo volver, deberia navegar a /directivo', () => {
      presenter.volver();

      expect(router.navigate).toHaveBeenCalledWith(['/directivo']);
    });
  });

  describe('mapearError con message undefined en el body', () => {
    it('dado un error 400 con message undefined, cuando importo, deberia caer al mensaje por status', async () => {
      servicioInvitaciones.importarCsv.and.rejectWith(
        new HttpErrorResponse({ status: 400, error: { message: undefined } }),
      );

      await whenImporto(new File([''], 'x.csv'));

      expect(presenter.error()).toBe('El archivo CSV es inválido.');
    });
  });

  function givenElBackDevuelve(reporte: ReporteImportacionCsv): void {
    servicioInvitaciones.importarCsv.and.resolveTo(reporte);
  }

  function givenElBackFallaCon(status: number, mensaje?: string): void {
    servicioInvitaciones.importarCsv.and.rejectWith(
      new HttpErrorResponse({
        status,
        error: mensaje ? { message: mensaje } : null,
      }),
    );
  }

  function whenImporto(archivo: File): Promise<void> {
    return presenter.importar(archivo);
  }
});
