import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeAlumnoPresenter } from './home-alumno.presenter';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { HomeAlumnoService } from '../services/home-alumno.service';

describe('HomeAlumnoPresenter', () => {
  let presenter: HomeAlumnoPresenter;
  let routerSpy: jasmine.SpyObj<Router>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let colegiosServiceSpy: jasmine.SpyObj<ColegiosService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let homeAlumnoServiceSpy: jasmine.SpyObj<HomeAlumnoService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getAlumnoActual']);
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    colegiosServiceSpy = jasmine.createSpyObj('ColegiosService', ['getColegios']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    homeAlumnoServiceSpy = jasmine.createSpyObj('HomeAlumnoService', ['getPedidoEnCurso', 'getProximoRecreo']);

    TestBed.configureTestingModule({
      providers: [
        HomeAlumnoPresenter,
        { provide: Router, useValue: routerSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: ColegiosService, useValue: colegiosServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: HomeAlumnoService, useValue: homeAlumnoServiceSpy },
      ]
    });

    presenter = TestBed.inject(HomeAlumnoPresenter);
  });

  it('should compute default empty values if no alumno', () => {
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

  describe('when alumno is loaded', () => {
    const mockAlumno = { id: 'a1', nombre: 'Juan', apellido: 'Perez', colegioId: 'c1', saldo: -100, grado: '5A', urlFotoPerfil: 'img.jpg' };
    
    beforeEach(() => {
      (presenter as any).alumnoState.set(mockAlumno);
      colegiosServiceSpy.getColegios.and.returnValue([{ id: 'c1', nombre: 'Colegio A' } as any]);
    });

    it('should compute valid getters', () => {
      expect(presenter.nombreAlumno()).toBe('Juan');
      expect(presenter.nombreCompleto()).toBe('Juan Perez');
      expect(presenter.urlFotoPerfil()).toBe('img.jpg');
      expect(presenter.iniciales()).toBe('JP');
      expect(presenter.grado()).toBe('5A');
      expect(presenter.nombreColegio()).toBe('Colegio A');
      expect(presenter.saldo()).toBe(-100);
      expect(presenter.saldoNegativo()).toBeTrue();
      expect(presenter.saldoFormateado()).toContain('100');
      expect(presenter.saldoFormateado()).toContain('-');
    });

    it('should compute initials handling empty names safely', () => {
      (presenter as any).alumnoState.set({ ...mockAlumno, nombre: '', apellido: '' });
      expect(presenter.iniciales()).toBe('');
    });

    it('should return empty colegio if not found', () => {
      colegiosServiceSpy.getColegios.and.returnValue([]);
      expect(presenter.nombreColegio()).toBe('');
    });
  });

  describe('pedido states', () => {
    it('PREPARANDO', () => {
      (presenter as any).pedidoState.set({ estado: 'PREPARANDO' });
      expect(presenter.estadoPedidoLabel()).toBe('Preparando tu pedido');
      expect(presenter.iconoEstadoPedido()).toBe('fa-fire');
    });
    it('LISTO', () => {
      (presenter as any).pedidoState.set({ estado: 'LISTO' });
      expect(presenter.estadoPedidoLabel()).toBe('Listo para retirar');
      expect(presenter.iconoEstadoPedido()).toBe('fa-bell');
    });
    it('ENTREGADO', () => {
      (presenter as any).pedidoState.set({ estado: 'ENTREGADO' });
      expect(presenter.estadoPedidoLabel()).toBe('Ya retiraste tu pedido');
      expect(presenter.iconoEstadoPedido()).toBe('fa-check');
    });
    it('CONFIRMADO', () => {
      (presenter as any).pedidoState.set({ estado: 'CONFIRMADO' });
      expect(presenter.estadoPedidoLabel()).toBe('Pedido confirmado');
      expect(presenter.iconoEstadoPedido()).toBe('fa-clipboard-check');
    });
  });

  describe('init', () => {
    it('should load first alumno if profile ID not found', async () => {
      const mockAlumnos = [{ id: 'a1' }];
      alumnosServiceSpy.asegurarCargados.and.resolveTo(mockAlumnos as any);
      usuarioServiceSpy.getAlumnoActual.and.returnValue({ id: 'a2' } as any);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);
      homeAlumnoServiceSpy.getPedidoEnCurso.and.returnValue({} as any);
      homeAlumnoServiceSpy.getProximoRecreo.and.returnValue({} as any);

      presenter.init();
      await Promise.resolve();

      expect((presenter as any).alumnoState()).toEqual(mockAlumnos[0]);
    });

    it('should use loaded alumno if ID matches', async () => {
      const mockAlumnos = [{ id: 'a1' }];
      alumnosServiceSpy.asegurarCargados.and.resolveTo(mockAlumnos as any);
      usuarioServiceSpy.getAlumnoActual.and.returnValue({ id: 'a1' } as any);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('a1');

      presenter.init();
      await Promise.resolve();

      expect((presenter as any).alumnoState()).toEqual(mockAlumnos[0]);
    });
    
    it('should do nothing if no alumno found', async () => {
      alumnosServiceSpy.asegurarCargados.and.resolveTo([]);
      usuarioServiceSpy.getAlumnoActual.and.returnValue({ id: 'a1' } as any);
      perfilServiceSpy.obtenerAlumnoId.and.returnValue('a1');

      presenter.init();
      await Promise.resolve();

      expect((presenter as any).alumnoState()).toBeUndefined();
    });
  });

  describe('actions', () => {
    it('ejecutarAccion routing without id', () => {
      presenter.ejecutarAccion({ id: 'favoritos', ruta: '', label: '', descripcion: '', icono: '', emoji: '', color: 'menta' });
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('ejecutarAccion routing without alumno id', () => {
      (presenter as any).alumnoState.set(undefined);
      presenter.ejecutarAccion({ id: 'buffet', ruta: '/buffet', label: '', descripcion: '', icono: '', emoji: '', color: 'menta' });
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('ejecutarAccion routing with id, buffet/pedidos', () => {
      (presenter as any).alumnoState.set({ id: 'a1' });
      presenter.ejecutarAccion({ id: 'buffet', ruta: '/buffet', label: '', descripcion: '', icono: '', emoji: '', color: 'menta' });
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/buffet', 'a1']);
    });

    it('ejecutarAccion routing other', () => {
      (presenter as any).alumnoState.set({ id: 'a1' });
      presenter.ejecutarAccion({ id: 'favoritos', ruta: '/favoritos', label: '', descripcion: '', icono: '', emoji: '', color: 'menta' });
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/favoritos');
    });

    it('irAlBuffet with no id', () => {
      (presenter as any).alumnoState.set(undefined);
      presenter.irAlBuffet();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('irAlBuffet with id', () => {
      (presenter as any).alumnoState.set({ id: 'a1' });
      presenter.irAlBuffet();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/buffet', 'a1']);
    });

    it('verPedido when having order', () => {
      (presenter as any).pedidoState.set({});
      presenter.verPedido();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/compra');
    });

    it('verPedido when no order', () => {
      spyOn(presenter, 'irAlBuffet');
      presenter.verPedido();
      expect(presenter.irAlBuffet).toHaveBeenCalled();
    });
  });
});
