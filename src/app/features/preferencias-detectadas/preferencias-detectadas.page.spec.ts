import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciasDetectadasPage } from './preferencias-detectadas.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PreferenciasDetectadasPresenter } from './presenter/preferencias-detectadas.presenter';
import { Component, Input, signal } from '@angular/core';
import { PreferenciaDetectada } from './models/preferencia-detectada.model';
import { PreferenciaDetectadaCardComponent } from './components/preferencia-detectada-card/preferencia-detectada-card.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PreferenciasDetectadasMother } from './preferencias-detectadas.mother';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-preferencia-detectada-card',
  template: '',
  standalone: true
})
class PreferenciaDetectadaCardStub {
  @Input() preferencia!: PreferenciaDetectada;
}

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

describe('PreferenciasDetectadasPage', () => {
  let fixture: ComponentFixture<PreferenciasDetectadasPage>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let presenter: jasmine.SpyObj<PreferenciasDetectadasPresenter>;
  
  let preferenciasSubject: BehaviorSubject<PreferenciaDetectada[]>;
  let errorSubject: BehaviorSubject<string | null>;

  beforeEach(async () => {
    preferenciasSubject = new BehaviorSubject<PreferenciaDetectada[]>([]);
    errorSubject = new BehaviorSubject<string | null>(null);

    presenter = jasmine.createSpyObj('PreferenciasDetectadasPresenter', ['initialize'], {
      preferencias$: preferenciasSubject.asObservable(),
      error$: errorSubject.asObservable()
    });
    
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual'], {
      esVistaKiosquero: signal(false),
      esVistaAlumno: signal(false),
      nombreNavbar: signal('Test User'),
      homeUrl: signal('/tutor')
    });

    servicioUsuario.getUsuarioActual.and.returnValue(PreferenciasDetectadasMother.crearUsuario());

    await TestBed.configureTestingModule({
      imports: [PreferenciasDetectadasPage],
      providers: [
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(PreferenciasDetectadasPage, {
        remove: {
          imports: [PreferenciaDetectadaCardComponent, NavbarComponent],
          providers: [PreferenciasDetectadasPresenter]
        },
        add: {
          imports: [NavbarStub, PreferenciaDetectadaCardStub],
          providers: [
            { provide: PreferenciasDetectadasPresenter, useValue: presenter }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PreferenciasDetectadasPage);
  });

  it('debería inicializar el presenter al cargar la vista', () => {
    fixture.detectChanges();

    expect(presenter.initialize).toHaveBeenCalled();
  });
});
