import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenSemanalPage } from './resumen-semanal.page';
import { ResumenSemanalService } from './services/resumen-semanal.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { of } from 'rxjs';
import { Component, Input, signal } from '@angular/core';
import { ResumenSemanalMother } from './resumen-semanal.mother';

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
  let component: ResumenSemanalPage;
  let fixture: ComponentFixture<ResumenSemanalPage>;

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
    it('debería inicializar el resumen parseando correctamente el JSON desde el servicio', () => {
      givenElPerfilExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenElComponenteEstaInicializadoYParseoDatos();
    });

    it('debería calcular el total familiar sumando todos los consumos', () => {
      givenElPerfilExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenCalculoElTotalFamiliarCorrectamente();
    });

    it('debería devolver el arreglo de categorías vacío si el hijo no tiene categorías', () => {
      givenElPerfilExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenHijoSinCategoriasDevuelveArregloVacio();
    });

    it('debería calcular el resumen de hijos ordenado por gasto mayor y calcular su porcentaje del total', () => {
      givenElPerfilExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenElResumenDeHijosEstaOrdenadoYConPorcentajes();
    });

    it('debería devolver porcentaje cero cuando el gasto total familiar es cero', () => {
      givenElPerfilExiste();
      whenSeCreaElComponenteYDetectaCambios();
      whenElGastoTotalEsCero();
      thenPorcentajeEsCero();
    });

    it('debería fallback a cero cuando el hijo tiene gasto nulo', () => {
      givenElPerfilExiste();
      whenSeCreaElComponenteYDetectaCambios();
      whenElHijoTieneGastoNulo();
      thenTotalYGastoSonCero();
    });
  });

  describe('Cuando la API o el estado interno varían', () => {
    it('no debería solicitar el resumen al servicio si el id de usuario no existe en la sesión', () => {
      givenElPerfilNoExiste();
      whenSeCreaElComponenteYDetectaCambios();
      thenNoSeSolicitaElResumen();
    });

    it('no debería solicitar el resumen al servicio si el perfil no contiene un id', () => {
      givenElPerfilEstaMalFormado();
      whenSeCreaElComponenteYDetectaCambios();
      thenNoSeSolicitaElResumen();
    });

    it('debería parsear mensajes como un arreglo vacío si la API devuelve el campo mensaje nulo', () => {
      givenElResumenVieneConMensajeNulo();
      whenSeCreaElComponenteYDetectaCambios();
      thenMensajesCalculadosEsVacio();
    });

    it('debería parsear nombre vacio si el mensaje no tiene nombre', () => {
      givenElResumenVieneConMensajeSinNombre();
      whenSeCreaElComponenteYDetectaCambios();
      thenNombreDelMensajeEsVacio();
    });
  });

  // Funciones GWT

  function givenElPerfilExiste(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-123' }));
    servicioResumen.getResumen.and.returnValue(of(ResumenSemanalMother.crearResumen()));
  }

  function givenElPerfilNoExiste(): void {
    spyOn(localStorage, 'getItem').and.returnValue(null);
  }

  function givenElPerfilEstaMalFormado(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ algo: 'sin-id' }));
  }

  function givenElResumenVieneConMensajeNulo(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-456' }));
    const resumenMalo = ResumenSemanalMother.crearResumen();
    resumenMalo.resumen = JSON.stringify({ hijos: {}, mensaje: null });
    servicioResumen.getResumen.and.returnValue(of(resumenMalo));
  }

  function givenElResumenVieneConMensajeSinNombre(): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-456' }));
    const resumenMalo = ResumenSemanalMother.crearResumen();
    resumenMalo.resumen = JSON.stringify({ hijos: {}, mensaje: '[{"tipo": "Alerta"}]' });
    servicioResumen.getResumen.and.returnValue(of(resumenMalo));
  }

  function whenSeCreaElComponenteYDetectaCambios(): void {
    fixture = TestBed.createComponent(ResumenSemanalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function whenElGastoTotalEsCero(): void {
    component.hijos = [{ nombre: 'Cero', datos: ResumenSemanalMother.crearHijoResumen({ totalGastado: 0 }) }];
  }

  function whenElHijoTieneGastoNulo(): void {
    component.hijos = [{ nombre: 'Nulo', datos: ResumenSemanalMother.crearHijoResumen({ totalGastado: undefined as unknown as number }) }];
  }

  function thenElComponenteEstaInicializadoYParseoDatos(): void {
    expect(servicioResumen.getResumen).toHaveBeenCalled();
    expect(component.hijos.length).toBe(2);
    expect(component.resumenProcesado?.mensajes[0].nombre).toBe('Juan');
  }

  function thenCalculoElTotalFamiliarCorrectamente(): void {
    expect(component.totalFamiliar).toBe(1500);
  }

  function thenHijoSinCategoriasDevuelveArregloVacio(): void {
    const hijoSinCategorias = component.hijos[1];
    expect(component.getCategorias(hijoSinCategorias.datos)).toEqual([]);
  }

  function thenElResumenDeHijosEstaOrdenadoYConPorcentajes(): void {
    const resumenCalculado = component.hijosResumen;
    expect(resumenCalculado.length).toBe(2);
    expect(resumenCalculado[0].nombre).toBe('Juan');
    expect(resumenCalculado[0].gasto).toBe(1000);
    expect(resumenCalculado[0].porcentaje).toBeCloseTo(66.66, 1);
    expect(resumenCalculado[1].nombre).toBe('Maria');
    expect(resumenCalculado[1].gasto).toBe(500);
    expect(resumenCalculado[1].porcentaje).toBeCloseTo(33.33, 1);
  }

  function thenPorcentajeEsCero(): void {
    expect(component.hijosResumen[0].porcentaje).toBe(0);
  }

  function thenTotalYGastoSonCero(): void {
    expect(component.totalFamiliar).toBe(0);
    expect(component.hijosResumen[0].gasto).toBe(0);
  }

  function thenNoSeSolicitaElResumen(): void {
    expect(servicioResumen.getResumen).not.toHaveBeenCalled();
    expect(component.resumen).toBeUndefined();
  }

  function thenMensajesCalculadosEsVacio(): void {
    expect(component.resumenProcesado?.mensajes).toEqual([]);
  }

  function thenNombreDelMensajeEsVacio(): void {
    expect(component.resumenProcesado?.mensajes[0].nombre).toBe('');
  }
});
