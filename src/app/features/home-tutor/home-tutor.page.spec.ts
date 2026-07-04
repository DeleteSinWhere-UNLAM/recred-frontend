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

describe('HomeTutorPage', () => {
  let component: HomeTutorPage;
  let fixture: ComponentFixture<HomeTutorPage>;
  let alumnosSignal: WritableSignal<Alumno[]>;
  let perfilSignal: WritableSignal<Perfil | null>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    alumnosSignal = signal<Alumno[]>([]);
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
    servicioColegios.getColegios.and.returnValue([]);
    servicioColegios.obtenerColegios.and.resolveTo([]);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
      'setNombreNavbar',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Fallback',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    const perfilServiceFake = { perfil: perfilSignal.asReadonly() };

    await TestBed.configureTestingModule({
      imports: [HomeTutorPage],
      providers: [
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: perfilServiceFake },
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
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado el componente al construirse, deberia setear /tutor como home y el nombre del navbar', () => {
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/tutor');
      expect(servicioUsuario.setNombreNavbar).toHaveBeenCalledWith('Martin');
    });

    it('dado ngOnInit, cuando se resuelven alumnos y colegios, cargando deberia pasar a false', async () => {
      whenMonto();
      await Promise.resolve();
      await Promise.resolve();

      expect(servicioAlumnos.asegurarCargados).toHaveBeenCalledWith(true);
      expect(servicioColegios.obtenerColegios).toHaveBeenCalled();
      expect(component.cargando()).toBeFalse();
      expect(component.error()).toBeNull();
    });

    it('dado que asegurarCargados falla, deberia setear error y desactivar cargando', async () => {
      spyOn(console, 'error');
      servicioAlumnos.asegurarCargados.and.rejectWith(new Error('boom'));

      whenMonto();
      await fixture.whenStable();

      expect(component.error()).toBe('Error al cargar alumnos');
      expect(component.cargando()).toBeFalse();
    });
  });

  describe('datos derivados del tutor', () => {
    it('dado un perfil con nombre completo, nombreCompletoTutor deberia ser solo el primer nombre', () => {
      perfilSignal.set(PerfilMother.crear({ nombre: 'Juan Ignacio', apellido: 'Perez' }));

      expect(component.nombreCompletoTutor()).toBe('Juan');
    });

    it('dado un perfil con foto, urlFotoPerfilTutor deberia devolverla', () => {
      perfilSignal.set(PerfilMother.crear({ urlFotoPerfil: 'https://foto.com/x.png' }));

      expect(component.urlFotoPerfilTutor()).toBe('https://foto.com/x.png');
    });

    it('dado un perfil, iniciales deberia armarse con la primer letra del nombre y apellido en mayuscula', () => {
      perfilSignal.set(PerfilMother.crear({ nombre: 'juan', apellido: 'perez' }));

      expect(component.inicialesTutor()).toBe('JP');
    });

    it('dado que no hay perfil, nombreUsuario deberia caer al UsuarioService', () => {
      perfilSignal.set(null);

      expect(component.nombreUsuario()).toBe('Fallback');
    });
  });

  describe('grupos por colegio', () => {
    it('dado alumnos de dos colegios distintos, grupos deberia armar dos entradas con nombre desde ColegiosService', () => {
      servicioColegios.getColegios.and.returnValue([
        ColegioMother.crear({ id: 'c-1', nombre: 'San José' }),
        ColegioMother.crear({ id: 'c-2', nombre: 'Los Robles' }),
      ]);
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1', colegioId: 'c-1', saldo: 1000 }),
        AlumnoMother.crear({ id: 'a-2', colegioId: 'c-2', saldo: 500 }),
      ]);

      const grupos = component.grupos();
      expect(grupos.length).toBe(2);
      expect(grupos[0].colegio.nombre).toBe('San José');
      expect(grupos[1].colegio.nombre).toBe('Los Robles');
      expect(component.cantidadColegios()).toBe(2);
      expect(component.cantidadHijos()).toBe(2);
    });

    it('dado un alumno sin colegioId, deberia agruparlo bajo "sin-colegio" con nombre "Mi colegio"', () => {
      alumnosSignal.set([AlumnoMother.crear({ id: 'a-1', colegioId: '' })]);

      const grupos = component.grupos();
      expect(grupos[0].colegio.id).toBe('sin-colegio');
      expect(grupos[0].colegio.nombre).toBe('Mi colegio');
    });
  });

  describe('saldo total', () => {
    it('dado alumnos con distintos saldos, saldoTotal deberia sumarlos', () => {
      alumnosSignal.set([
        AlumnoMother.crear({ id: 'a-1', saldo: 1500 }),
        AlumnoMother.crear({ id: 'a-2', saldo: 2500 }),
      ]);

      expect(component.saldoTotal()).toBe(4000);
      expect(component.saldoTotalFormateado()).toContain('4.000');
      expect(component.saldoTotalNegativo()).toBeFalse();
    });

    it('dado alumnos con saldo negativo total, saldoTotalNegativo deberia ser true', () => {
      alumnosSignal.set([AlumnoMother.crear({ id: 'a-1', saldo: -500 })]);

      expect(component.saldoTotalNegativo()).toBeTrue();
    });
  });

  describe('manejarMicrocredito', () => {
    it('dado un evento cualquiera, deberia loggearlo sin romper', () => {
      const log = spyOn(console, 'log');

      component.manejarMicrocredito({ tipo: 'adelanto' });

      expect(log).toHaveBeenCalledWith('manejarMicrocredito', { tipo: 'adelanto' });
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
