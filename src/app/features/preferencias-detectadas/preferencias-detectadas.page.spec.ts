import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PreferenciaDetectadaCardComponent } from './components/preferencia-detectada-card/preferencia-detectada-card.component';
import { PreferenciaDetectada } from './models/preferencia-detectada.model';
import { PreferenciasDetectadasMother } from './preferencias-detectadas.mother';
import { PreferenciasDetectadasPage } from './preferencias-detectadas.page';
import { PreferenciasDetectadasService } from './services/preferencias-detectadas.service';

@Component({ selector: 'app-preferencia-detectada-card', template: '', standalone: true })
class PreferenciaDetectadaCardStub {
  @Input() preferencia!: PreferenciaDetectada;
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
      homeUrl: signal('/tutor'),
    });
    servicioUsuario.getUsuarioActual.and.returnValue(PreferenciasDetectadasMother.crearUsuario());

    await TestBed.configureTestingModule({
      imports: [PreferenciasDetectadasPage],
      providers: [
        { provide: PreferenciasDetectadasService, useValue: servicioPreferencias },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(PreferenciasDetectadasPage, {
        remove: { imports: [PreferenciaDetectadaCardComponent] },
        add: { imports: [PreferenciaDetectadaCardStub] },
      })
      .compileComponents();
  });

  describe('cuando hay perfil en localStorage', () => {
    let component: PreferenciasDetectadasPage;
    let fixture: ComponentFixture<PreferenciasDetectadasPage>;

    beforeEach(() => {
      givenPerfilEnLocalStorage('user-id-123');
      servicioPreferencias.getPreferencias.and.returnValue(
        of([PreferenciasDetectadasMother.crearPreferencia()]),
      );

      fixture = TestBed.createComponent(PreferenciasDetectadasPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('dado el perfil en localStorage, cuando se monta, deberia pedirle las preferencias al service con ese id', () => {
      expect(servicioPreferencias.getPreferencias).toHaveBeenCalledWith('user-id-123');
      expect(component.preferencias.length).toBe(1);
    });

    it('dado preferencias del service, cuando se monta, deberia renderizar una card por preferencia', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-preferencia-detectada-card',
      );
      expect(cards.length).toBe(1);
    });

    it('dado el UsuarioService, deberia exponer nombreUsuario', () => {
      expect(component.nombreUsuario).toBe('Test User');
    });
  });

  describe('cuando no hay perfil en localStorage', () => {
    it('dado sin perfil, cuando se monta, no deberia pedir preferencias ni tener items', () => {
      givenSinPerfilEnLocalStorage();

      const fixture = TestBed.createComponent(PreferenciasDetectadasPage);
      fixture.detectChanges();

      expect(servicioPreferencias.getPreferencias).not.toHaveBeenCalled();
      expect(fixture.componentInstance.preferencias.length).toBe(0);
    });

    it('dado sin preferencias, cuando renderizo, deberia mostrar el estado vacio', () => {
      givenSinPerfilEnLocalStorage();

      const fixture = TestBed.createComponent(PreferenciasDetectadasPage);
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'No hay preferencias detectadas.',
      );
    });
  });

  function givenPerfilEnLocalStorage(usuarioId: string): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: usuarioId }));
  }

  function givenSinPerfilEnLocalStorage(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }
});
