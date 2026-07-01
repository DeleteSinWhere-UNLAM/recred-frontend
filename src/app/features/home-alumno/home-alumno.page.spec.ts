import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PerfilHeaderComponent } from './components/perfil-header/perfil-header.component';
import { AccionesGridComponent } from './components/acciones-grid/acciones-grid.component';
import { PedidoRecreoCardComponent } from './components/pedido-recreo-card/pedido-recreo-card.component';
import { HomeAlumnoPresenter } from './presenter/home-alumno.presenter';
import { AccionRapida } from './models/accion-rapida.model';
import { FondoPerfil } from './models/fondo-perfil.model';
import { PedidoEnCurso } from './models/pedido-en-curso.model';
import { Recreo } from './models/recreo.model';
import { HomeAlumnoPage } from './home-alumno.page';
import { AccionRapidaMother, PedidoEnCursoMother, RecreoMother } from './home-alumno.mother';

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

describe('HomeAlumnoPage', () => {
  let fixture: ComponentFixture<HomeAlumnoPage>;
  let component: HomeAlumnoPage;
  let presenter: jasmine.SpyObj<HomeAlumnoPresenter>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    presenter = crearPresenterSpy();
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl', 'setNombreNavbar']);
    Object.assign(servicioUsuario, {
      esVistaAlumno: signal(true),
      esVistaKiosquero: signal(false),
      nombreNavbar: signal('Juan'),
    });

    await TestBed.configureTestingModule({
      imports: [HomeAlumnoPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsuarioService, useValue: servicioUsuario },
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
        add: {
          imports: [NavbarStub, PerfilHeaderStub, AccionesGridStub, PedidoRecreoCardStub],
          providers: [{ provide: HomeAlumnoPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeAlumnoPage);
    component = fixture.componentInstance;
  });

  it('dado que se monta la pagina, deberia crearse correctamente', () => {
    whenMontoLaPagina();

    expect(component).toBeTruthy();
  });

  it('dado que se monta la pagina, deberia configurar la url de inicio en /alumno', () => {
    whenMontoLaPagina();

    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/alumno');
  });

  it('dado que se monta la pagina, deberia delegar el init al presenter', () => {
    whenMontoLaPagina();

    expect(presenter.init).toHaveBeenCalled();
  });

  it('dado un presenter con nombre del alumno, cuando monto la pagina, deberia setear el nombre del navbar', () => {
    whenMontoLaPagina();

    expect(servicioUsuario.setNombreNavbar).toHaveBeenCalledWith('Juan');
  });

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
  }
});

function crearPresenterSpy(): jasmine.SpyObj<HomeAlumnoPresenter> {
  const spy = jasmine.createSpyObj<HomeAlumnoPresenter>('HomeAlumnoPresenter', [
    'init',
    'ejecutarAccion',
    'irAlBuffet',
    'verPedido',
    'cambiarFondoPerfil',
  ]);
  Object.assign(spy, {
    alumno: signal(undefined),
    fondoPerfil: signal<FondoPerfil>('nubes'),
    pedidoEnCurso: signal<PedidoEnCurso | undefined>(PedidoEnCursoMother.crear()),
    proximoRecreo: signal<Recreo | undefined>(RecreoMother.crear()),
    nombreAlumno: signal('Juan'),
    nombreCompleto: signal('Juan Pérez'),
    urlFotoPerfil: signal<string | null>(null),
    iniciales: signal('JP'),
    grado: signal('5A'),
    nombreColegio: signal('Colegio A'),
    saldo: signal(2000),
    saldoFormateado: signal('$ 2.000'),
    saldoNegativo: signal(false),
    tienePedidoEnCurso: signal(true),
    estadoPedidoLabel: signal('Pedido confirmado'),
    iconoEstadoPedido: signal('fa-clipboard-check'),
    acciones: signal([AccionRapidaMother.crearBuffet()]),
  });
  return spy;
}
