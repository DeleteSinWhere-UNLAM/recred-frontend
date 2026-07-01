import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, Input, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PreferenciasDetectadasPage } from './preferencias-detectadas.page';
import { PreferenciasDetectadasService } from './services/preferencias-detectadas.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PreferenciasDetectadasMother } from './preferencias-detectadas.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

describe('PreferenciasDetectadas Integration', () => {
  let fixture: ComponentFixture<PreferenciasDetectadasPage>;
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
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PreferenciasDetectadasService, useValue: servicioPreferencias }
      ]
    })
      .overrideComponent(PreferenciasDetectadasPage, {
        remove: {
          imports: [NavbarComponent]
        },
        add: {
          imports: [NavbarStub]
        }
      })
      .compileComponents();
  });

  it('debería renderizar la lista de preferencias cuando el servicio responde con datos', () => {
    const preferencias = [
      PreferenciasDetectadasMother.crearPreferencia({ titulo: 'Preferencia 1' }),
      PreferenciasDetectadasMother.crearPreferencia({ titulo: 'Preferencia 2', sugerenciaId: 'sug-2' })
    ];
    servicioPreferencias.getPreferencias.and.returnValue(of(preferencias));
    fixture = TestBed.createComponent(PreferenciasDetectadasPage);
    
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('.preferencias-detectadas__titulo').textContent;
    const tarjetas = fixture.debugElement.queryAll(By.css('app-preferencia-detectada-card'));
    const lista = fixture.nativeElement.querySelector('.preferencias-detectadas__lista');
    
    expect(titulo).toContain('Preferencias detectadas');
    expect(lista).toBeTruthy();
    expect(tarjetas.length).toBe(2);
  });

  it('debería mostrar el estado vacío cuando el servicio devuelve un arreglo vacío', () => {
    servicioPreferencias.getPreferencias.and.returnValue(of([]));
    fixture = TestBed.createComponent(PreferenciasDetectadasPage);
    
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('app-preferencia-detectada-card'));
    const vacio = fixture.nativeElement.querySelector('.preferencias-detectadas__vacio');
    
    expect(tarjetas.length).toBe(0);
    expect(vacio).toBeTruthy();
    expect(vacio.textContent).toContain('No hay preferencias detectadas.');
  });

  it('debería mostrar el error cuando el presenter ataja una falla de red', () => {
    servicioPreferencias.getPreferencias.and.returnValue(throwError(() => new Error('Error 500')));
    fixture = TestBed.createComponent(PreferenciasDetectadasPage);
    
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('app-preferencia-detectada-card'));
    const errorPanel = fixture.nativeElement.querySelector('.preferencias-detectadas__error');
    
    expect(tarjetas.length).toBe(0);
    expect(errorPanel).toBeTruthy();
    expect(errorPanel.textContent).toContain('Error al cargar las preferencias detectadas.');
  });
});
