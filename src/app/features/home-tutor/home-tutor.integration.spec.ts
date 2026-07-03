import { Component, Input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Alumno } from '../../data-access/models/alumno.model';
import { Perfil } from '../../data-access/models/perfil.model';
import { AlumnoMother, PerfilMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ColegioSectionComponent } from './components/colegio-section/colegio-section.component';
import { TutorHeaderComponent } from './components/tutor-header/tutor-header.component';
import { ColegioMother } from './home-tutor.mother';
import { HomeTutorPage } from './home-tutor.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-tutor-header', template: '', standalone: true })
class TutorHeaderStub {
  @Input() iniciales = '';
  @Input() nombreCompleto = '';
  @Input() urlFotoPerfil: string | null = null;
  @Input() cantidadHijos = 0;
  @Input() cantidadColegios = 0;
  @Input() saldoTotalFormateado = '';
  @Input() saldoTotalNegativo = false;
}

@Component({ selector: 'app-colegio-section', template: '', standalone: true })
class ColegioSectionStub {
  @Input() colegio: { id: string; nombre: string } | undefined;
  @Input() alumnos: Alumno[] = [];
}

describe('HomeTutor Integration', () => {
  let fixture: ComponentFixture<HomeTutorPage>;
  let alumnosSignal: WritableSignal<Alumno[]>;
  let perfilSignal: WritableSignal<Perfil | null>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    alumnosSignal = signal<Alumno[]>([
      AlumnoMother.crear({ id: 'a-1', nombre: 'Juan', colegioId: 'c-1', saldo: 1500 }),
      AlumnoMother.crear({ id: 'a-2', nombre: 'Sofia', colegioId: 'c-2', saldo: 2500 }),
    ]);
    perfilSignal = signal<Perfil | null>(
      PerfilMother.crear({ nombre: 'Martin', apellido: 'Perez', rol: 'PADRE' }),
    );

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    Object.defineProperty(servicioAlumnos, 'alumnos', {
      value: alumnosSignal.asReadonly(),
      writable: true,
    });
    servicioAlumnos.asegurarCargados.and.resolveTo([]);

    servicioColegios = jasmine.createSpyObj('ColegiosService', ['getColegios', 'obtenerColegios']);
    servicioColegios.getColegios.and.returnValue([
      ColegioMother.crear({ id: 'c-1', nombre: 'San José' }),
      ColegioMother.crear({ id: 'c-2', nombre: 'Los Robles' }),
    ]);
    servicioColegios.obtenerColegios.and.resolveTo([]);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
      'setNombreNavbar',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Fallback',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [HomeTutorPage],
      providers: [
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: { perfil: perfilSignal.asReadonly() } },
        provideRouter([]),
      ],
    })
      .overrideComponent(HomeTutorPage, {
        remove: {
          imports: [NavbarComponent, TutorHeaderComponent, ColegioSectionComponent],
        },
        add: {
          imports: [NavbarStub, TutorHeaderStub, ColegioSectionStub],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeTutorPage);
  });

  it('dado 2 alumnos de 2 colegios distintos, cuando se monta la page, deberia renderizar una seccion por colegio', async () => {
    await whenMontoYEspero();

    const secciones = queryAll('app-colegio-section');
    expect(secciones.length).toBe(2);
  });

  it('dado el perfil del tutor, deberia propagar iniciales, nombre y saldo total al tutor-header', async () => {
    await whenMontoYEspero();

    const header = fixture.debugElement.query((d) => d.componentInstance instanceof TutorHeaderStub)
      ?.componentInstance as TutorHeaderStub;
    expect(header.iniciales).toBe('MP');
    expect(header.nombreCompleto).toBe('Martin');
    expect(header.cantidadHijos).toBe(2);
    expect(header.cantidadColegios).toBe(2);
    expect(header.saldoTotalFormateado).toContain('4.000');
  });

  it('dado que el usuario no tiene alumnos, cuando se resuelve la carga, deberia mostrar el estado vacio', async () => {
    alumnosSignal.set([]);

    await whenMontoYEspero();

    expect(textoRenderizado()).toContain('Aún no tienes alumnos asignados a tu cuenta.');
  });

  it('dado que la carga falla, deberia mostrar el mensaje de error', async () => {
    spyOn(console, 'error');
    servicioAlumnos.asegurarCargados.and.rejectWith(new Error('boom'));

    await whenMontoYEspero();

    expect(textoRenderizado()).toContain('Error al cargar alumnos');
  });

  async function whenMontoYEspero(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function queryAll(selector: string): Element[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector));
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
