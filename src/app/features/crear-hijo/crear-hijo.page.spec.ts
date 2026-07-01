import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CrearHijoPage } from './crear-hijo.page';
import { ColegioMother, GradoMother } from './crear-hijo.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true,
})
class NavbarStub {
  @Input() userName = '';
}

describe('CrearHijoPage', () => {
  let fixture: ComponentFixture<CrearHijoPage>;
  let component: CrearHijoPage;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;

  beforeEach(async () => {
    servicioColegios = jasmine.createSpyObj<ColegiosService>('ColegiosService', [
      'obtenerColegios',
      'obtenerGradosPorColegio',
      'getColegios',
    ]);
    servicioColegios.obtenerColegios.and.resolveTo(ColegioMother.crearLista());
    servicioColegios.obtenerGradosPorColegio.and.resolveTo(GradoMother.crearLista());
    servicioColegios.getColegios.and.returnValue(ColegioMother.crearLista());

    await TestBed.configureTestingModule({
      imports: [CrearHijoPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ColegiosService, useValue: servicioColegios },
      ],
    })
      .overrideComponent(CrearHijoPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CrearHijoPage);
    component = fixture.componentInstance;
  });

  it('dado que se monta la pagina, deberia crearse correctamente', () => {
    whenMontoLaPagina();

    expect(component).toBeTruthy();
  });

  it('dado que no hay alumnos cargados, cuando monto la pagina, deberia mostrar el titulo de primer hijo', () => {
    whenMontoLaPagina();

    thenElDomContieneTexto('Agregá a tu primer hijo');
  });

  it('dado que monto la pagina, deberia renderizar todos los campos requeridos del form', () => {
    whenMontoLaPagina();

    thenElFormTieneCampo('input[formControlName="nombre"]');
    thenElFormTieneCampo('input[formControlName="apellido"]');
    thenElFormTieneCampo('input[formControlName="username"]');
    thenElFormTieneCampo('input[formControlName="dni"]');
    thenElFormTieneCampo('input[formControlName="email"]');
    thenElFormTieneCampo('select[formControlName="colegioId"]');
    thenElFormTieneCampo('select[formControlName="gradoId"]');
  });

  it('dada la pagina ya inicializada, cuando termina el init, deberia cargar las opciones de colegio en el select', async () => {
    whenMontoLaPagina();

    await whenEsperoQueSeEstabilice();

    thenElSelectColegioTieneOpciones(ColegioMother.crearLista().length);
    thenLaPrimeraOpcionDelSelectColegioEs('Instituto San José');
  });

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
  }

  async function whenEsperoQueSeEstabilice(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }

  function thenElFormTieneCampo(selector: string): void {
    expect((fixture.nativeElement as HTMLElement).querySelector(selector)).toBeTruthy();
  }

  function thenElSelectColegioTieneOpciones(cantidad: number): void {
    const opciones = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'select[formControlName="colegioId"] option',
    );
    expect(opciones.length).toBe(1 + cantidad);
  }

  function thenLaPrimeraOpcionDelSelectColegioEs(texto: string): void {
    const opciones = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'select[formControlName="colegioId"] option',
    );
    expect(opciones[1].textContent?.trim()).toBe(texto);
  }
});
