import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HabitosPage } from './habitos.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('Habitos Integration', () => {
  let fixture: ComponentFixture<HabitosPage>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Integration',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [HabitosPage],
      providers: [{ provide: UsuarioService, useValue: servicioUsuario }],
    })
      .overrideComponent(HabitosPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HabitosPage);
  });

  it('dado el service real, cuando se monta la page, deberia renderizar una card por alumno mockeado', () => {
    whenMonto();

    const cards = queryAll('app-habito-alert-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBe(2);
  });

  it('dado el flujo real page → card, deberia mostrar alumno, categoria, porcentaje, mensaje y sugerencia de Julian', () => {
    whenMonto();

    const card = (queryAll('app-habito-alert-card')[0] as HTMLElement).textContent ?? '';
    expect(card).toContain('Julián García');
    expect(card).toContain('Golosinas');
    expect(card).toContain('40%');
    expect(card).toContain('Tu hijo gasta 40% en golosinas');
    expect(card).toContain('¿Deseas limitar este tipo de productos?');
  });

  it('dado el flujo real, deberia renderizar acciones (Limitar / Ignorar) en cada card', () => {
    whenMonto();

    const card = queryAll('app-habito-alert-card')[0] as HTMLElement;
    expect(card.querySelector('button.limitar')?.textContent?.trim()).toBe('Limitar productos');
    expect(card.querySelector('button.ignorar')?.textContent?.trim()).toBe('Ignorar');
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function queryAll(selector: string): Element[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector));
  }
});
