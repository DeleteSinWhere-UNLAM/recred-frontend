import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SugerenciasAgregarPresenter } from './presenter/sugerencias-agregar.presenter';
import { UsuarioMother } from './sugerencias-agregar.mother';
import { SugerenciasAgregarPage } from './sugerencias-agregar.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('SugerenciasAgregarPage', () => {
  let component: SugerenciasAgregarPage;
  let fixture: ComponentFixture<SugerenciasAgregarPage>;
  let router: jasmine.SpyObj<Router>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let presenter: jasmine.SpyObj<SugerenciasAgregarPresenter>;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
    ]);
    presenter = jasmine.createSpyObj<SugerenciasAgregarPresenter>('SugerenciasAgregarPresenter', [
      'initialize',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue(UsuarioMother.crear());

    await TestBed.configureTestingModule({
      imports: [SugerenciasAgregarPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(SugerenciasAgregarPage, {
        remove: { imports: [NavbarComponent] },
        add: {
          imports: [NavbarStub],
          providers: [{ provide: SugerenciasAgregarPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  describe('constructor', () => {
    it('cuando se construye la page, deberia setear la homeUrl del kiosquero', () => {
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('ngOnInit', () => {
    it('dado un usuario en localStorage, cuando se monta la page, deberia inicializar el presenter', () => {
      givenUsuarioEnLocalStorage(UsuarioMother.crear());

      whenMonto();

      expect(presenter.initialize).toHaveBeenCalled();
    });

    it('dado que no hay usuario en localStorage, cuando se monta la page, no deberia inicializar el presenter', () => {
      givenSinUsuarioEnLocalStorage();

      whenMonto();

      expect(presenter.initialize).not.toHaveBeenCalled();
    });
  });

  describe('volver', () => {
    it('cuando hago click en volver, deberia navegar a inteligencia comercial', () => {
      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero/inteligencia-comercial');
    });
  });

  function givenUsuarioEnLocalStorage(usuario: ReturnType<typeof UsuarioMother.crear>): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(usuario));
  }

  function givenSinUsuarioEnLocalStorage(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
