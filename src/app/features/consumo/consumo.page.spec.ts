import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ConsumoPage } from './consumo.page';
import { ConsumoAprendizajeMother } from './consumo.mother';
import { ConsumoService } from './services/consumo.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('ConsumoPage', () => {
  let component: ConsumoPage;
  let fixture: ComponentFixture<ConsumoPage>;
  let servicioConsumo: jasmine.SpyObj<ConsumoService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioConsumo = jasmine.createSpyObj('ConsumoService', ['getConsumos']);
    servicioConsumo.getConsumos.and.returnValue([
      ConsumoAprendizajeMother.crear(),
      ConsumoAprendizajeMother.crearParaTostado(),
    ]);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [ConsumoPage],
      providers: [
        { provide: ConsumoService, useValue: servicioConsumo },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    })
      .overrideComponent(ConsumoPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConsumoPage);
    component = fixture.componentInstance;
  });

  describe('Estado inicial', () => {
    it('dado la page recien creada, deberia exponer el nombre del usuario y los consumos del service', () => {
      expect(component.nombreUsuario).toBe('Tutor Test');
      expect(component.consumos.length).toBe(2);
    });
  });

  describe('render', () => {
    it('dado la page montada, deberia mostrar el titulo de aprendizaje de consumo', () => {
      whenMonto();

      expect(textoRenderizado()).toContain('Aprendizaje de consumo');
    });

    it('dado consumos del service, deberia renderizar el nombre de cada alumno', () => {
      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('Julián García');
      expect(texto).toContain('Sofía García');
    });

    it('dado consumos del service, deberia mostrar los productos frecuentes de cada uno', () => {
      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('Jugo');
      expect(texto).toContain('Tostado');
    });

    it('dado consumos del service, deberia mostrar las recomendaciones', () => {
      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('Ofrecer jugos sin azúcar');
      expect(texto).toContain('Agregar combos saludables');
    });

    it('dado un service que devuelve lista vacia, no deberia renderizar cards de consumo', () => {
      servicioConsumo.getConsumos.and.returnValue([]);
      const nuevaFixture = TestBed.createComponent(ConsumoPage);
      nuevaFixture.detectChanges();

      const cards = (nuevaFixture.nativeElement as HTMLElement).querySelectorAll(
        'app-consumo-card',
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
