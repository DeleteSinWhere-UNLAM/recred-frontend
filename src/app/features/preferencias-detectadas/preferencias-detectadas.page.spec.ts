import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciasDetectadasPage } from './preferencias-detectadas.page';
import { PreferenciasDetectadasService } from './services/preferencias-detectadas.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { of } from 'rxjs';
import { Component, Input, signal } from '@angular/core';
import { PreferenciaDetectada } from './models/preferencia-detectada.model';
import { PreferenciaDetectadaCardComponent } from './components/preferencia-detectada-card/preferencia-detectada-card.component';
import { Usuario } from '../../data-access/models/usuario.model';

class PreferenciasDetectadasMother {
  static crearUsuario(override: Partial<Usuario> = {}): Usuario {
    return {
      id: 'user-id-123',
      nombre: 'Test User',
      ...override
    } as unknown as Usuario;
  }

  static crearPreferencia(override: Partial<PreferenciaDetectada> = {}): PreferenciaDetectada {
    return {
      sugerenciaId: 'sug-1',
      alumnoId: 'al-1',
      alumnoUserId: 'user-al-1',
      alumnoNombre: 'Juancito',
      tipo: 'COMPRA',
      titulo: 'Le gustan los alfajores',
      mensaje: 'Compra muchos alfajores',
      productoId: 'prod-1',
      razonIA: 'Por frecuencia',
      ...override
    } as unknown as PreferenciaDetectada;
  }
}

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
    let component: PreferenciasDetectadasPage;
    let fixture: ComponentFixture<PreferenciasDetectadasPage>;

    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-123' }));
      const preferenciasEsperadas = [PreferenciasDetectadasMother.crearPreferencia()];
      servicioPreferencias.getPreferencias.and.returnValue(of(preferenciasEsperadas));
      
      fixture = TestBed.createComponent(PreferenciasDetectadasPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('debería solicitar las preferencias detectadas al servicio y asignarlas al estado', () => {
      
      const cantidadPreferencias = component.preferencias.length;

      expect(servicioPreferencias.getPreferencias).toHaveBeenCalledWith('user-id-123');
      expect(cantidadPreferencias).toBe(1);
    });
  });

  describe('Cuando la sesión no es válida', () => {
    it('no debería solicitar las preferencias si el id de usuario no existe', () => {
      
      spyOn(localStorage, 'getItem').and.returnValue(null);
      const fixture = TestBed.createComponent(PreferenciasDetectadasPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(servicioPreferencias.getPreferencias).not.toHaveBeenCalled();
      expect(component.preferencias.length).toBe(0);
    });
  });
});
