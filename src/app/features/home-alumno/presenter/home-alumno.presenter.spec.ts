import { TestBed } from '@angular/core/testing';
import { HomeAlumnoPresenter } from './home-alumno.presenter';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { HomeAlumnoService } from '../services/home-alumno.service';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';

describe('HomeAlumnoPresenter', () => {
  let presenter: HomeAlumnoPresenter;
  let routerSpy: jasmine.SpyObj<Router>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let homeAlumnoServiceSpy: jasmine.SpyObj<HomeAlumnoService>;
  let contextoServiceSpy: jasmine.SpyObj<AlumnoContextoService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    alumnosServiceSpy.asegurarCargados.and.resolveTo([
      { id: 'alumno-1', nombre: 'Test', apellido: 'Apellido', grado: '4to', colegioId: 'col-1', saldo: 1500 }
    ]);

    homeAlumnoServiceSpy = jasmine.createSpyObj('HomeAlumnoService', [
      'getPedidoEnCurso',
      'getProximoRecreo',
      'cargarPedidoEnCurso',
      'cargarRecreos',
    ]);
    homeAlumnoServiceSpy.cargarPedidoEnCurso.and.resolveTo();
    homeAlumnoServiceSpy.cargarRecreos.and.resolveTo();
    contextoServiceSpy = jasmine.createSpyObj<AlumnoContextoService>('AlumnoContextoService', ['setAlumnoId', 'limpiar']);

    const usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getAlumnoActual']);
    usuarioServiceSpy.getAlumnoActual.and.returnValue({ id: 'alumno-1' });

    const perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    perfilServiceSpy.obtenerAlumnoId.and.returnValue('alumno-1');

    const colegiosServiceSpy = jasmine.createSpyObj('ColegiosService', ['getColegios', 'obtenerColegios']);
    colegiosServiceSpy.getColegios.and.returnValue([{ id: 'col-1', nombre: 'Colegio Test', direccion: '' }]);
    colegiosServiceSpy.obtenerColegios.and.resolveTo([{ id: 'col-1', nombre: 'Colegio Test', direccion: '' }]);

    TestBed.configureTestingModule({
      providers: [
        HomeAlumnoPresenter,
        { provide: Router, useValue: routerSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: ColegiosService, useValue: colegiosServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: HomeAlumnoService, useValue: homeAlumnoServiceSpy },
        { provide: AlumnoContextoService, useValue: contextoServiceSpy },
      ]
    });

    presenter = TestBed.inject(HomeAlumnoPresenter);
    localStorage.removeItem('home-alumno:fondo-perfil');
  });

  afterEach(() => {
    localStorage.removeItem('home-alumno:fondo-perfil');
  });

  it('debería crearse', () => {
    expect(presenter).toBeTruthy();
  });

  it('debería defaultear a fondo "nubes" si no hay nada guardado', () => {
    presenter.init();
    expect(presenter.fondoPerfil()).toBe('nubes');
  });

  it('debería leer el fondo guardado en localStorage al init', () => {
    localStorage.setItem('home-alumno:fondo-perfil', 'minecraft');
    presenter.init();
    expect(presenter.fondoPerfil()).toBe('minecraft');
  });

  it('debería migrar valores legados ("bee", "creeper") a "minecraft"', () => {
    localStorage.setItem('home-alumno:fondo-perfil', 'creeper');
    presenter.init();
    expect(presenter.fondoPerfil()).toBe('minecraft');
    expect(localStorage.getItem('home-alumno:fondo-perfil')).toBe('minecraft');
  });

  it('debería ignorar valores guardados inválidos', () => {
    localStorage.setItem('home-alumno:fondo-perfil', 'arcoiris');
    presenter.init();
    expect(presenter.fondoPerfil()).toBe('nubes');
  });

  it('debería actualizar y persistir el fondo elegido', () => {
    presenter.init();
    presenter.cambiarFondoPerfil('minecraft');
    expect(presenter.fondoPerfil()).toBe('minecraft');
    expect(localStorage.getItem('home-alumno:fondo-perfil')).toBe('minecraft');
  });

  it('debería aceptar "dragonballz" como fondo válido', () => {
    presenter.init();
    presenter.cambiarFondoPerfil('dragonballz');
    expect(presenter.fondoPerfil()).toBe('dragonballz');
    expect(localStorage.getItem('home-alumno:fondo-perfil')).toBe('dragonballz');
  });

  it('debería ignorar un valor inválido al cambiar', () => {
    presenter.init();
    presenter.cambiarFondoPerfil('nubes');
    presenter.cambiarFondoPerfil('cualquiercosa' as unknown as 'nubes');
    expect(presenter.fondoPerfil()).toBe('nubes');
  });

  it('debería inicializar el estado cargando datos del alumno', async () => {
    homeAlumnoServiceSpy.getPedidoEnCurso.and.returnValue({ id: 'ped-1', estado: 'PREPARANDO', itemsResumen: [], retiraEn: '', totalFormateado: '' });
    
    presenter.init();
    
    await new Promise(r => setTimeout(r, 0));

    expect(alumnosServiceSpy.asegurarCargados).toHaveBeenCalled();
    expect(presenter.nombreCompleto()).toBe('Test Apellido');
    expect(presenter.saldo()).toBe(1500);
    expect(presenter.nombreColegio()).toBe('Colegio Test');
    expect(presenter.tienePedidoEnCurso()).toBeTrue();
    expect(presenter.estadoPedidoLabel()).toBe('Preparando tu pedido');
    expect(contextoServiceSpy.setAlumnoId).toHaveBeenCalledWith('alumno-1');
  });

  it('debería navegar correctamente al ejecutar acciones', async () => {
    presenter.init();
    await new Promise(r => setTimeout(r, 0));

    presenter.ejecutarAccion(presenter.acciones()[0]);
    expect(contextoServiceSpy.setAlumnoId).toHaveBeenCalledWith('alumno-1');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/buffet');

    presenter.ejecutarAccion(presenter.acciones()[2]);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/favoritos');
  });
});
