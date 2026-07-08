import { Component, Input, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Alumno } from '../../data-access/models/alumno.model';
import { Perfil } from '../../data-access/models/perfil.model';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
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

type AlumnosServiceMock = jasmine.SpyObj<AlumnosService> & {
  alumnos: WritableSignal<Alumno[]>;
};

type PerfilServiceMock = jasmine.SpyObj<PerfilService> & {
  esPlanGratuito: WritableSignal<boolean>;
};

describe('CrearHijoPage', () => {
  let fixture: ComponentFixture<CrearHijoPage>;
  let component: CrearHijoPage;
  let servicioAlumnos: AlumnosServiceMock;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioPerfil: PerfilServiceMock;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;
  let alumnosState: WritableSignal<Alumno[]>;

  const perfilTutor: Perfil = {
    id: 'perfil-1',
    email: 'tutor@test.com',
    nombre: 'Tutor Test',
    apellido: 'Test',
    rol: 'PADRE',
    plan: 'AVANZADO',
  };

  beforeEach(async () => {
    alumnosState = signal<Alumno[]>([]);

    servicioAlumnos = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'crearHijo',
    ]) as AlumnosServiceMock;
    Object.defineProperty(servicioAlumnos, 'alumnos', {
      value: alumnosState,
      configurable: true,
    });
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioAlumnos.crearHijo.and.resolveTo(crearAlumno());

    servicioColegios = jasmine.createSpyObj<ColegiosService>('ColegiosService', [
      'obtenerColegiosDelTutor',
      'obtenerGradosPorColegio',
      'getColegios',
    ]);
    servicioColegios.obtenerColegiosDelTutor.and.resolveTo(ColegioMother.crearLista());
    servicioColegios.obtenerGradosPorColegio.and.resolveTo(GradoMother.crearLista());
    servicioColegios.getColegios.and.returnValue(ColegioMother.crearLista());

    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
    ]) as PerfilServiceMock;
    Object.defineProperty(servicioPerfil, 'esPlanGratuito', {
      value: signal(false),
      configurable: true,
    });
    servicioPerfil.getPerfil.and.returnValue(perfilTutor);

    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
      'setNombreNavbar',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue({
      id: 'usuario-1',
      nombre: 'Usuario Test',
    });

    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [CrearHijoPage],
      providers: [
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
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

  it('dado un submit con form invalido, no deberia crear y deberia marcar los campos como touched', async () => {
    whenMontoLaPagina();
    await whenEsperoQueSeEstabilice();
    const spyCrear = spyOn(component['presenter'], 'crear').and.resolveTo(undefined);

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(spyCrear).not.toHaveBeenCalled();
    expect(component['form'].touched).toBeTrue();
  });

  it('dado alumnos ya cargados, cuando cancelo, deberia navegar a /tutor', async () => {
    whenMontoLaPagina();
    await whenEsperoQueSeEstabilice();
    alumnosState.set([crearAlumno()]);

    (component as unknown as { onCancelar(): void }).onCancelar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
  });

  it('dado un username con formato de email, deberia marcar el campo como invalido', async () => {
    whenMontoLaPagina();

    component['form'].controls.username.setValue('user@example.com');

    expect(component['form'].controls.username.errors?.['emailFormat']).toBeTrue();
  });

  it('dado un username no-string, la funcion validadora deberia devolver null (safe)', () => {
    whenMontoLaPagina();

    component['form'].controls.username.setValue('   '); // se trimea a vacio -> null

    expect(component['form'].controls.username.errors?.['emailFormat']).toBeUndefined();
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

  function crearAlumno(): Alumno {
    return {
      id: 'alumno-1',
      nombre: 'Ana',
      apellido: 'Garcia',
      grado: '1 A',
      colegioId: 'colegio-1',
      saldo: 0,
    };
  }
});
