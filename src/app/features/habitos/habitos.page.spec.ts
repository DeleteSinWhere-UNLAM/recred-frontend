import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HabitoAlertaMother } from './habitos.mother';
import { HabitosPage } from './habitos.page';
import { HabitosService } from './services/habitos.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('HabitosPage', () => {
  let component: HabitosPage;
  let fixture: ComponentFixture<HabitosPage>;
  let servicioHabitos: jasmine.SpyObj<HabitosService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioHabitos = jasmine.createSpyObj('HabitosService', ['getAlertas']);
    servicioHabitos.getAlertas.and.returnValue([
      HabitoAlertaMother.crear(),
      HabitoAlertaMother.crearParaBebidas(),
    ]);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [HabitosPage],
      providers: [
        { provide: HabitosService, useValue: servicioHabitos },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(HabitosPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HabitosPage);
    component = fixture.componentInstance;
  });

  describe('Estado inicial', () => {
    it('dado la page recien creada, deberia exponer el nombre del usuario y las alertas del service', () => {
      expect(component.nombreUsuario).toBe('Tutor Test');
      expect(component.alertas.length).toBe(2);
    });
  });

  describe('render', () => {
    it('dado la page montada, deberia mostrar el titulo Habitos de consumo', () => {
      whenMonto();

      expect(textoRenderizado()).toContain('Hábitos de consumo');
    });

    it('dado las alertas del service, deberia renderizar el nombre de cada alumno', () => {
      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('Julián García');
      expect(texto).toContain('Sofía García');
    });

    it('dado las alertas del service, deberia mostrar los mensajes', () => {
      whenMonto();

      expect(textoRenderizado()).toContain('Tu hijo gasta 40% en golosinas');
    });

    it('dado las alertas del service, deberia mostrar las sugerencias al tutor', () => {
      whenMonto();

      expect(textoRenderizado()).toContain('¿Deseas limitar este tipo de productos?');
    });

    it('dado un service que devuelve lista vacia, no deberia renderizar cards de alerta', () => {
      servicioHabitos.getAlertas.and.returnValue([]);
      const nuevaFixture = TestBed.createComponent(HabitosPage);
      nuevaFixture.detectChanges();

      const cards = (nuevaFixture.nativeElement as HTMLElement).querySelectorAll(
        'app-habito-alert-card',
      );
      expect(cards.length).toBe(0);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
