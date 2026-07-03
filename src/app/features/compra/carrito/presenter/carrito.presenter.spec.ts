import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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
