import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PerfilHeaderComponent } from './components/perfil-header/perfil-header.component';
import { AccionesGridComponent } from './components/acciones-grid/acciones-grid.component';
import { PedidoRecreoCardComponent } from './components/pedido-recreo-card/pedido-recreo-card.component';
import { HomeAlumnoService } from './services/home-alumno.service';
import { HomeAlumnoPage } from './home-alumno.page';
import { AccionRapida } from './models/accion-rapida.model';
import { FondoPerfil } from './models/fondo-perfil.model';
import { PedidoEnCurso } from './models/pedido-en-curso.model';
import { Recreo } from './models/recreo.model';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { PedidoEnCursoMother } from './home-alumno.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true,
})
class NavbarStub {
  @Input() userName = '';
}

@Component({
  selector: 'app-perfil-header',
  template: '',
  standalone: true,
})
class PerfilHeaderStub {
  @Input() iniciales = '';
  @Input() nombreCompleto = '';
  @Input() urlFotoPerfil: string | null = null;
  @Input() grado = '';
  @Input() colegio = '';
  @Input() saldoFormateado = '';
  @Input() saldoNegativo = false;
  @Input() fondo: FondoPerfil = 'nubes';
  @Output() cambioFondo = new EventEmitter<FondoPerfil>();
}

@Component({
  selector: 'app-acciones-grid',
  template: '',
  standalone: true,
})
class AccionesGridStub {
  @Input() acciones: AccionRapida[] = [];
  @Output() accion = new EventEmitter<AccionRapida>();
}

@Component({
  selector: 'app-pedido-recreo-card',
  template: '',
  standalone: true,
})
class PedidoRecreoCardStub {
  @Input() pedido: PedidoEnCurso | undefined;
  @Input() recreo: Recreo | undefined;
  @Input() estadoLabel = '';
  @Input() iconoEstado = 'fa-utensils';
  @Output() verPedido = new EventEmitter<void>();
}

describe('HomeAlumno Integration', () => {
  let fixture: ComponentFixture<HomeAlumnoPage>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioHomeAlumno: jasmine.SpyObj<HomeAlumnoService>;
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;
  let router: jasmine.SpyObj<Router>;

  const alumno = AlumnoMother.crear({
    id: 'alumno-1',
    nombre: 'Julián',
    apellido: 'García',
    grado: '5A',
    colegioId: 'col-1',
    saldo: 2500,
  });

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    servicioAlumnos.asegurarCargados.and.resolveTo([alumno]);

    servicioColegios = jasmine.createSpyObj('ColegiosService', ['obtenerColegios', 'getColegios']);
    servicioColegios.obtenerColegios.and.resolveTo([{ id: 'col-1', nombre: 'Colegio A' }]);
    servicioColegios.getColegios.and.returnValue([{ id: 'col-1', nombre: 'Colegio A' }]);

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    servicioPerfil.obtenerAlumnoId.and.returnValue('alumno-1');

    servicioUsuario = jasmine.createSpyObj('UsuarioService', [
      'setHomeUrl',
      'setNombreNavbar',
      'getAlumnoActual',
    ]);
    Object.assign(servicioUsuario, {
      esVistaAlumno: signal(true),
      esVistaKiosquero: signal(false),
      nombreNavbar: signal(''),
    });
    servicioUsuario.getAlumnoActual.and.returnValue(AlumnoMother.crearAlumnoActual());

    servicioHomeAlumno = jasmine.createSpyObj('HomeAlumnoService', [
      'getPedidoEnCurso',
      'getProximoRecreo',
      'cargarPedidoEnCurso',
      'cargarRecreos',
    ]);
    servicioHomeAlumno.getPedidoEnCurso.and.returnValue(PedidoEnCursoMother.crear({ estado: 'LISTO' }));
    servicioHomeAlumno.getProximoRecreo.and.returnValue(undefined);
    servicioHomeAlumno.cargarPedidoEnCurso.and.resolveTo();
    servicioHomeAlumno.cargarRecreos.and.resolveTo();

    servicioContexto = jasmine.createSpyObj('AlumnoContextoService', ['setAlumnoId']);

    await TestBed.configureTestingModule({
      imports: [HomeAlumnoPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: HomeAlumnoService, useValue: servicioHomeAlumno },
        { provide: AlumnoContextoService, useValue: servicioContexto },
      ],
    })
      .overrideComponent(HomeAlumnoPage, {
        remove: {
          imports: [
            NavbarComponent,
            PerfilHeaderComponent,
            AccionesGridComponent,
            PedidoRecreoCardComponent,
          ],
        },
        add: { imports: [NavbarStub, PerfilHeaderStub, AccionesGridStub, PedidoRecreoCardStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeAlumnoPage);
  });

  it('dado un alumno cargado, cuando monto la pagina, deberia propagar los datos del alumno al PerfilHeader', async () => {
    await whenMontoLaPaginaConDosTicks();

    const header = obtenerHeader();
    expect(header.nombreCompleto).toBe('Julián García');
    expect(header.iniciales).toBe('JG');
    expect(header.grado).toBe('5A');
    expect(header.colegio).toBe('Colegio A');
    expect(header.saldoFormateado).toContain('2');
    expect(header.saldoFormateado).toContain('500');
  });

  it('dado un alumno cargado, cuando monto la pagina, deberia setear el contexto y disparar la carga del pedido', async () => {
    await whenMontoLaPagina();

    expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
    expect(servicioHomeAlumno.cargarPedidoEnCurso).toHaveBeenCalledWith('alumno-1');
    expect(servicioHomeAlumno.cargarRecreos).toHaveBeenCalledWith('col-1');
  });

  it('dado un pedido LISTO del service, cuando monto la pagina, deberia propagarlo al PedidoRecreoCard', async () => {
    await whenMontoLaPaginaConDosTicks();

    const card = obtenerCard();
    expect(card.pedido?.id).toBe('pedido-1');
    expect(card.estadoLabel).toBe('Listo para retirar');
    expect(card.iconoEstado).toBe('fa-bell');
  });

  it('dado el AccionesGrid renderizado, cuando emite la accion de buffet, deberia navegar a /buffet y setear el contexto', async () => {
    await whenMontoLaPaginaConDosTicks();
    const grid = obtenerGrid();
    servicioContexto.setAlumnoId.calls.reset();

    grid.accion.emit({
      id: 'buffet',
      label: 'Ir al buffet',
      descripcion: '',
      icono: '',
      emoji: '',
      color: 'menta',
      ruta: '/buffet',
    });

    expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/buffet');
  });

  async function whenMontoLaPagina(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function whenMontoLaPaginaConDosTicks(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function obtenerHeader(): PerfilHeaderStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof PerfilHeaderStub)
      ?.componentInstance as PerfilHeaderStub;
  }

  function obtenerCard(): PedidoRecreoCardStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof PedidoRecreoCardStub)
      ?.componentInstance as PedidoRecreoCardStub;
  }

  function obtenerGrid(): AccionesGridStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof AccionesGridStub)
      ?.componentInstance as AccionesGridStub;
  }
});
