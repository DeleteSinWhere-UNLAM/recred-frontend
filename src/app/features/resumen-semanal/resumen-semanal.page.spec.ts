import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenSemanalPage } from './resumen-semanal.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ResumenSemanalService } from './services/resumen-semanal.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { of } from 'rxjs';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: '<div>Mock Navbar</div>',
  standalone: true
})
class MockNavbarComponent {
  @Input() userName = '';
}

describe('ResumenSemanalPage', () => {
  let componente: ResumenSemanalPage;
  let fixture: ComponentFixture<ResumenSemanalPage>;

  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;
  let mockResumenService: jasmine.SpyObj<ResumenSemanalService>;

  beforeEach(async () => {
    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    mockResumenService = jasmine.createSpyObj('ResumenSemanalService', ['getResumen']);

    mockUsuarioService.getUsuarioActual.and.returnValue({ nombre: 'Tutor Analitico' } as any);

    // Mockeamos el localstorage
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-777' }));

    await TestBed.configureTestingModule({
      imports: [ResumenSemanalPage],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ResumenSemanalService, useValue: mockResumenService }
      ]
    })
    .overrideComponent(ResumenSemanalPage, {
      remove: { imports: [NavbarComponent] },
      add: { imports: [MockNavbarComponent] }
    })
    .compileComponents();
  });

  describe('Construccion y parseo del backend', () => {
    it('dado que el servicio devuelve JSON anidado, el constructor debe parsearlo correctamente en hijos y mensajes', () => {
      const mockResumenBackend = {
        resumen: JSON.stringify({
          mensaje: JSON.stringify([{ nombre: 'Juan', mensaje: 'Gastos altos' }]),
          hijos: {
            "Juancito": { totalGastado: 1000, porCategoria: { "Comida": 1000 } },
            "Maria": { totalGastado: 500, porCategoria: {} }
          }
        })
      };

      mockResumenService.getResumen.and.returnValue(of(mockResumenBackend as any));

      // Instanciamos el componente que ejecuta el constructor
      fixture = TestBed.createComponent(ResumenSemanalPage);
      componente = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockResumenService.getResumen).toHaveBeenCalledWith('user-777');
      expect(componente.resumenProcesado?.mensajes.length).toBe(1);
      expect(componente.resumenProcesado?.mensajes[0].mensaje).toBe('Gastos altos');
      
      expect(componente.hijos.length).toBe(2);
      expect(componente.hijos[0].nombre).toBe('Juancito');
      expect(componente.hijos[1].nombre).toBe('Maria');
    });

    it('dado que el localstorage esta vacio, no debe hacer llamada al servicio', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      
      fixture = TestBed.createComponent(ResumenSemanalPage);
      componente = fixture.componentInstance;

      expect(mockResumenService.getResumen).not.toHaveBeenCalled();
    });
  });

  describe('Metodos y getters calculados', () => {
    beforeEach(() => {
      const mockResumenBackend = {
        resumen: JSON.stringify({
          mensaje: "[]",
          hijos: {
            "A": { totalGastado: 2000, porCategoria: { "Dulces": 1000, "Bebidas": 1000 } },
            "B": { totalGastado: 1000, porCategoria: {} } // Total 3000
          }
        })
      };
      mockResumenService.getResumen.and.returnValue(of(mockResumenBackend as any));
      
      fixture = TestBed.createComponent(ResumenSemanalPage);
      componente = fixture.componentInstance;
    });

    it('dado getCategorias, debe retornar las entradas de porCategoria en formato arreglo de tuplas', () => {
      const categoriasA = componente.getCategorias(componente.hijos[0].datos);
      expect(categoriasA.length).toBe(2);
      expect(categoriasA[0][0]).toBe('Dulces');
      expect(categoriasA[0][1]).toBe(1000);
    });

    it('dado totalFamiliar, debe sumar el totalGastado de todos los hijos', () => {
      expect(componente.totalFamiliar).toBe(3000); // 2000 + 1000
    });

    it('dado hijosResumen, debe calcular porcentajes y asignar colores ordenando por mayor gasto', () => {
      const resumenes = componente.hijosResumen;
      
      // Debe estar ordenado A (2000) primero, B (1000) despues
      expect(resumenes[0].nombre).toBe('A');
      expect(resumenes[0].porcentaje).toBeCloseTo((2000 / 3000) * 100);
      expect(resumenes[0].color).toBe(componente.colores[0]); // '#4f46e5'

      expect(resumenes[1].nombre).toBe('B');
      expect(resumenes[1].porcentaje).toBeCloseTo((1000 / 3000) * 100);
      expect(resumenes[1].color).toBe(componente.colores[1]);
    });

    it('dado hijosResumen cuando el gasto total es cero, el porcentaje debe ser 0 para evitar division por cero', () => {
      componente.hijos = [
        { nombre: 'A', datos: { totalGastado: 0 } as any }
      ];
      expect(componente.totalFamiliar).toBe(0);
      
      const resumenes = componente.hijosResumen;
      expect(resumenes[0].porcentaje).toBe(0);
    });
  });
});
