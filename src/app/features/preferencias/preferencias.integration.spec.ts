import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { Preferencia } from './models/preferencia.model';
import { ALUMNO_ID_TEST, PreferenciaMother } from './preferencias.mother';
import { PreferenciasPage } from './preferencias.page';
import { PreferenciasService } from './services/preferencias.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Preferencias Integration', () => {
  let fixture: ComponentFixture<PreferenciasPage>;
  let servicioPreferencias: jasmine.SpyObj<PreferenciasService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;

  beforeEach(async () => {
    servicioPreferencias = jasmine.createSpyObj('PreferenciasService', ['getPreferencias']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Integration',
    } as ReturnType<UsuarioService['getUsuarioActual']>);
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);
    servicioAlumnos.getAlumnoById.and.returnValue({ nombre: 'Emmanuel' } as any);

    await TestBed.configureTestingModule({
      imports: [PreferenciasPage],
      providers: [
        { provide: PreferenciasService, useValue: servicioPreferencias },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: AlumnosService, useValue: servicioAlumnos },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: signal(ALUMNO_ID_TEST).asReadonly() },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('dado el alumnoId en el contexto y 2 preferencias del service, cuando se monta, deberia renderizar el titulo y una card por preferencia', () => {
    givenPreferenciasDelBack([PreferenciaMother.crear(), PreferenciaMother.crearJugo()]);

    whenMonto();

    const texto = textoRenderizado();
    expect(texto).toContain('Preferencias de consumo');
    expect(texto).toContain('Alfajor de chocolate');
    expect(texto).toContain('Es el producto que mas consume en el buffet');
    expect(texto).toContain('Jugo de naranja');
    expect(texto).toContain('Aparece en el 80% de sus compras del recreo');
    expect(queryAll('app-preferencia-card').length).toBe(2);
  });

  it('dado que el service devuelve lista vacia, cuando se monta, deberia mostrar el estado vacio y no renderizar cards', () => {
    givenPreferenciasDelBack([]);

    whenMonto();

    expect(textoRenderizado()).toContain(
      'Todavía no hay sugerencias de consumo registradas para este alumno.',
    );
    expect(queryAll('app-preferencia-card').length).toBe(0);
  });

  function givenPreferenciasDelBack(preferencias: Preferencia[]): void {
    servicioPreferencias.getPreferencias.and.returnValue(of(preferencias));
  }

  function whenMonto(): void {
    fixture = TestBed.createComponent(PreferenciasPage);
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryAll(selector: string): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll(selector);
  }
});
