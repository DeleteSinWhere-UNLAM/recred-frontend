import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Router } from '@angular/router';
import { Component, Input } from '@angular/core';
import { SugerenciasAgregarPage } from './sugerencias-agregar.page';
import { SugerenciasAgregarPresenter } from './presenter/sugerencias-agregar.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SugerenciasAgregarMother } from './sugerencias-agregar.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
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
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    presenter = jasmine.createSpyObj('SugerenciasAgregarPresenter', ['initialize']);

    servicioUsuario.getUsuarioActual.and.returnValue(SugerenciasAgregarMother.crearUsuario({ rol: 'KIOSQUERO' } as unknown as Parameters<typeof SugerenciasAgregarMother.crearUsuario>[0]));

    await TestBed.configureTestingModule({
      imports: [SugerenciasAgregarPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(SugerenciasAgregarPage, {
        remove: {
          imports: [NavbarComponent]
        },
        add: {
          imports: [NavbarStub],
          providers: [
            { provide: SugerenciasAgregarPresenter, useValue: presenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    component = fixture.componentInstance;
  });

  it('debería configurar la url de inicio del kiosquero al construirse', () => {
    thenHomeUrlFueConfigurada('/kiosquero');
  });

  it('debería delegar al presenter la inicialización si el usuario existe en sesión', () => {
    givenUsuarioExisteEnSesion();
    whenDetectoCambios();
    thenSeDelegoLaInicializacionAlPresenter();
  });

  it('no debería delegar la inicialización al presenter si no hay usuario en sesión', () => {
    givenNoExisteUsuarioEnSesion();
    whenDetectoCambios();
    thenNoSeDelegoLaInicializacionAlPresenter();
  });

  it('debería delegar al router la navegación hacia el home al presionar volver', () => {
    whenPresionoVolver();
    thenSeNavegaAlHome('/kiosquero');
  });

  function givenUsuarioExisteEnSesion(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(SugerenciasAgregarMother.crearUsuario({ rol: 'KIOSQUERO' } as unknown as Parameters<typeof SugerenciasAgregarMother.crearUsuario>[0])));
  }

  function givenNoExisteUsuarioEnSesion(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function whenDetectoCambios(): void {
    fixture.detectChanges();
  }

  function whenPresionoVolver(): void {
    component.volver();
  }

  function thenHomeUrlFueConfigurada(url: string): void {
    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith(url);
  }

  function thenSeDelegoLaInicializacionAlPresenter(): void {
    expect(presenter.initialize).toHaveBeenCalled();
  }

  function thenNoSeDelegoLaInicializacionAlPresenter(): void {
    expect(presenter.initialize).not.toHaveBeenCalled();
  }

  function thenSeNavegaAlHome(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }
});
