import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { OrdenAlumnoMother } from '../compra.mother';
import {
  ResumenLinea,
  ResumenOrdenCardComponent,
} from '../components/resumen-orden-card/resumen-orden-card.component';
import { OrdenAlumno } from '../models/orden-compra.model';
import { ConfirmarPage } from './confirmar.page';
import { ConfirmarPresenter } from './presenter/confirmar.presenter';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-resumen-orden-card', template: '', standalone: true })
class ResumenOrdenCardStub {
  @Input() lineas: ResumenLinea[] = [];
  @Input() total = 0;
  @Input() ctaLabel = '';
  @Input() ctaDeshabilitado = false;
  @Input() cargando = false;
  @Input() advertencia: string | null = null;
  @Output() accion = new EventEmitter<void>();
}

interface PresenterFake {
  ordenes: ReturnType<typeof signal<OrdenAlumno[]>>;
  total: ReturnType<typeof signal<number>>;
  vacia: ReturnType<typeof signal<boolean>>;
  cargando: ReturnType<typeof signal<boolean>>;
  advertenciaSaldo: ReturnType<typeof signal<string | null>>;
  confirmarCompra: jasmine.Spy;
  formatearFecha: jasmine.Spy;
  formatearRecreo: jasmine.Spy;
  recreoLabel: jasmine.Spy;
  confirmar: jasmine.Spy;
}

class PresenterFakeMother {
  static crear(vacia = false): PresenterFake {
    return {
      ordenes: signal(vacia ? [] : [OrdenAlumnoMother.crear()]),
      total: signal(500),
      vacia: signal(vacia),
      cargando: signal(false),
      advertenciaSaldo: signal(null),
      confirmarCompra: jasmine.createSpy('confirmarCompra'),
      formatearFecha: jasmine.createSpy('formatearFecha').and.returnValue('15-07-2026'),
      formatearRecreo: jasmine.createSpy('formatearRecreo').and.returnValue('1er Recreo'),
      recreoLabel: jasmine.createSpy('recreoLabel').and.returnValue('1er Recreo'),
      confirmar: jasmine.createSpy('confirmar'),
    };
  }
}

describe('ConfirmarPage', () => {
  let fixture: ComponentFixture<ConfirmarPage>;
  let component: ConfirmarPage;
  let presenter: PresenterFake;
  let router: jasmine.SpyObj<Router>;

  describe('ngOnInit', () => {
    it('dado que la orden esta vacia, cuando se monta la page, deberia redirigir a /compra', async () => {
      await givenPageConfigurada({ vacia: true });

      whenMonto();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra');
    });

    it('dado que hay ordenes, cuando se monta la page, no deberia redirigir', async () => {
      await givenPageConfigurada({ vacia: false });

      whenMonto();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('lineas', () => {
    it('dado vista tutor, cuando calculo lineas, deberia mostrar solo el nombre', async () => {
      await givenPageConfigurada({ vacia: false });
      whenMonto();

      expect(component['lineas']()[0].nombre).toBe('Nombre');
    });

    it('dado el subtotal de la orden, cuando calculo lineas, deberia mapearlo correctamente', async () => {
      await givenPageConfigurada({ vacia: false });
      whenMonto();

      expect(component['lineas']()[0].subtotal).toBe(500);
      expect(component['lineas']()[0].incluido).toBeTrue();
    });

    it('dado vista alumno, cuando calculo lineas, deberia mostrar "nombre apellido"', async () => {
      await givenPageConfigurada({ vacia: false });
      const usuarioService = TestBed.inject(UsuarioService) as unknown as {
        esVistaAlumno: WritableSignal<boolean>;
      };
      usuarioService.esVistaAlumno.set(true);
      whenMonto();

      expect(component['lineas']()[0].nombre).toContain(' ');
    });
  });

  describe('formatear', () => {
    it('dado 1500, cuando formateo, deberia devolver moneda AR', async () => {
      await givenPageConfigurada({ vacia: false });
      whenMonto();

      expect(component['formatear'](1500)).toMatch(/\$\s?1\.500/);
    });
  });

  async function givenPageConfigurada(opciones: { vacia: boolean }): Promise<void> {
    presenter = PresenterFakeMother.crear(opciones.vacia);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    const usuarioService = {
      esVistaAlumno: signal(false),
      nombreNavbar: signal('Tutor Test'),
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmarPage],
      providers: [
        { provide: UsuarioService, useValue: usuarioService },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(ConfirmarPage, {
        remove: { imports: [NavbarComponent, ResumenOrdenCardComponent] },
        add: {
          imports: [NavbarStub, ResumenOrdenCardStub],
          providers: [{ provide: ConfirmarPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConfirmarPage);
    component = fixture.componentInstance;
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
