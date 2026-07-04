import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ClaveRestriccion } from '../models/restricciones-nutricionales.model';
import {
  ALUMNO_ID_TEST,
  ClasificacionSaludBackendMother,
  RestriccionesNutricionalesMother,
} from '../restricciones-nutricionales.mother';
import {
  ClasificacionSaludBackend,
  RestriccionesNutricionalesService,
} from '../services/restricciones-nutricionales.service';
import { RestriccionesNutricionalesPresenter } from './restricciones-nutricionales.presenter';

interface ToastEsperado {
  mensaje: string;
  tipo: 'success' | 'error' | 'info';
}

describe('RestriccionesNutricionalesPresenter', () => {
  const alumnoBase = AlumnoMother.crear({
    id: ALUMNO_ID_TEST,
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: 'colegio-1',
  });

  let presenter: RestriccionesNutricionalesPresenter;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let restriccionesService: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
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

    alumnosService.asegurarCargados.and.resolveTo([alumnoBase]);
    givenAlumnoCargado(alumnoBase);
    givenCatalogoCompleto();
    givenSinRestriccionesActivas();
    restriccionesService.actualizarRestricciones.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        RestriccionesNutricionalesPresenter,
        { provide: AlumnosService, useValue: alumnosService },
        { provide: RestriccionesNutricionalesService, useValue: restriccionesService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(RestriccionesNutricionalesPresenter);
  });

  describe('init', () => {
    it('dado un alumnoId inexistente, cuando inicializo, deberia redirigir a /tutor sin pedir catalogo', async () => {
      givenNingunAlumnoEncontrado();

      await whenInicializo('inexistente');

      thenSeNavegoA('/tutor');
      thenNoSePidioCatalogo();
    });

    it('dado un alumno con restricciones activas, cuando inicializo, deberia proyectarlas al signal', async () => {
      givenRestriccionesActivas([
        ClasificacionSaludBackendMother.crear({ id: 'uuid-tacc' }),
        ClasificacionSaludBackendMother.crear({ id: 'uuid-sodio' }),
      ]);

      await whenInicializo(ALUMNO_ID_TEST);

      thenElAlumnoEs(alumnoBase);
      thenNombreCompletoEs('Julián García');
      thenInicialesSon('JG');
      thenGradoEs('4to Año A');
      thenRestriccionesSon(RestriccionesNutricionalesMother.crear({ sinTacc: true, sinSodio: true }));
      thenCargandoEs(false);
    });

    it('dado un item inactivo en el catalogo, cuando inicializo, no deberia mapearlo a ninguna clave', async () => {
      givenCatalogo([ClasificacionSaludBackendMother.crearInactiva()]);
      givenRestriccionesActivas([ClasificacionSaludBackendMother.crearInactiva()]);

      await whenInicializo(ALUMNO_ID_TEST);

      thenLaClaveEs('sinTacc', false);
    });

    it('dado que falla la carga del catalogo, cuando inicializo, deberia mostrar toast de error y quedar no cargando', async () => {
      spyOn(console, 'error');
      givenLaCargaDeCatalogoFalla('boom');

      await whenInicializo(ALUMNO_ID_TEST);

      thenSeMostroToast({
        mensaje: 'No pudimos cargar las restricciones del alumno.',
        tipo: 'error',
      });
      thenCargandoEs(false);
    });
  });

  describe('alternar', () => {
    it('dada una clave, cuando alterno dos veces, deberia togglear su valor sin tocar el resto', async () => {
      await whenInicializo(ALUMNO_ID_TEST);

      whenAlterno('vegano');
      thenLaClaveEs('vegano', true);
      thenLaClaveEs('sinTacc', false);

      whenAlterno('vegano');
      thenLaClaveEs('vegano', false);
    });
  });

  describe('guardar', () => {
    it('dado toggles activos, cuando guardo, deberia mandar los UUIDs, mostrar toast success y navegar a /tutor', async () => {
      await whenInicializo(ALUMNO_ID_TEST);
      whenAlterno('sinTacc');
      whenAlterno('contieneLacteos');

      await whenGuardo();

      thenSeGuardaronRestricciones(['uuid-tacc', 'uuid-lacteos']);
      thenSeMostroToast({ mensaje: 'Restricciones actualizadas.', tipo: 'success' });
      thenSeNavegoA('/tutor');
      thenGuardandoEs(false);
    });

    it('dado sin toggles activos, cuando guardo, deberia mandar lista vacia', async () => {
      await whenInicializo(ALUMNO_ID_TEST);

      await whenGuardo();

      thenSeGuardaronRestricciones([]);
    });

    it('dado que init nunca corrio, cuando guardo, no deberia llamar al service', async () => {
      await whenGuardo();

      thenNoSeGuardo();
    });

    it('dado que falla el guardado, cuando guardo, deberia mostrar toast de error y no navegar a /tutor', async () => {
      spyOn(console, 'error');
      givenElGuardadoFalla('boom');
      await whenInicializo(ALUMNO_ID_TEST);

      await whenGuardo();

      thenSeMostroToast({
        mensaje: 'No pudimos guardar los cambios. Probá de nuevo.',
        tipo: 'error',
      });
      thenNoSeNavegoA('/tutor');
      thenGuardandoEs(false);
    });

    it('dado un guardado en progreso, cuando llamo guardar de nuevo, no deberia llamar al service dos veces', async () => {
      await whenInicializo(ALUMNO_ID_TEST);
      const resolverGuardado = givenGuardadoPendiente();

      const primerGuardado = presenter.guardar();
      await presenter.guardar();

      thenElServiceFueLlamadoNVeces(1);

      resolverGuardado();
      await primerGuardado;
    });
  });

  describe('volver', () => {
    it('cuando hago click en volver, deberia navegar a /tutor', () => {
      whenVuelvo();

      thenSeNavegoA('/tutor');
    });
  });

  describe('computeds sin alumno cargado', () => {
    it('dado un presenter recien creado, nombreCompleto/iniciales/grado deberian devolver "" y urlFotoPerfil null', () => {
      thenNombreCompletoEs('');
      thenInicialesSon('');
      thenGradoEs('');
      thenUrlFotoPerfilEs(null);
    });
  });

  describe('computeds con alumno cargado', () => {
    it('dado un alumno con urlFotoPerfil, cuando inicializo, urlFotoPerfil deberia devolver esa URL', async () => {
      givenAlumnoCargado(
        AlumnoMother.crear({
          id: ALUMNO_ID_TEST,
          nombre: 'Ana',
          apellido: 'Lopez',
          urlFotoPerfil: 'https://cdn/foto.png',
        }),
      );

      await whenInicializo(ALUMNO_ID_TEST);

      thenUrlFotoPerfilEs('https://cdn/foto.png');
    });

    it('dado un alumno con grado null, cuando inicializo, grado deberia caer al fallback ""', async () => {
      givenAlumnoCargado(
        AlumnoMother.crear({
          id: ALUMNO_ID_TEST,
          nombre: 'Ana',
          apellido: 'Lopez',
          grado: null as unknown as string,
        }),
      );

      await whenInicializo(ALUMNO_ID_TEST);

      thenGradoEs('');
    });

    it('dado un alumno con apellido vacio, cuando inicializo, iniciales deberia devolver solo la inicial del nombre', async () => {
      givenAlumnoCargado(
        AlumnoMother.crear({
          id: ALUMNO_ID_TEST,
          nombre: 'Ana',
          apellido: '',
        }),
      );

      await whenInicializo(ALUMNO_ID_TEST);

      thenInicialesSon('A');
    });

    it('dado un alumno con apellido sin caracteres accesibles, cuando inicializo, iniciales deberia usar solo la inicial del nombre', async () => {
      givenAlumnoCargado(
        AlumnoMother.crear({
          id: ALUMNO_ID_TEST,
          nombre: 'Ana',
          apellido: { length: 5 } as unknown as string,
        }),
      );

      await whenInicializo(ALUMNO_ID_TEST);

      thenInicialesSon('A');
    });

    it('dado un alumno con nombre sin caracteres accesibles, cuando inicializo, iniciales deberia usar solo la inicial del apellido', async () => {
      givenAlumnoCargado(
        AlumnoMother.crear({
          id: ALUMNO_ID_TEST,
          nombre: { length: 5 } as unknown as string,
          apellido: 'Lopez',
        }),
      );

      await whenInicializo(ALUMNO_ID_TEST);

      thenInicialesSon('L');
    });
  });

  describe('construirMapeo', () => {
    it('dado un item del catalogo sin descripcion, cuando inicializo, no deberia romper y no deberia mapearlo', async () => {
      givenCatalogo([ClasificacionSaludBackendMother.crear({ id: 'sin-desc', descripcion: undefined })]);
      givenSinRestriccionesActivas();

      await whenInicializo(ALUMNO_ID_TEST);

      thenLaClaveEs('sinTacc', false);
    });
  });

  function givenAlumnoCargado(alumno: Alumno): void {
    alumnosService.getAlumnoById.and.returnValue(alumno);
  }

  function givenNingunAlumnoEncontrado(): void {
    alumnosService.getAlumnoById.and.returnValue(undefined);
  }

  function givenCatalogo(items: ClasificacionSaludBackend[]): void {
    restriccionesService.getCatalogo.and.resolveTo(items);
  }

  function givenCatalogoCompleto(): void {
    givenCatalogo(ClasificacionSaludBackendMother.crearCatalogoCompleto());
  }

  function givenSinRestriccionesActivas(): void {
    restriccionesService.getRestriccionesAlumno.and.resolveTo([]);
  }

  function givenRestriccionesActivas(items: ClasificacionSaludBackend[]): void {
    restriccionesService.getRestriccionesAlumno.and.resolveTo(items);
  }

  function givenLaCargaDeCatalogoFalla(mensaje: string): void {
    restriccionesService.getCatalogo.and.rejectWith(new Error(mensaje));
  }

  function givenElGuardadoFalla(mensaje: string): void {
    restriccionesService.actualizarRestricciones.and.rejectWith(new Error(mensaje));
  }

  function givenGuardadoPendiente(): () => void {
    let resolverGuardado!: () => void;
    restriccionesService.actualizarRestricciones.and.returnValue(
      new Promise<void>((res) => {
        resolverGuardado = res;
      }),
    );
    return resolverGuardado;
  }

  async function whenInicializo(id: string): Promise<void> {
    await presenter.init(id);
  }

  function whenAlterno(clave: ClaveRestriccion): void {
    presenter.alternar(clave);
  }

  async function whenGuardo(): Promise<void> {
    await presenter.guardar();
  }

  function whenVuelvo(): void {
    presenter.volver();
  }

  function thenSeNavegoA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }

  function thenNoSeNavegoA(url: string): void {
    expect(router.navigateByUrl).not.toHaveBeenCalledWith(url);
  }

  function thenNoSePidioCatalogo(): void {
    expect(restriccionesService.getCatalogo).not.toHaveBeenCalled();
  }

  function thenSeGuardaronRestricciones(ids: readonly string[]): void {
    expect(restriccionesService.actualizarRestricciones).toHaveBeenCalledWith(
      ALUMNO_ID_TEST,
      jasmine.arrayWithExactContents(ids),
    );
  }

  function thenNoSeGuardo(): void {
    expect(restriccionesService.actualizarRestricciones).not.toHaveBeenCalled();
  }

  function thenElServiceFueLlamadoNVeces(n: number): void {
    expect(restriccionesService.actualizarRestricciones).toHaveBeenCalledTimes(n);
  }

  function thenSeMostroToast(esperado: ToastEsperado): void {
    expect(toastService.mostrar).toHaveBeenCalledWith(esperado.mensaje, esperado.tipo);
  }

  function thenCargandoEs(esperado: boolean): void {
    expect(presenter.cargando()).toBe(esperado);
  }

  function thenGuardandoEs(esperado: boolean): void {
    expect(presenter.guardando()).toBe(esperado);
  }

  function thenElAlumnoEs(alumno: Alumno): void {
    expect(presenter.alumno()).toEqual(alumno);
  }

  function thenNombreCompletoEs(esperado: string): void {
    expect(presenter.nombreCompleto()).toBe(esperado);
  }

  function thenInicialesSon(esperado: string): void {
    expect(presenter.iniciales()).toBe(esperado);
  }

  function thenGradoEs(esperado: string): void {
    expect(presenter.grado()).toBe(esperado);
  }

  function thenUrlFotoPerfilEs(esperado: string | null): void {
    expect(presenter.urlFotoPerfil()).toBe(esperado);
  }

  function thenLaClaveEs(clave: ClaveRestriccion, esperado: boolean): void {
    expect(presenter.restricciones()[clave]).toBe(esperado);
  }

  function thenRestriccionesSon(esperado: ReturnType<typeof RestriccionesNutricionalesMother.crear>): void {
    expect(presenter.restricciones()).toEqual(esperado);
  }
});
