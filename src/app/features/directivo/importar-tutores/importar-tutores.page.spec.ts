import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ReporteImportacionCsv } from '../models/invitacion-tutor.model';
import { ImportarTutoresPage } from './importar-tutores.page';
import { ImportarTutoresPresenter } from './presenter/importar-tutores.presenter';
import {
  ArchivoCsvMother,
  ReporteImportacionCsvMother,
} from './importar-tutores.mother';

interface PresenterStub {
  loading: () => boolean;
  error: () => string | null;
  reporte: () => ReporteImportacionCsv | null;
  importar: jasmine.Spy;
  volver: jasmine.Spy;
  limpiar: jasmine.Spy;
}

describe('ImportarTutoresPage', () => {
  let fixture: ComponentFixture<ImportarTutoresPage>;
  let presenterStub: PresenterStub;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let errorSignal: ReturnType<typeof signal<string | null>>;
  let reporteSignal: ReturnType<typeof signal<ReporteImportacionCsv | null>>;

  beforeEach(async () => {
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);
    reporteSignal = signal<ReporteImportacionCsv | null>(null);

    presenterStub = {
      loading: loadingSignal,
      error: errorSignal,
      reporte: reporteSignal,
      importar: jasmine.createSpy('importar').and.resolveTo(),
      volver: jasmine.createSpy('volver'),
      limpiar: jasmine.createSpy('limpiar'),
    };

    await TestBed.configureTestingModule({
      imports: [ImportarTutoresPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(ImportarTutoresPage, {
        add: { providers: [{ provide: ImportarTutoresPresenter, useValue: presenterStub }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ImportarTutoresPage);
  });

  it('dado que se monta la pagina, deberia crearse correctamente', () => {
    whenMontoLaPagina();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('dado que no hay archivo, cuando renderiza, el boton submit deberia estar deshabilitado', () => {
    whenMontoLaPagina();

    thenElBotonSubmitEstaDeshabilitado();
  });

  it('dado un archivo con extension no CSV, cuando lo elijo, deberia mostrar error y no seleccionarlo', () => {
    whenMontoLaPagina();

    whenElijoUnArchivo(ArchivoCsvMother.invalido());
    fixture.detectChanges();

    thenElDomContieneTexto('El archivo debe ser un CSV.');
    expect(fixture.componentInstance['archivoSeleccionado']()).toBeNull();
  });

  it('dado un archivo CSV valido, cuando lo elijo, deberia mostrar el nombre y habilitar el submit', () => {
    whenMontoLaPagina();

    whenElijoUnArchivo(ArchivoCsvMother.valido());
    fixture.detectChanges();

    thenElDomContieneTexto('tutores.csv');
    thenElBotonSubmitEstaHabilitado();
  });

  it('dado un archivo valido seleccionado, cuando submiteo, deberia invocar al presenter con ese archivo', async () => {
    whenMontoLaPagina();
    whenElijoUnArchivo(ArchivoCsvMother.valido());
    fixture.detectChanges();

    await whenSubmiteoElForm();

    expect(presenterStub.importar).toHaveBeenCalledTimes(1);
    expect(presenterStub.importar.calls.mostRecent().args[0].name).toBe('tutores.csv');
  });

  it('dado un reporte con errores en el presenter, cuando renderiza, deberia mostrar las filas con error', () => {
    reporteSignal.set(ReporteImportacionCsvMother.conErrores());

    whenMontoLaPagina();

    thenElDomContieneTexto('Importación finalizada');
    thenElDomContieneTexto('Fila 3');
    thenElDomContieneTexto('Invalid email');
  });

  it('dado un reporte sin errores, cuando renderiza, no deberia mostrar la seccion de errores', () => {
    reporteSignal.set(ReporteImportacionCsvMother.sinErrores());

    whenMontoLaPagina();

    expect((fixture.nativeElement as HTMLElement).querySelector('.errores')).toBeNull();
  });

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
  }

  function whenElijoUnArchivo(archivo: File): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [archivo], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  async function whenSubmiteoElForm(): Promise<void> {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function thenElBotonSubmitEstaDeshabilitado(): void {
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(boton.disabled).toBeTrue();
  }

  function thenElBotonSubmitEstaHabilitado(): void {
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(boton.disabled).toBeFalse();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
