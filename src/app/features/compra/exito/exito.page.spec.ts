import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { OrdenAlumnoMother } from '../compra.mother';
import { CodigoRetiroCardComponent } from '../components/codigo-retiro-card/codigo-retiro-card.component';
import { OrdenAlumno, Recreo } from '../models/orden-compra.model';
import { ExitoPage } from './exito.page';
import { ExitoPresenter } from './presenter/exito.presenter';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-codigo-retiro-card', template: '', standalone: true })
class CodigoRetiroCardStub {
  @Input() alumno!: unknown;
  @Input() codigo = '';
  @Input() fecha = '';
  @Input() recreo: Recreo = 'PRIMER_RECREO';
}

interface PresenterFake {
  ordenes: ReturnType<typeof signal<OrdenAlumno[]>>;
  codigos: ReturnType<typeof signal<Record<string, string>>>;
  total: ReturnType<typeof signal<number>>;
  vacia: ReturnType<typeof signal<boolean>>;
  codigoDe: jasmine.Spy;
  volverInicio: jasmine.Spy;
  verPendientes: jasmine.Spy;
}

class PresenterFakeMother {
  static crear(vacia = false): PresenterFake {
    return {
      ordenes: signal(vacia ? [] : [OrdenAlumnoMother.crear()]),
      codigos: signal({ 'alumno-1': 'ABC123' }),
      total: signal(500),
      vacia: signal(vacia),
      codigoDe: jasmine.createSpy('codigoDe').and.returnValue('ABC123'),
      volverInicio: jasmine.createSpy('volverInicio'),
      verPendientes: jasmine.createSpy('verPendientes'),
    };
  }
}

describe('ExitoPage', () => {
  let fixture: ComponentFixture<ExitoPage>;
  let component: ExitoPage;
  let presenter: PresenterFake;
  let router: jasmine.SpyObj<Router>;

  describe('ngOnInit', () => {
    it('dado que la orden esta vacia, cuando se monta la page, deberia redirigir al homeUrl del usuario', async () => {
      await givenPageConfigurada({ vacia: true });

      whenMonto();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });

    it('dado que hay orden, cuando se monta la page, no deberia redirigir', async () => {
      await givenPageConfigurada({ vacia: false });

      whenMonto();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('dado que hay orden, cuando se monta la page, deberia intentar reproducir el sonido de exito', async () => {
      await givenPageConfigurada({ vacia: false });

      whenMonto();

      expect(Audio.prototype.play).toHaveBeenCalled();
    });
  });

  describe('totalFormateado', () => {
    it('dado total del presenter, cuando lo formateo, deberia devolverlo en moneda AR', async () => {
      await givenPageConfigurada({ vacia: false });
      whenMonto();

      expect(component['totalFormateado']).toMatch(/\$\s?500/);
    });
  });

  describe('audio.play falla', () => {
    it('dado que audio.play rechaza, cuando se monta la page, deberia catchear el error silenciosamente', async () => {
      await givenPageConfigurada({ vacia: false });
      (Audio.prototype.play as jasmine.Spy).and.rejectWith(new Error('AutoplayBlocked'));

      expect(() => whenMonto()).not.toThrow();
      await fixture.whenStable();
    });
  });

  async function givenPageConfigurada(opciones: { vacia: boolean }): Promise<void> {
    presenter = PresenterFakeMother.crear(opciones.vacia);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    const usuarioService = {
      nombreNavbar: signal('Tutor'),
      homeUrl: signal('/tutor'),
    };

    await TestBed.configureTestingModule({
      imports: [ExitoPage],
      providers: [
        { provide: UsuarioService, useValue: usuarioService },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(ExitoPage, {
        remove: { imports: [NavbarComponent, CodigoRetiroCardComponent] },
        add: {
          imports: [NavbarStub, CodigoRetiroCardStub],
          providers: [{ provide: ExitoPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ExitoPage);
    component = fixture.componentInstance;

    spyOn(Audio.prototype, 'play').and.resolveTo();
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
