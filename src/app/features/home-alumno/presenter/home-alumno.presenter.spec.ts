import { TestBed } from '@angular/core/testing';
import { HomeAlumnoPresenter } from './home-alumno.presenter';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { HomeAlumnoService } from '../services/home-alumno.service';

describe('HomeAlumnoPresenter', () => {
  let presenter: HomeAlumnoPresenter;
  let routerSpy: jasmine.SpyObj<Router>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let homeAlumnoServiceSpy: jasmine.SpyObj<HomeAlumnoService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    alumnosServiceSpy.asegurarCargados.and.resolveTo([
      { id: 'alumno-1', nombre: 'Test', apellido: 'Apellido', grado: '4to', colegioId: 'col-1', saldo: 1500 }
    ]);

    homeAlumnoServiceSpy = jasmine.createSpyObj('HomeAlumnoService', ['getPedidoEnCurso', 'getProximoRecreo']);

    const usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getAlumnoActual']);
    usuarioServiceSpy.getAlumnoActual.and.returnValue({ id: 'alumno-1' });

    const perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    perfilServiceSpy.obtenerAlumnoId.and.returnValue('alumno-1');

    const colegiosServiceSpy = jasmine.createSpyObj('ColegiosService', ['getColegios']);
    colegiosServiceSpy.getColegios.and.returnValue([{ id: 'col-1', nombre: 'Colegio Test', direccion: '' }]);

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

  it('debería crearse', () => {
    expect(presenter).toBeTruthy();
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
  });

  it('debería navegar correctamente al ejecutar acciones', async () => {
    presenter.init();
    await new Promise(r => setTimeout(r, 0));

    presenter.ejecutarAccion(presenter.acciones()[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/buffet', 'alumno-1']);

    presenter.ejecutarAccion(presenter.acciones()[2]);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/favoritos');
  });
});
