import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { BuffetService } from '../../../buffet/services/buffet.service';
import { PresupuestoService } from '../../../presupuesto/services/presupuesto.service';
import { FranjasHorariasService } from '../../../restricciones-horarias/services/franjas-horarias.service';
import { RestriccionesHorariasService } from '../../../restricciones-horarias/services/restricciones-horarias.service';
import {
  ItemCarritoMother,
  ProductoMother,
  SugerenciaCarritoMother,
} from '../../compra.mother';
import { ItemCarrito } from '../../models/carrito.model';
import { CarritoService } from '../../services/carrito.service';
import { CompraService } from '../../services/compra.service';
import { SugerenciasCarritoService } from '../../services/sugerencias-carrito.service';
import { CarritoPresenter } from './carrito.presenter';

describe('CarritoPresenter', () => {
  const BUFFET_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

  let presenter: CarritoPresenter;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioCompra: jasmine.SpyObj<CompraService>;
  let router: jasmine.SpyObj<Router>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioBuffet: jasmine.SpyObj<BuffetService>;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasCarritoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;
  let servicioRestricciones: jasmine.SpyObj<RestriccionesHorariasService>;
  let servicioFranjas: jasmine.SpyObj<FranjasHorariasService>;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;

  beforeEach(() => {
    servicioCarrito = jasmine.createSpyObj('CarritoService', [
      'itemsPorAlumno',
      'seleccionRetiro',
      'cargarPresupuestoYConsumo',
      'setCatalog',
      'agregar',
      'cambiarCantidad',
      'quitar',
    ]);
    servicioCarrito.itemsPorAlumno.and.returnValue(new Map());
    servicioCarrito.seleccionRetiro.and.returnValue({});

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    servicioAlumnos.asegurarCargados.and.resolveTo([]);

    servicioCompra = jasmine.createSpyObj('CompraService', ['iniciarOrden']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['esVistaAlumno', 'homeUrl']);
    servicioUsuario.esVistaAlumno.and.returnValue(true);
    servicioUsuario.homeUrl.and.returnValue('/alumno');

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['rol', 'obtenerAlumnoId']);
    servicioPerfil.rol.and.returnValue('ALUMNO');
    servicioPerfil.obtenerAlumnoId.and.returnValue('alumno-1');

    servicioBuffet = jasmine.createSpyObj('BuffetService', [
      'obtenerBuffetDelAlumno',
      'getProductosDelBuffet',
    ]);
    servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(
      of({ id: BUFFET_ID, nombre: 'Buffet', colegioId: 'colegio-1' }),
    );
    servicioBuffet.getProductosDelBuffet.and.returnValue(of([]));

    servicioSugerencias = jasmine.createSpyObj('SugerenciasCarritoService', ['obtenerSugerencias']);
    servicioSugerencias.obtenerSugerencias.and.returnValue(of([]));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioContexto = jasmine.createSpyObj('AlumnoContextoService', ['setAlumnoId']);

    servicioRestricciones = jasmine.createSpyObj('RestriccionesHorariasService', [
      'getRestriccionesPorAlumno',
    ]);
    servicioRestricciones.getRestriccionesPorAlumno.and.resolveTo([]);

    servicioFranjas = jasmine.createSpyObj('FranjasHorariasService', ['getFranjasHorarias']);
    servicioFranjas.getFranjasHorarias.and.resolveTo([
      {
        id: '1',
        colegioId: 'colegio-1',
        descripcion: 'Primer recreo',
        horaInicio: '10:00',
        horaFin: '10:30',
        activo: true,
      },
    ]);

    servicioPresupuesto = jasmine.createSpyObj('PresupuestoService', ['checkBudgetDates']);
    servicioPresupuesto.checkBudgetDates.and.resolveTo([]);

    TestBed.configureTestingModule({
      providers: [
        CarritoPresenter,
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: CompraService, useValue: servicioCompra },
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: BuffetService, useValue: servicioBuffet },
        { provide: SugerenciasCarritoService, useValue: servicioSugerencias },
        { provide: ToastService, useValue: servicioToast },
        { provide: AlumnoContextoService, useValue: servicioContexto },
        { provide: RestriccionesHorariasService, useValue: servicioRestricciones },
        { provide: FranjasHorariasService, useValue: servicioFranjas },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
      ],
    });

    presenter = TestBed.inject(CarritoPresenter);
  });

  describe('Estado inicial', () => {
    it('dado el presenter recien creado sin items, deberia estar vacio y no poder avanzar', () => {
      expect(presenter.carritoVacio()).toBeTrue();
      expect(presenter.grupos().length).toBe(0);
      expect(presenter.avanzarPosible()).toBeFalse();
    });
  });

  describe('avanzarPosible', () => {
    it('dado un carrito valido con fecha futura y saldo suficiente, cuando inicializo, deberia poder avanzar', async () => {
      givenItemsPara('alumno-1', 1000);
      givenAlumno('alumno-1', { saldo: 2000 });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'PRIMER_RECREO');

      await presenter.init();

      expect(presenter.grupos().length).toBe(1);
      expect(presenter.totalSeleccionado()).toBe(1000);
      expect(presenter.avanzarPosible()).toBeTrue();
    });

    it('dado un carrito con saldo insuficiente, cuando inicializo, deberia mostrar advertencia informando el saldo', async () => {
      givenItemsPara('alumno-1', 5000);
      givenAlumno('alumno-1', { nombre: 'Test', saldo: 1000 });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'PRIMER_RECREO');

      await presenter.init();

      expect(presenter.advertencia()).toContain('saldo de Test no alcanza');
    });
  });

  describe('avanzar', () => {
    it('dado un carrito valido, cuando avanzo, deberia iniciar la orden y navegar a /compra/confirmar', async () => {
      givenItemsPara('alumno-1', 1000);
      givenAlumno('alumno-1', { saldo: 2000 });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'PRIMER_RECREO');
      await presenter.init();

      presenter.avanzar();

      expect(servicioCompra.iniciarOrden).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra/confirmar');
    });

    it('dado avanzarPosible en false, cuando llamo avanzar, no deberia iniciar orden ni navegar', () => {
      presenter.avanzar();

      expect(servicioCompra.iniciarOrden).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('acciones de items', () => {
    it('dado un item, cuando sumo, deberia llamar cambiarCantidad con +1', () => {
      presenter.sumarItem('item-1');
      expect(servicioCarrito.cambiarCantidad).toHaveBeenCalledWith('item-1', 1);
    });

    it('dado un item, cuando resto, deberia llamar cambiarCantidad con -1', () => {
      presenter.restarItem('item-1');
      expect(servicioCarrito.cambiarCantidad).toHaveBeenCalledWith('item-1', -1);
    });

    it('dado un item, cuando elimino, deberia llamar quitar', () => {
      presenter.eliminarItem('item-1');
      expect(servicioCarrito.quitar).toHaveBeenCalledWith('item-1');
    });
  });

  describe('agregarSugerencia', () => {
    it('dado una sugerencia y un grupo activo, cuando la agrego, deberia mapearla a Producto y llamar al service + toast', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 2000 });
      await presenter.init();
      const sugerencia = SugerenciaCarritoMother.crear({
        productId: 'p-x',
        productName: 'Jugo',
        price: 300,
        stockActual: 10,
      });

      presenter.agregarSugerencia(sugerencia);

      expect(servicioCarrito.agregar).toHaveBeenCalled();
      const [productoArg, alumnoIdArg, cantidadArg] =
        servicioCarrito.agregar.calls.mostRecent().args;
      expect(productoArg.id).toBe('p-x');
      expect(productoArg.nombre).toBe('Jugo');
      expect(alumnoIdArg).toBe('alumno-1');
      expect(cantidadArg).toBe(1);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(jasmine.stringMatching(/Jugo/));
    });
  });

  describe('navegacion', () => {
    it('dado el presenter, cuando vuelvo al buffet, deberia navegar a la homeUrl del usuario', () => {
      presenter.volverAlBuffet();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/alumno');
    });

    it('dado un alumno, cuando voy a editar retiro, deberia setear el contexto y navegar a /buffet', () => {
      presenter.irAEditarRetiro('alumno-1');

      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/buffet');
    });
  });

  describe('cambios locales de fecha, recreo y seleccion', () => {
    it('dado toggleSeleccion sobre un alumno, deberia flipear la seleccion (true por default)', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      await presenter.init();

      presenter.toggleSeleccion('alumno-1');
      expect(presenter.grupos()[0].seleccionado).toBeFalse();

      presenter.toggleSeleccion('alumno-1');
      expect(presenter.grupos()[0].seleccionado).toBeTrue();
    });

    it('dado setRecreo, deberia actualizar el recreo del alumno cuando no hay retiro predefinido en el carritoService', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      servicioCarrito.seleccionRetiro.and.returnValue({});
      await presenter.init();

      presenter.setRecreo('alumno-1', 'SEGUNDO_RECREO');

      expect(presenter.grupos()[0].recreo).toBe('SEGUNDO_RECREO');
    });

    it('dado setFecha con un fin de semana, deberia saltar al siguiente dia habil', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      servicioCarrito.seleccionRetiro.and.returnValue({});
      await presenter.init();

      presenter.setFecha('alumno-1', '2050-01-01');

      expect(presenter.grupos()[0].fecha).toBe('2050-01-03');
    });

    it('dado setFecha con una fecha anterior a la minima, deberia ajustarla al minimo', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      servicioCarrito.seleccionRetiro.and.returnValue({});
      await presenter.init();
      const minEsperado = presenter.fechaMinimaMap()['alumno-1'] ?? presenter.fechaMinima;

      presenter.setFecha('alumno-1', '2000-01-03');

      expect(presenter.grupos()[0].fecha).toBe(minEsperado);
    });
  });

  describe('advertencias', () => {
    it('dado una fecha de fin de semana, la advertencia deberia mencionar el fin de semana', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { nombre: 'Julian', saldo: 5000 });
      givenSeleccionRetiro('alumno-1', '2050-01-02', 'PRIMER_RECREO');

      await presenter.init();

      expect(presenter.advertencia()).toContain('fin de semana');
      expect(presenter.avanzarPosible()).toBeFalse();
    });

    it('dado una fecha valida pero anterior a la minima, la advertencia deberia decir que no esta permitida', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { nombre: 'Julian', saldo: 5000 });
      givenSeleccionRetiro('alumno-1', '2020-01-06', 'PRIMER_RECREO');

      await presenter.init();

      expect(presenter.advertencia()).toContain('no está permitida');
    });

    it('dado varios alumnos con fechas invalidas, la advertencia deberia ser generica', async () => {
      const mapa = new Map<string, ItemCarrito[]>();
      mapa.set('alumno-1', [ItemCarritoMother.crearParaAlumno('alumno-1', { producto: ProductoMother.crear({ precio: 100 }) })]);
      mapa.set('alumno-2', [ItemCarritoMother.crearParaAlumno('alumno-2', { producto: ProductoMother.crear({ precio: 100 }) })]);
      servicioCarrito.itemsPorAlumno.and.returnValue(mapa);
      servicioAlumnos.getAlumnoById.and.callFake((id: string) => AlumnoMother.crear({ id, saldo: 5000 }));
      servicioCarrito.seleccionRetiro.and.returnValue({
        'alumno-1': { fecha: '2020-01-06', recreo: 'PRIMER_RECREO' },
        'alumno-2': { fecha: '2020-01-07', recreo: 'PRIMER_RECREO' },
      });

      await presenter.init();

      expect(presenter.advertencia()).toContain('Hay alumnos con fechas seleccionadas inválidas');
    });

    it('dado varios alumnos con saldo insuficiente, la advertencia deberia mencionar la cantidad', async () => {
      const mapa = new Map<string, ItemCarrito[]>();
      mapa.set('alumno-1', [ItemCarritoMother.crearParaAlumno('alumno-1', { producto: ProductoMother.crear({ precio: 5000 }) })]);
      mapa.set('alumno-2', [ItemCarritoMother.crearParaAlumno('alumno-2', { producto: ProductoMother.crear({ precio: 5000 }) })]);
      servicioCarrito.itemsPorAlumno.and.returnValue(mapa);
      servicioAlumnos.getAlumnoById.and.callFake((id: string) => AlumnoMother.crear({ id, saldo: 100 }));
      servicioCarrito.seleccionRetiro.and.returnValue({
        'alumno-1': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' },
        'alumno-2': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' },
      });

      await presenter.init();

      expect(presenter.advertencia()).toBe('Hay 2 alumnos con saldo insuficiente.');
    });
  });

  describe('effect de sugerencias', () => {
    it('dado que no es vista alumno ni rol ALUMNO, no deberia refrescar sugerencias', fakeAsync(() => {
      servicioPerfil.rol.and.returnValue('PADRE');
      servicioUsuario.esVistaAlumno.and.returnValue(false);
      presenter = TestBed.inject(CarritoPresenter);
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });

      presenter.init();
      flush();

      expect(servicioSugerencias.obtenerSugerencias).not.toHaveBeenCalled();
      expect(presenter.sugerencias()).toEqual([]);
    }));

    it('dado un alumno con items, cuando el effect corre, deberia poblar sugerencias con lo que devuelve el backend', fakeAsync(() => {
      const sugerencia = SugerenciaCarritoMother.crear();
      servicioSugerencias.obtenerSugerencias.and.returnValue(of([sugerencia]));
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });

      presenter.init();
      flush();
      TestBed.tick();
      flush();

      expect(presenter.sugerencias()).toEqual([sugerencia]);
      expect(presenter.cargandoSugerencias()).toBeFalse();
    }));

    it('dado que el service de sugerencias falla, deberia dejar sugerencias vacias y loguear', fakeAsync(() => {
      spyOn(console, 'error');
      servicioSugerencias.obtenerSugerencias.and.returnValue(throwError(() => new Error('boom')));
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });

      presenter.init();
      flush();
      TestBed.tick();
      flush();

      expect(presenter.sugerencias()).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    }));

    it('dado que el buffet no se resuelve, deberia dejar sugerencias vacias y loguear', fakeAsync(() => {
      spyOn(console, 'error');
      servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(throwError(() => new Error('sin buffet')));
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });

      presenter.init();
      flush();
      TestBed.tick();
      flush();

      expect(presenter.sugerencias()).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('effect de presupuesto', () => {
    it('dado un checkBudgetDates que devuelve blocked=true, deberia setear el budgetBlockReasons', fakeAsync(() => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000, nombre: 'Julian' });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'PRIMER_RECREO');
      servicioPresupuesto.checkBudgetDates.and.resolveTo([
        { date: '2050-01-03', blocked: true, reason: 'Presupuesto diario excedido' },
      ]);

      presenter.init();
      flush();
      TestBed.tick();
      flush();
      TestBed.tick();

      expect(presenter.budgetBlockReasons()['alumno-1']).toBe('Presupuesto diario excedido');
      expect(presenter.avanzarPosible()).toBeFalse();
      expect(presenter.advertencia()).toContain('Presupuesto diario excedido');
    }));

    it('dado que checkBudgetDates falla, deberia loguear y no romper', fakeAsync(() => {
      spyOn(console, 'error');
      servicioPresupuesto.checkBudgetDates.and.rejectWith(new Error('backend'));
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'PRIMER_RECREO');

      presenter.init();
      flush();
      TestBed.tick();
      flush();

      expect(console.error).toHaveBeenCalledWith('Error checking budget dates:', jasmine.any(Error));
    }));
  });

  describe('recreos disponibles', () => {
    it('dado franjas con "Segundo recreo" y "Mediodia", deberia mapearlas al recreo correspondiente', async () => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([
        { id: '1', colegioId: 'colegio-1', descripcion: 'Segundo recreo', horaInicio: '11:00', horaFin: '11:30', activo: true },
        { id: '2', colegioId: 'colegio-1', descripcion: 'Mediodia', horaInicio: '12:00', horaFin: '12:30', activo: true },
        { id: '3', colegioId: 'colegio-1', descripcion: 'Salida', horaInicio: '14:00', horaFin: '14:30', activo: true },
      ]);
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'SEGUNDO_RECREO');

      await presenter.init();

      const opciones = presenter.recreosDisponiblesMap()['alumno-1'];
      expect(opciones.map((o) => o.recreo)).toEqual(['SEGUNDO_RECREO', 'MEDIODIA', 'FUERA_HORA']);
    });

    it('dado franjas con descripciones raras, deberia caer al fallback por indice y bloquear las que tienen restriccion del tutor', async () => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([
        { id: 'slot-a', colegioId: 'colegio-1', descripcion: 'AAA', horaInicio: '10:00', horaFin: '10:30', activo: true },
      ]);
      servicioRestricciones.getRestriccionesPorAlumno.and.resolveTo([
        { id: 'r1', activa: true, timeSlotId: 'slot-a' } as unknown as import('../../../restricciones-horarias/models/restriccion-horaria.model').RestriccionHoraria,
      ]);
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'PRIMER_RECREO');

      await presenter.init();

      const opciones = presenter.recreosDisponiblesMap()['alumno-1'];
      expect(opciones[0].bloqueado).toBeTrue();
      expect(opciones[0].motivo).toBe('tutor');
      expect(presenter.blockedRecreos()['alumno-1']).toContain('PRIMER_RECREO');
    });
  });

  describe('advertencias — recreo bloqueado por tutor multi-alumno y por tiempo', () => {
    it('dado 2 alumnos con recreo bloqueado por tutor, la advertencia deberia ser generica', async () => {
      const mapa = new Map<string, ItemCarrito[]>();
      mapa.set('alumno-1', [ItemCarritoMother.crearParaAlumno('alumno-1', { producto: ProductoMother.crear({ precio: 100 }) })]);
      mapa.set('alumno-2', [ItemCarritoMother.crearParaAlumno('alumno-2', { producto: ProductoMother.crear({ precio: 100 }) })]);
      servicioCarrito.itemsPorAlumno.and.returnValue(mapa);
      servicioAlumnos.getAlumnoById.and.callFake((id: string) => AlumnoMother.crear({ id, saldo: 5000 }));
      servicioCarrito.seleccionRetiro.and.returnValue({
        'alumno-1': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' },
        'alumno-2': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' },
      });
      servicioRestricciones.getRestriccionesPorAlumno.and.callFake((alumnoId: string) => {
        return Promise.resolve([
          { id: `r-${alumnoId}`, activa: true, timeSlotId: '1' } as unknown as import('../../../restricciones-horarias/models/restriccion-horaria.model').RestriccionHoraria,
        ]);
      });

      await presenter.init();

      expect(presenter.advertencia()).toContain('bloqueado por el tutor');
    });
  });

  describe('sugerencias — refrescarSugerencias sin alumnoId', () => {
    it('dado un grupo pero sin perfil.obtenerAlumnoId, deberia usar el alumno.id del primer grupo', fakeAsync(() => {
      const sugerencia = SugerenciaCarritoMother.crear();
      servicioSugerencias.obtenerSugerencias.and.returnValue(of([sugerencia]));
      servicioPerfil.obtenerAlumnoId.and.returnValue(null);
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });

      presenter.init();
      flush();
      TestBed.tick();
      flush();

      expect(servicioSugerencias.obtenerSugerencias).toHaveBeenCalledWith(
        jasmine.objectContaining({ studentId: 'alumno-1' }),
      );
    }));
  });

  describe('agregarSugerencia — variantes', () => {
    it('dado sugerencia con stockActual 0, deberia mapear estadoStock a SIN_STOCK', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      await presenter.init();
      const sugerencia = SugerenciaCarritoMother.crear({ stockActual: 0 });

      presenter.agregarSugerencia(sugerencia);

      const productoArg = servicioCarrito.agregar.calls.mostRecent().args[0];
      expect(productoArg.estadoStock).toBe('SIN_STOCK');
    });

    it('dado no hay grupos (carrito vacio), agregarSugerencia deberia salir sin llamar al carrito', () => {
      servicioCarrito.itemsPorAlumno.and.returnValue(new Map());
      const sugerencia = SugerenciaCarritoMother.crear();

      presenter.agregarSugerencia(sugerencia);

      expect(servicioCarrito.agregar).not.toHaveBeenCalled();
    });
  });

  describe('grupos con alumno inexistente en el service', () => {
    it('dado un item de un alumno que getAlumnoById no encuentra, deberia omitirlo de los grupos', async () => {
      const mapa = new Map<string, ItemCarrito[]>();
      mapa.set('alumno-1', [ItemCarritoMother.crearParaAlumno('alumno-1', { producto: ProductoMother.crear({ precio: 100 }) })]);
      mapa.set('alumno-fantasma', [ItemCarritoMother.crearParaAlumno('alumno-fantasma', { producto: ProductoMother.crear({ precio: 100 }) })]);
      servicioCarrito.itemsPorAlumno.and.returnValue(mapa);
      servicioAlumnos.getAlumnoById.and.callFake((id: string) => {
        if (id === 'alumno-1') return AlumnoMother.crear({ id: 'alumno-1', saldo: 5000 });
        return undefined;
      });
      servicioCarrito.seleccionRetiro.and.returnValue({
        'alumno-1': { fecha: '2050-01-03', recreo: 'PRIMER_RECREO' },
      });

      await presenter.init();

      expect(presenter.grupos().length).toBe(1);
      expect(presenter.grupos()[0].alumno.id).toBe('alumno-1');
    });
  });

  describe('avanzar sin buffet cacheado', () => {
    it('dado que el buffet no esta cacheado, cuando avanzo, deberia mostrar toast de error y no navegar', async () => {
      givenItemsPara('alumno-1', 500);
      givenAlumno('alumno-1', { saldo: 5000 });
      givenSeleccionRetiro('alumno-1', '2050-01-03', 'PRIMER_RECREO');
      await presenter.init();
      (presenter as unknown as { buffetCache: Map<string, unknown> }).buffetCache.clear();

      presenter.avanzar();

      expect(servicioCompra.iniciarOrden).not.toHaveBeenCalled();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('No se pudo resolver el buffet del pedido', 'error');
    });
  });

  function givenItemsPara(alumnoId: string, precio: number): void {
    const mapa = new Map<string, ItemCarrito[]>();
    mapa.set(alumnoId, [
      ItemCarritoMother.crearParaAlumno(alumnoId, {
        producto: ProductoMother.crear({ id: `prod-${precio}`, precio }),
      }),
    ]);
    servicioCarrito.itemsPorAlumno.and.returnValue(mapa);
  }

  function givenAlumno(id: string, override: Partial<Parameters<typeof AlumnoMother.crear>[0]> = {}): void {
    servicioAlumnos.getAlumnoById.and.returnValue(AlumnoMother.crear({ id, ...override }));
  }

  function givenSeleccionRetiro(alumnoId: string, fecha: string, recreo: 'PRIMER_RECREO' | 'SEGUNDO_RECREO' | 'MEDIODIA' | 'FUERA_HORA'): void {
    servicioCarrito.seleccionRetiro.and.returnValue({
      [alumnoId]: { fecha, recreo },
    });
  }
});
