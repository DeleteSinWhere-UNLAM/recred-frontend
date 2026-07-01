import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, Input, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ResumenSemanalPage } from './resumen-semanal.page';
import { ResumenSemanalService } from './services/resumen-semanal.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
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

describe('ResumenSemanal Integration', () => {
  let fixture: ComponentFixture<ResumenSemanalPage>;
  let servicioResumen: jasmine.SpyObj<ResumenSemanalService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioResumen = jasmine.createSpyObj('ResumenSemanalService', ['getResumen']);
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
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: ResumenSemanalService, useValue: servicioResumen }
      ]
    })
      .overrideComponent(ResumenSemanalPage, {
        remove: {
          imports: [NavbarComponent]
        },
        add: {
          imports: [NavbarStub]
        }
      })
      .compileComponents();
  });

  it('debería renderizar todos los datos del resumen cuando el servicio responde correctamente', () => {
    const resumen = ResumenSemanalMother.crearResumen();
    servicioResumen.getResumen.and.returnValue(of(resumen));
    fixture = TestBed.createComponent(ResumenSemanalPage);
    
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.rs__header').textContent;
    const barrasGrafico = fixture.debugElement.queryAll(By.css('.rs__bar-item'));
    const mensajesIa = fixture.debugElement.queryAll(By.css('.rs__insight-item'));
    const tarjetasHijos = fixture.debugElement.queryAll(By.css('.rs__child-card'));
    const metricas = fixture.debugElement.queryAll(By.css('.rs__metric'));
    
    expect(header).toContain('Resumen semanal');
    expect(header).toContain('2023-01-01 - 2023-01-07');
    expect(barrasGrafico.length).toBe(2);
    expect(barrasGrafico[0].nativeElement.textContent).toContain('Juan');
    expect(mensajesIa.length).toBe(1);
    expect(mensajesIa[0].nativeElement.textContent).toContain('Juan');
    expect(mensajesIa[0].nativeElement.textContent).toContain('Buen ahorro');
    expect(tarjetasHijos.length).toBe(2);
    expect(tarjetasHijos[0].nativeElement.textContent).toContain('Juan');
    expect(tarjetasHijos[1].nativeElement.textContent).toContain('Maria');
    expect(metricas[0].nativeElement.textContent).toContain('$1500'); // Gasto total
  });

  it('debería mostrar el estado de análisis vacío cuando no hay mensajes de la IA', () => {
    const resumen = ResumenSemanalMother.crearResumen({
      resumen: JSON.stringify({ hijos: {}, mensaje: JSON.stringify([]) })
    });
    servicioResumen.getResumen.and.returnValue(of(resumen));
    fixture = TestBed.createComponent(ResumenSemanalPage);
    
    fixture.detectChanges();

    const mensajesIa = fixture.debugElement.queryAll(By.css('.rs__insight-item'));
    const vacioIa = fixture.nativeElement.querySelector('.rs__empty');
    
    expect(mensajesIa.length).toBe(0);
    expect(vacioIa).toBeTruthy();
    expect(vacioIa.textContent).toContain('No hay análisis disponible para este período.');
  });

  it('debería mostrar el error en pantalla cuando el presenter ataja una falla de red', () => {
    servicioResumen.getResumen.and.returnValue(throwError(() => new Error('Error 500')));
    fixture = TestBed.createComponent(ResumenSemanalPage);
    
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.rs__container');
    const errorPanel = fixture.nativeElement.querySelector('.rs__error');
    
    expect(container).toBeFalsy(); // No debe renderizar el main content
    expect(errorPanel).toBeTruthy();
    expect(errorPanel.textContent).toContain('Error al cargar el resumen semanal.');
  });
});
