import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciasDetectadasPage } from './preferencias-detectadas.page';
import { PreferenciasDetectadasService } from './services/preferencias-detectadas.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { of } from 'rxjs';
import { Component, Input, signal } from '@angular/core';
import { PreferenciaDetectada } from './models/preferencia-detectada.model';
import { PreferenciaDetectadaCardComponent } from './components/preferencia-detectada-card/preferencia-detectada-card.component';
import { PreferenciasDetectadasMother } from './preferencias-detectadas.mother';



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
  let servicioPreferencias: jasmine.SpyObj<PreferenciasDetectadasService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let component: PreferenciasDetectadasPage;
  let fixture: ComponentFixture<PreferenciasDetectadasPage>;

  beforeEach(async () => {
    servicioPreferencias = jasmine.createSpyObj('PreferenciasDetectadasService', ['getPreferencias']);
    
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
        { provide: PreferenciasDetectadasService, useValue: servicioPreferencias },
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(PreferenciasDetectadasPage, {
        remove: {
          imports: [PreferenciaDetectadaCardComponent]
        },
        add: {
          imports: [NavbarStub, PreferenciaDetectadaCardStub]
        }
      })
      .compileComponents();
  });

  describe('Cuando el perfil existe en localStorage', () => {
    it('debería solicitar las preferencias detectadas al servicio y asignarlas al estado', () => {
      givenElPerfilExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenSeLlamoASolicitarPreferencias();
    });
  });

  describe('Cuando la sesión no es válida', () => {
    it('no debería solicitar las preferencias si el id de usuario no existe', () => {
      givenElPerfilNoExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenNoSeSolicitanPreferencias();
    });

    it('no debería solicitar las preferencias si el perfil no contiene un id', () => {
      givenElPerfilEstaMalFormado();
      whenSeCreaElComponenteYDetectaCambios();
      thenNoSeSolicitanPreferencias();
    });
  });

  function givenElPerfilExiste(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-123' }));
    const preferenciasEsperadas = [PreferenciasDetectadasMother.crearPreferencia()];
    servicioPreferencias.getPreferencias.and.returnValue(of(preferenciasEsperadas));
  }

  function givenElPerfilNoExiste(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function givenElPerfilEstaMalFormado(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ role: 'admin' }));
  }

  function whenSeCreaElComponenteYDetectaCambios(): void {
    fixture = TestBed.createComponent(PreferenciasDetectadasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function thenSeLlamoASolicitarPreferencias(): void {
    expect(servicioPreferencias.getPreferencias).toHaveBeenCalledWith('user-id-123');
    expect(component.preferencias.length).toBe(1);
  }

  function thenNoSeSolicitanPreferencias(): void {
    expect(servicioPreferencias.getPreferencias).not.toHaveBeenCalled();
    expect(component.preferencias.length).toBe(0);
  }
});
