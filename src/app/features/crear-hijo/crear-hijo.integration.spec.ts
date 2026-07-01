import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CrearHijoPage } from './crear-hijo.page';
import {
  AlumnoNuevoMother,
  ColegioMother,
  GradoMother,
} from './crear-hijo.mother';
import { PerfilMother, AlumnoMother } from '../../data-access/services/alumno.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true,
})
class NavbarStub {
  @Input() userName = '';
}

interface FormHolder {
  form: { patchValue: (v: Record<string, unknown>) => void };
  onSubmit: (e: Event) => Promise<void>;
}

const FORM_VALIDO = {
  nombre: 'Juan',
  apellido: 'Pérez',
  username: 'juan.perez',
  email: 'juan.perez@example.com',
  dni: '40123456',
  colegioId: 'colegio-1',
  gradoId: 'grado-1',
};

const REQUEST_ESPERADO = {
  nombre: 'Juan',
  apellido: 'Pérez',
  username: 'juan.perez',
  email: 'juan.perez@example.com',
  dni: '40123456',
  gradoId: 'grado-1',
};

describe('CrearHijo Integration', () => {
  let fixture: ComponentFixture<CrearHijoPage>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['crearHijo', 'asegurarCargados']);
    Object.assign(servicioAlumnos, { alumnos: signal([]) });
    servicioAlumnos.asegurarCargados.and.resolveTo([]);

    servicioColegios = jasmine.createSpyObj('ColegiosService', [
      'obtenerColegios',
      'obtenerGradosPorColegio',
      'getColegios',
    ]);
    servicioColegios.obtenerColegios.and.resolveTo(ColegioMother.crearLista());
    servicioColegios.obtenerGradosPorColegio.and.resolveTo(GradoMother.crearLista());
    servicioColegios.getColegios.and.returnValue(ColegioMother.crearLista());

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['getPerfil', 'esPlanGratuito']);
    servicioPerfil.getPerfil.and.returnValue(PerfilMother.crearTutor());
    servicioPerfil.esPlanGratuito.and.returnValue(false);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
      'setNombreNavbar',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue(AlumnoMother.crearAlumnoActual());

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
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
  });

  it('dado que se monta la pagina, deberia renderizar el form con todos los campos requeridos', async () => {
    await whenMontoLaPagina();

    thenElFormTieneCampo('input[formControlName="nombre"]');
    thenElFormTieneCampo('input[formControlName="apellido"]');
    thenElFormTieneCampo('input[formControlName="username"]');
    thenElFormTieneCampo('input[formControlName="dni"]');
    thenElFormTieneCampo('input[formControlName="email"]');
    thenElFormTieneCampo('select[formControlName="colegioId"]');
    thenElFormTieneCampo('select[formControlName="gradoId"]');
  });

  it('dada la pagina inicializada, cuando el presenter real termina el init, deberia cargar las opciones de colegio en el select', async () => {
    await whenMontoLaPagina();

    expect(servicioColegios.obtenerColegios).toHaveBeenCalled();
    thenElSelectColegioTieneOpciones(ColegioMother.crearLista().length);
    thenLaPrimeraOpcionDelSelectColegioEs('Instituto San José');
  });

  it('dado un form valido, cuando submiteo, deberia crear el hijo, mostrar toast de exito y navegar a /tutor', async () => {
    givenAlumnosCrearHijoResuelve();
    await whenMontoLaPagina();
    whenSeteoElFormCon(FORM_VALIDO);

    await whenSubmiteoElForm();

    expect(servicioAlumnos.crearHijo).toHaveBeenCalledWith(REQUEST_ESPERADO);
    thenSeMostroToast('Juan Pérez fue agregado como hijo', 'success');
    thenSeNavegoA('/tutor');
  });

  it('dado que el back falla al crear el hijo, cuando submiteo, deberia mostrar un toast de error y no navegar', async () => {
    givenAlumnosCrearHijoFalla();
    await whenMontoLaPagina();
    whenSeteoElFormCon(FORM_VALIDO);

    await whenSubmiteoElForm();

    thenSeMostroToast('No se pudo crear el hijo. Intenta nuevamente.', 'error');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  function givenAlumnosCrearHijoResuelve(): void {
    servicioAlumnos.crearHijo.and.resolveTo(AlumnoNuevoMother.crear());
  }

  function givenAlumnosCrearHijoFalla(): void {
    servicioAlumnos.crearHijo.and.rejectWith(new Error('boom'));
  }

  async function whenMontoLaPagina(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenSeteoElFormCon(valores: Record<string, unknown>): void {
    const holder = fixture.componentInstance as unknown as FormHolder;
    holder.form.patchValue(valores);
  }

  async function whenSubmiteoElForm(): Promise<void> {
    const holder = fixture.componentInstance as unknown as FormHolder;
    await holder.onSubmit(new Event('submit'));
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

  function thenSeMostroToast(mensaje: string, tipo: 'success' | 'error'): void {
    expect(servicioToast.mostrar).toHaveBeenCalledWith(mensaje, tipo);
  }

  function thenSeNavegoA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }
});
