import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenSemanalPage } from './resumen-semanal.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ResumenSemanalPresenter } from './presenter/resumen-semanal.presenter';
import { Component, Input, signal } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ResumenSemanalMother } from './resumen-semanal.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

describe('ResumenSemanalPage', () => {
  let fixture: ComponentFixture<ResumenSemanalPage>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let presenter: jasmine.SpyObj<ResumenSemanalPresenter>;

  beforeEach(async () => {
    presenter = jasmine.createSpyObj('ResumenSemanalPresenter', ['initialize']);
    
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual'], {
      esVistaKiosquero: signal(false),
      esVistaAlumno: signal(false),
      nombreNavbar: signal('Test User'),
      homeUrl: signal('/tutor')
    });

    servicioUsuario.getUsuarioActual.and.returnValue(ResumenSemanalMother.crearUsuario());

    await TestBed.configureTestingModule({
      imports: [ResumenSemanalPage],
      providers: [
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(ResumenSemanalPage, {
        remove: {
          imports: [NavbarComponent],
          providers: [ResumenSemanalPresenter]
        },
        add: {
          imports: [NavbarStub],
          providers: [
            { provide: ResumenSemanalPresenter, useValue: presenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResumenSemanalPage);
  });

  it('debería inicializar el presenter al cargar la vista', () => {
    fixture.detectChanges();

    expect(presenter.initialize).toHaveBeenCalled();
  });
});
