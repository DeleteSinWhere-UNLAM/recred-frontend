import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  ALUMNO_ID_TEST,
  ClasificacionSaludBackendMother,
} from './restricciones-nutricionales.mother';
import { RestriccionesNutricionalesPage } from './restricciones-nutricionales.page';
import { RestriccionesNutricionalesService } from './services/restricciones-nutricionales.service';

describe('RestriccionesNutricionales Integration', () => {
  let fixture: ComponentFixture<RestriccionesNutricionalesPage>;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let restriccionesService: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    alumnosService = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    restriccionesService = jasmine.createSpyObj<RestriccionesNutricionalesService>(
      'RestriccionesNutricionalesService',
      ['getCatalogo', 'getRestriccionesAlumno', 'actualizarRestricciones'],
    );
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    const alumno = AlumnoMother.crear({
      id: ALUMNO_ID_TEST,
      nombre: 'Julián',
      apellido: 'García',
    });
    alumnosService.asegurarCargados.and.resolveTo([alumno]);
    alumnosService.getAlumnoById.and.returnValue(alumno);
    restriccionesService.getCatalogo.and.resolveTo(
      ClasificacionSaludBackendMother.crearCatalogoCompleto(),
    );
    restriccionesService.getRestriccionesAlumno.and.resolveTo([
      ClasificacionSaludBackendMother.crear({ id: 'uuid-tacc' }),
    ]);
    restriccionesService.actualizarRestricciones.and.resolveTo();

    const usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
    ]);
    usuarioService.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Integration',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [RestriccionesNutricionalesPage],
      providers: [
        { provide: AlumnosService, useValue: alumnosService },
        { provide: RestriccionesNutricionalesService, useValue: restriccionesService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: PerfilService, useValue: { esPlanGratuito: signal(false) } },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: signal(ALUMNO_ID_TEST).asReadonly() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestriccionesNutricionalesPage);
  });

  it('dado el alumnoId en el contexto, cuando se monta la page, deberia pedirle catalogo y restricciones al service', async () => {
    await whenMontoYEspero();

    expect(alumnosService.asegurarCargados).toHaveBeenCalled();
    expect(restriccionesService.getCatalogo).toHaveBeenCalled();
    expect(restriccionesService.getRestriccionesAlumno).toHaveBeenCalledWith(ALUMNO_ID_TEST);
  });

  it('dado el alumno cargado, cuando se monta la page, deberia mostrar su nombre en el titulo', async () => {
    await whenMontoYEspero();

    const titulo = (fixture.nativeElement as HTMLElement).querySelector('.restricciones__titulo');
    expect(titulo?.textContent).toContain('Julián');
  });

  it('dadas las restricciones activas del back, cuando renderizo, deberia checkear los toggles correspondientes', async () => {
    await whenMontoYEspero();

    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      '.toggle__input',
    );
    const taccInput = Array.from(inputs).find(
      (i) => i.getAttribute('aria-label') === 'TACC',
    );
    expect(taccInput?.checked).toBeTrue();
  });

  async function whenMontoYEspero(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
