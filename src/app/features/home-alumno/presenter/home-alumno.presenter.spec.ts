import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { Colegio } from '../../../data-access/models/colegio.model';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { HomeAlumnoService } from '../services/home-alumno.service';
import { HomeAlumnoPresenter } from './home-alumno.presenter';
import { PedidoEnCurso } from '../models/pedido-en-curso.model';
import { Recreo } from '../models/recreo.model';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import {
  AccionRapidaMother,
  PedidoEnCursoMother,
  RecreoMother,
} from '../home-alumno.mother';

const STORAGE_KEY_FONDO = 'home-alumno:fondo-perfil';

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('HomeAlumnoPresenter', () => {
  let presenter: HomeAlumnoPresenter;
  let router: jasmine.SpyObj<Router>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioHomeAlumno: jasmine.SpyObj<HomeAlumnoService>;
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    router.navigateByUrl.and.resolveTo(true);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getAlumnoActual']);
    servicioUsuario.getAlumnoActual.and.returnValue(AlumnoMother.crearAlumnoActual());

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    servicioPerfil.obtenerAlumnoId.and.returnValue(null);

    servicioColegios = jasmine.createSpyObj('ColegiosService', ['getColegios', 'obtenerColegios']);
    servicioColegios.getColegios.and.returnValue([]);
    servicioColegios.obtenerColegios.and.resolveTo([]);

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    servicioAlumnos.asegurarCargados.and.resolveTo([]);

    servicioHomeAlumno = jasmine.createSpyObj('HomeAlumnoService', [
      'getPedidoEnCurso',
      'getProximoRecreo',
      'cargarPedidoEnCurso',
      'cargarRecreos',
      'getRecompensasSaludables',
    ]);
    servicioHomeAlumno.getPedidoEnCurso.and.returnValue(undefined);
    servicioHomeAlumno.getProximoRecreo.and.returnValue(undefined);
    servicioHomeAlumno.getRecompensasSaludables.and.returnValue(
      of({ totalPoints: 0, currentLevel: '', levelMessage: '', pointsToNextLevel: 0, nextLevelName: '' })
    );
    servicioHomeAlumno.cargarPedidoEnCurso.and.resolveTo();
    servicioHomeAlumno.cargarRecreos.and.resolveTo();

    servicioContexto = jasmine.createSpyObj('AlumnoContextoService', ['setAlumnoId']);

    TestBed.configureTestingModule({
      providers: [
        HomeAlumnoPresenter,
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: HomeAlumnoService, useValue: servicioHomeAlumno },
        { provide: AlumnoContextoService, useValue: servicioContexto },
      ],
    });

    presenter = TestBed.inject(HomeAlumnoPresenter);
  });

  describe('Estado inicial sin alumno cargado', () => {
    it('dado el presenter recien creado, deberia devolver valores vacios en los getters', () => {
      expect(presenter.nombreAlumno()).toBe('');
      expect(presenter.nombreCompleto()).toBe('');
      expect(presenter.urlFotoPerfil()).toBeNull();
      expect(presenter.iniciales()).toBe('');
      expect(presenter.grado()).toBe('');
      expect(presenter.nombreColegio()).toBe('');
      expect(presenter.saldo()).toBe(0);
      expect(presenter.saldoNegativo()).toBeFalse();
      expect(presenter.tienePedidoEnCurso()).toBeFalse();
      expect(presenter.estadoPedidoLabel()).toBe('Sin pedido para hoy');
      expect(presenter.iconoEstadoPedido()).toBe('fa-utensils');
    });
  });

  describe('Computed signals con alumno cargado via init()', () => {
    it('dado un alumno completo, cuando inicializo, deberia exponer nombre, iniciales, foto, grado y saldo', async () => {
      const alumno = AlumnoMother.crear({
        id: 'a1',
        nombre: 'Juan',
        apellido: 'Pérez',
        grado: '5A',
        colegioId: 'c1',
        saldo: -100,
        urlFotoPerfil: 'img.jpg',
      });
      givenAlumnosCargados([alumno], 'a1');
      givenColegios([{ id: 'c1', nombre: 'Colegio A' }]);

      await whenInicializo();

      expect(presenter.nombreAlumno()).toBe('Juan');
      expect(presenter.nombreCompleto()).toBe('Juan Pérez');
      expect(presenter.urlFotoPerfil()).toBe('img.jpg');
      expect(presenter.iniciales()).toBe('JP');
      expect(presenter.grado()).toBe('5A');
      expect(presenter.nombreColegio()).toBe('Colegio A');
      expect(presenter.saldo()).toBe(-100);
      expect(presenter.saldoNegativo()).toBeTrue();
      expect(presenter.saldoFormateado()).toContain('100');
      expect(presenter.saldoFormateado()).toContain('-');
    });

    it('dado un alumno sin nombre ni apellido, cuando inicializo, deberia devolver iniciales vacias', async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1', nombre: '', apellido: '' })], 'a1');

      await whenInicializo();

      expect(presenter.iniciales()).toBe('');
    });

    it('dado un colegioId que no esta en la lista, cuando inicializo, deberia devolver colegio vacio', async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1', colegioId: 'fantasma' })], 'a1');
      givenColegios([{ id: 'otro', nombre: 'Otro' }]);

      await whenInicializo();

      expect(presenter.nombreColegio()).toBe('');
    });
  });

  describe('Estados del pedido en curso', () => {
    beforeEach(async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1' })], 'a1');

      await whenInicializo();
    });

    it('dado un pedido en estado PREPARANDO, deberia mapearlo a su label e icono', () => {
      givenPedidoEnCurso(PedidoEnCursoMother.crear({ estado: 'PREPARANDO' }));

      expect(presenter.estadoPedidoLabel()).toBe('Preparando tu pedido');
      expect(presenter.iconoEstadoPedido()).toBe('fa-fire');
      expect(presenter.tienePedidoEnCurso()).toBeTrue();
    });

    it('dado un pedido en estado LISTO, deberia mapearlo a su label e icono', () => {
      givenPedidoEnCurso(PedidoEnCursoMother.crear({ estado: 'LISTO' }));

      expect(presenter.estadoPedidoLabel()).toBe('Listo para retirar');
      expect(presenter.iconoEstadoPedido()).toBe('fa-bell');
    });

    it('dado un pedido en estado ENTREGADO, deberia mapearlo a su label e icono', () => {
      givenPedidoEnCurso(PedidoEnCursoMother.crear({ estado: 'ENTREGADO' }));

      expect(presenter.estadoPedidoLabel()).toBe('Ya retiraste tu pedido');
      expect(presenter.iconoEstadoPedido()).toBe('fa-check');
    });

    it('dado un pedido en estado CONFIRMADO, deberia mapearlo a su label e icono', () => {
      givenPedidoEnCurso(PedidoEnCursoMother.crear({ estado: 'CONFIRMADO' }));

      expect(presenter.estadoPedidoLabel()).toBe('Pedido confirmado');
      expect(presenter.iconoEstadoPedido()).toBe('fa-clipboard-check');
    });

    it('dado un proximo recreo del service, cuando lo leo, deberia exponerlo en el signal', () => {
      givenProximoRecreo(RecreoMother.crear({ nombre: 'Segundo recreo' }));

      expect(presenter.proximoRecreo()?.nombre).toBe('Segundo recreo');
    });
  });

  describe('init', () => {
    it('dado un perfilId que no coincide con ningun alumno, cuando inicializo, deberia caer al primero', async () => {
      const alumno = AlumnoMother.crear({ id: 'a1' });
      givenAlumnosCargados([alumno], 'a-fantasma');

      await whenInicializo();

      expect(presenter.alumno()).toEqual(alumno);
    });

    it('dado un perfilId que coincide con un alumno, cuando inicializo, deberia usar ese alumno', async () => {
      const a1 = AlumnoMother.crear({ id: 'a1' });
      const a2 = AlumnoMother.crear({ id: 'a2', nombre: 'Otro' });
      givenAlumnosCargados([a1, a2], 'a2');

      await whenInicializo();

      expect(presenter.alumno()?.id).toBe('a2');
    });

    it('dado un perfil sin alumnoId, cuando inicializo, deberia usar el alumno actual del usuario', async () => {
      const actual = AlumnoMother.crearAlumnoActual();
      givenAlumnosCargados([actual], null);

      await whenInicializo();

      expect(presenter.alumno()?.id).toBe(actual.id);
    });

    it('dado que el back no devuelve alumnos, cuando inicializo, deberia dejar el alumno en undefined', async () => {
      givenAlumnosCargados([], null);

      await whenInicializo();

      expect(presenter.alumno()).toBeUndefined();
    });

    it('dado un alumno con colegioId, cuando inicializo, deberia setear contexto y cargar pedido y recreos', async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1', colegioId: 'col-1' })], 'a1');

      await whenInicializo();

      thenSeSeteoContextoCon('a1');
      expect(servicioHomeAlumno.cargarPedidoEnCurso).toHaveBeenCalledWith('a1');
      expect(servicioHomeAlumno.cargarRecreos).toHaveBeenCalledWith('col-1');
    });

    it('dado un alumno sin colegioId, cuando inicializo, no deberia intentar cargar recreos', async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1', colegioId: '' })], 'a1');

      await whenInicializo();

      expect(servicioHomeAlumno.cargarRecreos).not.toHaveBeenCalled();
    });
  });

  describe('Acciones', () => {
    beforeEach(async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1' })], 'a1');

      await whenInicializo();
      servicioContexto.setAlumnoId.calls.reset();
      router.navigateByUrl.calls.reset();
    });

    it('dado el presenter inicializado, cuando leo las acciones, deberia exponer las 3 acciones rapidas con sus rutas', () => {
      const acciones = presenter.acciones();

      expect(acciones.length).toBe(3);
      expect(acciones.map((a) => a.id)).toEqual(['buffet', 'pedidos', 'favoritos']);
    });

    it('dado una accion sin ruta, cuando la ejecuto, no deberia navegar', () => {
      presenter.ejecutarAccion(AccionRapidaMother.crearFavoritos({ ruta: '' }));

      thenNoSeNavego();
    });

    it('dado la accion de buffet, cuando la ejecuto, deberia setear contexto y navegar a /buffet', () => {
      presenter.ejecutarAccion(AccionRapidaMother.crearBuffet());

      thenSeSeteoContextoCon('a1');
      thenSeNavegoA('/buffet');
    });

    it('dado una accion que no es buffet, cuando la ejecuto, solo deberia navegar sin setear contexto', () => {
      presenter.ejecutarAccion(AccionRapidaMother.crearFavoritos());

      expect(servicioContexto.setAlumnoId).not.toHaveBeenCalled();
      thenSeNavegoA('/favoritos');
    });

    it('dado el presenter con alumno cargado, cuando invoco irAlBuffet, deberia setear contexto y navegar a /buffet', () => {
      presenter.irAlBuffet();

      thenSeSeteoContextoCon('a1');
      thenSeNavegoA('/buffet');
    });

    it('dado un pedido en curso, cuando invoco verPedido, deberia navegar a /movimientos filtrando por estados activos', () => {
      givenPedidoEnCurso(PedidoEnCursoMother.crear());

      presenter.verPedido();

      thenSeNavegoA(['/movimientos'], { estado: 'PENDIENTE,EN_PREPARACION,LISTO' });
    });

    it('dado que no hay pedido en curso, cuando invoco verPedido, deberia delegar a irAlBuffet', () => {
      givenPedidoEnCurso(undefined);
      spyOn(presenter, 'irAlBuffet');

      presenter.verPedido();

      expect(presenter.irAlBuffet).toHaveBeenCalled();
    });
  });

  describe('Acciones sin alumno cargado', () => {
    it('dado que no hay alumno, cuando ejecuto la accion buffet, no deberia navegar ni setear contexto', () => {
      presenter.ejecutarAccion(AccionRapidaMother.crearBuffet());

      thenNoSeNavego();
      expect(servicioContexto.setAlumnoId).not.toHaveBeenCalled();
    });

    it('dado que no hay alumno, cuando invoco irAlBuffet, no deberia navegar', () => {
      presenter.irAlBuffet();

      thenNoSeNavego();
    });
  });

  describe('Fondo de perfil', () => {
    afterEach(() => {
      try {
        localStorage.removeItem(STORAGE_KEY_FONDO);
      } catch {
        /* noop */
      }
    });

    it('dado un fondo valido, cuando lo cambio, deberia actualizar el signal y guardarlo en localStorage', () => {
      const setItemSpy = spyOn(localStorage, 'setItem');

      presenter.cambiarFondoPerfil('messi');

      expect(presenter.fondoPerfil()).toBe('messi');
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY_FONDO, 'messi');
    });

    it('dado un fondo invalido, cuando lo cambio, no deberia actualizar el signal', () => {
      const fondoOriginal = presenter.fondoPerfil();

      presenter.cambiarFondoPerfil('hackeo' as never);

      expect(presenter.fondoPerfil()).toBe(fondoOriginal);
    });

    it('dado un fondo guardado valido, cuando inicializo, deberia leerlo del localStorage', async () => {
      givenFondoGuardado('dragonballz');
      givenAlumnosCargados([], null);

      await whenInicializo();

      expect(presenter.fondoPerfil()).toBe('dragonballz');
    });

    it('dado un fondo legado (creeper) guardado, cuando inicializo, deberia migrarlo a minecraft', async () => {
      givenFondoGuardado('creeper');
      const setItemSpy = spyOn(localStorage, 'setItem');
      givenAlumnosCargados([], null);

      await whenInicializo();

      expect(presenter.fondoPerfil()).toBe('minecraft');
      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY_FONDO, 'minecraft');
    });

    it('dado un fondo guardado que no es valido ni legado, cuando inicializo, deberia caer a "nubes"', async () => {
      givenFondoGuardado('basura');
      givenAlumnosCargados([], null);

      await whenInicializo();

      expect(presenter.fondoPerfil()).toBe('nubes');
    });
  });

  function givenAlumnosCargados(alumnos: Alumno[], perfilAlumnoId: string | null): void {
    servicioAlumnos.asegurarCargados.and.resolveTo(alumnos);
    servicioPerfil.obtenerAlumnoId.and.returnValue(perfilAlumnoId);
  }

  function givenColegios(colegios: Colegio[]): void {
    servicioColegios.getColegios.and.returnValue(colegios);
  }

  function givenPedidoEnCurso(pedido: PedidoEnCurso | undefined): void {
    servicioHomeAlumno.getPedidoEnCurso.and.returnValue(pedido);
  }

  function givenProximoRecreo(recreo: Recreo): void {
    servicioHomeAlumno.getProximoRecreo.and.returnValue(recreo);
  }

  function givenFondoGuardado(valor: string): void {
    spyOn(localStorage, 'getItem').and.returnValue(valor);
  }

  describe('rewardStatus con thresholds extremos', () => {
    it('dado totalPoints=0 y pointsToNextLevel=0 (threshold=0), porcentajeProgreso deberia ser 100 (fallback)', async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1' })], 'a1');
      servicioHomeAlumno.getRecompensasSaludables.and.returnValue(
        of({
          totalPoints: 0,
          currentLevel: 'PRINCIPIANTE',
          levelMessage: 'msg',
          pointsToNextLevel: 0,
          nextLevelName: 'CRACK',
        }),
      );
      await whenInicializo();

      expect(presenter.rewardStatus().porcentajeProgreso).toBe(100);
    });

    it('dado nextLevelName vacio, porcentajeProgreso deberia ser 100 (jugador ya al maximo)', async () => {
      givenAlumnosCargados([AlumnoMother.crear({ id: 'a1' })], 'a1');
      servicioHomeAlumno.getRecompensasSaludables.and.returnValue(
        of({
          totalPoints: 100,
          currentLevel: 'CRACK',
          levelMessage: 'top',
          pointsToNextLevel: 0,
          nextLevelName: '',
        }),
      );
      await whenInicializo();

      expect(presenter.rewardStatus().porcentajeProgreso).toBe(100);
    });
  });

  async function whenInicializo(): Promise<void> {
    presenter.init();
    await flushPromises();
  }

  function thenSeSeteoContextoCon(id: string): void {
    expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith(id);
  }

  function thenSeNavegoA(commands: string | string[], queryParams?: Record<string, string>): void {
    if (typeof commands === 'string') {
      expect(router.navigateByUrl).toHaveBeenCalledWith(commands);
      return;
    }
    if (queryParams) {
      expect(router.navigate).toHaveBeenCalledWith(commands, { queryParams });
    } else {
      expect(router.navigate).toHaveBeenCalledWith(commands);
    }
  }

  function thenNoSeNavego(): void {
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  }
});
