import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { InvitacionesTutorService } from '../services/invitaciones-tutor.service';
import { ImportarTutoresPage } from './importar-tutores.page';
import {
  ArchivoCsvMother,
  ReporteImportacionCsvMother,
} from './importar-tutores.mother';

describe('ImportarTutores Integration', () => {
  let fixture: ComponentFixture<ImportarTutoresPage>;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;

  beforeEach(async () => {
    servicioInvitaciones = jasmine.createSpyObj('InvitacionesTutorService', ['importarCsv']);

    await TestBed.configureTestingModule({
      imports: [ImportarTutoresPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
      ],
    }).compileComponents();

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ImportarTutoresPage);
  });

  it('dado un archivo valido y un reporte del back, cuando submiteo, deberia renderizar el reporte', async () => {
    givenElBackDevuelve(ReporteImportacionCsvMother.conErrores());
    whenMontoLaPagina();
    whenElijoUnArchivo(ArchivoCsvMother.valido());
    fixture.detectChanges();

    await whenSubmiteoElForm();

    expect(servicioInvitaciones.importarCsv).toHaveBeenCalled();
    thenElDomContieneTexto('Importación finalizada');
    thenElDomContieneTexto('Invalid email');
  });

  it('dado que estoy en el reporte, cuando hago click en importar otro archivo, deberia volver al form', async () => {
    givenElBackDevuelve(ReporteImportacionCsvMother.sinErrores());
    whenMontoLaPagina();
    whenElijoUnArchivo(ArchivoCsvMother.valido());
    fixture.detectChanges();
    await whenSubmiteoElForm();

    whenHagoClickEn('.btn--primary');

    expect((fixture.nativeElement as HTMLElement).querySelector('input[type="file"]')).toBeTruthy();
  });

  function givenElBackDevuelve(
    reporte: ReturnType<typeof ReporteImportacionCsvMother.sinErrores>,
  ): void {
    servicioInvitaciones.importarCsv.and.resolveTo(reporte);
  }

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
    fixture.detectChanges();
  }

  function whenHagoClickEn(selector: string): void {
    const btn = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
