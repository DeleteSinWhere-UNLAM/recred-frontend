import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenSemanalPage } from './resumen-semanal.page';
import { ResumenSemanalService } from './services/resumen-semanal.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { of } from 'rxjs';
import { Component, Input, signal } from '@angular/core';
import { HijoResumen, MensajeHijo, ResumenSemanal } from './models/resumen-semanal.model';
import { Usuario } from '../../data-access/models/usuario.model';

class ResumenSemanalMother {
  static crearUsuario(override: Partial<Usuario> = {}): Usuario {
    return {
      id: 'user-id-123',
      nombre: 'Test User',
      ...override
    } as unknown as Usuario;
  }

  static crearResumen(override: Partial<ResumenSemanal> = {}): ResumenSemanal {
    return {
      id: '1',
      fechaDesde: '2023-01-01',
      fechaHasta: '2023-01-07',
      resumen: JSON.stringify({
        hijos: {
          'Juan Perez': this.crearHijoResumen(),
          'Maria Lopez': this.crearHijoResumen({ totalGastado: 500, LimiteGasto: 1000, porCategoria: undefined })
        },
        mensaje: JSON.stringify([this.crearMensajeHijo()])
      }),
      ...override
    } as unknown as ResumenSemanal;
  }

  static crearHijoResumen(override: Partial<HijoResumen> = {}): HijoResumen {
    return {
      totalGastado: 1000,
      LimiteGasto: 2000,
      productoMasConsumido: { nombre: 'Alfajor', cantidad: 5, porcentaje: 10 },
      porCategoria: { Snacks: 60, Bebidas: 40 },
      ...override
    } as unknown as HijoResumen;
  }

  static crearMensajeHijo(override: Partial<MensajeHijo> = {}): MensajeHijo {
    return {
      nombre: 'Juan Perez',
      mensaje: 'Buen ahorro',
      ...override
    } as unknown as MensajeHijo;
  }
}

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class NavbarStub {
  @Input() userName = '';
}

describe('ResumenSemanalPage', () => {
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
        { provide: ResumenSemanalService, useValue: servicioResumen },
        { provide: UsuarioService, useValue: servicioUsuario }
      ]
    })
      .overrideComponent(ResumenSemanalPage, {
        add: {
          imports: [NavbarStub]
        }
      })
      .compileComponents();
  });

  describe('Cuando el perfil existe en localStorage', () => {
    let component: ResumenSemanalPage;
    let fixture: ComponentFixture<ResumenSemanalPage>;

    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-123' }));
      servicioResumen.getResumen.and.returnValue(of(ResumenSemanalMother.crearResumen()));
      
      fixture = TestBed.createComponent(ResumenSemanalPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('debería inicializar el resumen parseando correctamente el JSON desde el servicio', () => {
      
      const cantidadHijos = component.hijos.length;
      const primerMensaje = component.resumenProcesado?.mensajes[0].nombre;

      expect(servicioResumen.getResumen).toHaveBeenCalled();
      expect(cantidadHijos).toBe(2);
      expect(primerMensaje).toBe('Juan');
    });

    it('debería calcular el total familiar sumando todos los consumos', () => {
      
      const total = component.totalFamiliar;

      expect(total).toBe(1500);
    });

    it('debería devolver el arreglo de categorías vacío si el hijo no tiene categorías', () => {
      
      const hijoSinCategorias = component.hijos[1];
      const categorias = component.getCategorias(hijoSinCategorias.datos);

      expect(categorias).toEqual([]);
    });

    it('debería calcular el resumen de hijos ordenado por gasto mayor y calcular su porcentaje del total', () => {
      
      const resumenCalculado = component.hijosResumen;

      expect(resumenCalculado.length).toBe(2);
      expect(resumenCalculado[0].nombre).toBe('Juan');
      expect(resumenCalculado[0].gasto).toBe(1000);
      expect(resumenCalculado[0].porcentaje).toBeCloseTo(66.66, 1);
      expect(resumenCalculado[1].nombre).toBe('Maria');
      expect(resumenCalculado[1].gasto).toBe(500);
      expect(resumenCalculado[1].porcentaje).toBeCloseTo(33.33, 1);
    });

    it('debería devolver porcentaje cero cuando el gasto total familiar es cero', () => {
      
      component.hijos = [{ nombre: 'Cero', datos: ResumenSemanalMother.crearHijoResumen({ totalGastado: 0 }) }];
      const resumenCalculado = component.hijosResumen;

      expect(resumenCalculado[0].porcentaje).toBe(0);
    });

    it('debería fallback a cero cuando el hijo tiene gasto nulo', () => {
      
      component.hijos = [{ nombre: 'Nulo', datos: ResumenSemanalMother.crearHijoResumen({ totalGastado: undefined as unknown as number }) }];
      const total = component.totalFamiliar;
      const gastoPrimerHijo = component.hijosResumen[0].gasto;

      expect(total).toBe(0);
      expect(gastoPrimerHijo).toBe(0);
    });
  });

  describe('Cuando la API o el estado interno varían', () => {
    it('no debería solicitar el resumen al servicio si el id de usuario no existe en la sesión', () => {
      
      spyOn(localStorage, 'getItem').and.returnValue(null);
      const fixture = TestBed.createComponent(ResumenSemanalPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(servicioResumen.getResumen).not.toHaveBeenCalled();
      expect(component.resumen).toBeUndefined();
    });

    it('debería parsear mensajes como un arreglo vacío si la API devuelve el campo mensaje nulo', () => {
      
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-456' }));
      const resumenMalo = ResumenSemanalMother.crearResumen();
      resumenMalo.resumen = JSON.stringify({ hijos: {}, mensaje: null });
      servicioResumen.getResumen.and.returnValue(of(resumenMalo));
      const fixture = TestBed.createComponent(ResumenSemanalPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      const mensajesCalculados = component.resumenProcesado?.mensajes;

      expect(mensajesCalculados).toEqual([]);
    });
  });
});
