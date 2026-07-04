import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
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

describe('ConfirmarPage', () => {
  let fixture: ComponentFixture<ConfirmarPage>;
  let component: ConfirmarPage;
  let presenter: PresenterFake;
  let router: jasmine.SpyObj<Router>;

  async function setup(vacia = false): Promise<void> {
    presenter = {
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

    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    const esVistaAlumno = signal(false);
    const nombreNavbar = signal('Tutor Test');
    const usuarioService = { esVistaAlumno, nombreNavbar };

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

  describe('ngOnInit', () => {
    it('dado que la orden esta vacia, cuando se monta la page, deberia redirigir a /compra', async () => {
      await setup(true);

      fixture.detectChanges();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra');
    });

    it('dado que hay ordenes, cuando se monta la page, no deberia redirigir', async () => {
      await setup(false);

      fixture.detectChanges();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('lineas', () => {
    it('dado vista tutor, cuando calculo lineas, deberia mostrar solo el nombre', async () => {
      await setup(false);
      fixture.detectChanges();

      expect(component['lineas']()[0].nombre).toBe('Nombre');
    });

    it('dado el subtotal de la orden, cuando calculo lineas, deberia mapearlo correctamente', async () => {
      await setup(false);
      fixture.detectChanges();

      expect(component['lineas']()[0].subtotal).toBe(500);
      expect(component['lineas']()[0].incluido).toBeTrue();
    });
  });

  describe('formatear', () => {
    it('dado 1500, cuando formateo, deberia devolver moneda AR', async () => {
      await setup(false);
      fixture.detectChanges();

      expect(component['formatear'](1500)).toMatch(/\$\s?1\.500/);
    });
  });
});
