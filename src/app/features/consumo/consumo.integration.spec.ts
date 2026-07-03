import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ConsumoPage } from './consumo.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('Consumo Integration', () => {
  let fixture: ComponentFixture<ConsumoPage>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Integration',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [ConsumoPage],
      providers: [{ provide: UsuarioService, useValue: servicioUsuario }],
    })
      .overrideComponent(ConsumoPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConsumoPage);
  });

  it('dado la page con el service real, cuando se monta, deberia renderizar una card por alumno mockeado en el service', () => {
    whenMonto();

    const cards = queryAll('app-consumo-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBe(2);
  });

  it('dado el flujo real page → card, deberia mostrar el alumno, producto, frecuencia y recomendacion de Julian', () => {
    whenMonto();

    const primeraCard = (queryAll('app-consumo-card')[0] as HTMLElement).textContent ?? '';
    expect(primeraCard).toContain('Julián García');
    expect(primeraCard).toContain('Jugo');
    expect(primeraCard).toContain('4 veces por semana');
    expect(primeraCard).toContain('Ofrecer jugos sin azúcar');
  });

  it('dado el flujo real page → card, deberia mostrar el bloque de Sofia con Tostado', () => {
    whenMonto();

    const segundaCard = (queryAll('app-consumo-card')[1] as HTMLElement).textContent ?? '';
    expect(segundaCard).toContain('Sofía García');
    expect(segundaCard).toContain('Tostado');
    expect(segundaCard).toContain('3 veces por semana');
    expect(segundaCard).toContain('Agregar combos saludables');
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function queryAll(selector: string): Element[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector));
  }
});
