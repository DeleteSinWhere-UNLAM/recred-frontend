import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { PresupuestoService } from '../presupuesto/services/presupuesto.service';
import { EstadisticaPage } from './estadistica.page';
import { PrediccionGastoMother } from './estadistica.mother';

describe('Estadistica Integration', () => {
  let fixture: ComponentFixture<EstadisticaPage>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let router: jasmine.SpyObj<Router>;
  let alumnoIdSignal: WritableSignal<string>;

  beforeEach(async () => {
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);
    servicioAlumnos.getAlumnoById.and.returnValue(
      AlumnoMother.crear({
        id: 'alumno-1',
        nombre: 'Julian Ignacio',
        apellido: 'Perez',
        grado: '5A',
        urlFotoPerfil: null,
      }),
    );

    servicioPresupuesto = jasmine.createSpyObj('PresupuestoService', ['getPrediccion']);
    servicioPresupuesto.getPrediccion.and.returnValue(PrediccionGastoMother.crear());

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    alumnoIdSignal = signal<string>('alumno-1');

    await TestBed.configureTestingModule({
      imports: [EstadisticaPage],
      providers: [
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: Router, useValue: router },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: alumnoIdSignal.asReadonly() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticaPage);
  });

  it('dado un alumno con prediccion, cuando se monta la page, deberia mostrar iniciales, grado y card con datos', () => {
    whenMonto();

    const texto = textoRenderizado();
    expect(texto).toContain('JP');
    expect(texto).toContain('5A');
    expect(texto).toContain('Julian');
    expect(texto).toContain('Gasto proyectado del período');
    expect(texto).toContain('Bebidas');
  });

  it('dado el nivel excedido, deberia agregar la clase excedido al card', () => {
    servicioPresupuesto.getPrediccion.and.returnValue(PrediccionGastoMother.crearExcedido());

    whenMonto();

    expect(queryUno('.prediccion-card--excedido')).toBeTruthy();
    expect(textoRenderizado()).toContain('Excede el presupuesto');
  });

  it('dado que no hay prediccion cargada, deberia mostrar el estado vacio del card', () => {
    servicioPresupuesto.getPrediccion.and.returnValue(undefined);

    whenMonto();

    expect(queryUno('.prediccion-card--vacio')).toBeTruthy();
    expect(textoRenderizado()).toContain('Todavía no hay datos suficientes');
  });

  it('dado un alumno inexistente en el contexto, deberia redirigir a /tutor', () => {
    servicioAlumnos.getAlumnoById.and.returnValue(undefined);

    whenMonto();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
