import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { Colegio } from '../../data-access/models/colegio.model';
import { Grado } from '../../data-access/models/grado.model';
import { CrearHijoPage } from './crear-hijo.page';

describe('CrearHijoPage', () => {
  let fixture: ComponentFixture<CrearHijoPage>;
  let component: CrearHijoPage;

  const colegios: Colegio[] = [
    { id: 'colegio-1', nombre: 'Instituto San José' },
    { id: 'colegio-2', nombre: 'Colegio Santa María' },
  ];
  const grados: Grado[] = [
    { id: 'grado-1', nombre: '5to A' },
    { id: 'grado-2', nombre: '6to B' },
  ];

  const colegiosStub: Pick<
    ColegiosService,
    'obtenerColegios' | 'obtenerGradosPorColegio' | 'getColegios'
  > = {
    obtenerColegios: () => Promise.resolve(colegios),
    obtenerGradosPorColegio: () => Promise.resolve(grados),
    getColegios: () => colegios,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearHijoPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ColegiosService, useValue: colegiosStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearHijoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear la página', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el título de primer hijo cuando no hay alumnos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Agregá a tu primer hijo');
  });

  it('debería renderizar los campos requeridos del form', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input[formControlName="nombre"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="apellido"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="username"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="dni"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="email"]')).toBeTruthy();
    expect(compiled.querySelector('select[formControlName="colegioId"]')).toBeTruthy();
    expect(compiled.querySelector('select[formControlName="gradoId"]')).toBeTruthy();
  });

  it('debería cargar las opciones de colegio en el select tras el init', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const opciones = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'select[formControlName="colegioId"] option',
    );
    expect(opciones.length).toBe(1 + colegios.length);
    expect(opciones[1].textContent?.trim()).toBe('Instituto San José');
  });
});
