import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenSemanalPage } from './resumen-semanal.page';
import { ResumenSemanalService } from './services/resumen-semanal.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { HijoResumen, ResumenSemanal } from './models/resumen-semanal.model';

describe('ResumenSemanalPage', () => {
  let mockResumenService: jasmine.SpyObj<ResumenSemanalService>;
  let mockUsuarioService: unknown;

  beforeEach(async () => {
    mockResumenService = jasmine.createSpyObj('ResumenSemanalService', ['getResumen']);

    mockUsuarioService = {
      getUsuarioActual: jasmine.createSpy('getUsuarioActual').and.returnValue({ nombre: 'Test User' }),
      esVistaKiosquero: signal(false),
      esVistaAlumno: signal(false),
      nombreNavbar: signal('Test User'),
      homeUrl: signal('/tutor')
    };

    await TestBed.configureTestingModule({
      imports: [ResumenSemanalPage],
      providers: [
        { provide: ResumenSemanalService, useValue: mockResumenService },
        { provide: UsuarioService, useValue: mockUsuarioService },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  describe('cuando el perfil existe en localStorage', () => {
    let component: ResumenSemanalPage;
    let fixture: ComponentFixture<ResumenSemanalPage>;

    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-123' }));

      mockResumenService.getResumen.and.returnValue(of({
        id: '1',
        fechaDesde: '2023-01-01',
        fechaHasta: '2023-01-07',
        resumen: JSON.stringify({
          hijos: {
            'Juan': {
              totalGastado: 1000,
              LimiteGasto: 2000,
              productoMasConsumido: { nombre: 'Alfajor', cantidad: 5 },
              porCategoria: { 'Snacks': 60, 'Bebidas': 40 }
            },
            'Maria': {
              totalGastado: 500,
              LimiteGasto: 1000,
              porCategoria: undefined
            }
          },
          mensaje: JSON.stringify([{ nombre: 'Ahorro', mensaje: 'Buen ahorro' }])
        })
      } as unknown as ResumenSemanal));

      fixture = TestBed.createComponent(ResumenSemanalPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('debería crear el componente e inicializar el resumen', () => {
      expect(component).toBeTruthy();
      expect(component.nombreUsuario).toBe('Test User');
      expect(mockResumenService.getResumen).toHaveBeenCalled();
      expect(component.hijos.length).toBe(2);
      expect(component.resumenProcesado?.mensajes[0].nombre).toBe('Ahorro');
    });

    it('debería calcular totalFamiliar correctamente', () => {
      expect(component.totalFamiliar).toBe(1500);
    });

    it('debería devolver categorías correctamente desde getCategorias()', () => {
      const juan = component.hijos[0];
      expect(component.getCategorias(juan.datos)).toEqual([['Snacks', 60], ['Bebidas', 40]]);

      const maria = component.hijos[1];
      expect(component.getCategorias(maria.datos)).toEqual([]);
    });

    it('debería calcular hijosResumen con ordenamiento y porcentajes', () => {
      const resumen = component.hijosResumen;
      expect(resumen.length).toBe(2);
      expect(resumen[0].nombre).toBe('Juan');
      expect(resumen[0].gasto).toBe(1000);
      expect(resumen[0].porcentaje).toBeCloseTo(66.66, 1);
      
      expect(resumen[1].nombre).toBe('Maria');
      expect(resumen[1].gasto).toBe(500);
      expect(resumen[1].porcentaje).toBeCloseTo(33.33, 1);
    });

    it('debería manejar el caso donde totalFamiliar sea 0 para los porcentajes', () => {
      component.hijos = [{ nombre: 'Cero', datos: { totalGastado: 0 } as unknown as HijoResumen }];
      expect(component.hijosResumen[0].porcentaje).toBe(0);
    });

    it('debería manejar el caso de fallbacks en totalGastado nulo', () => {
      component.hijos = [{ nombre: 'Nulo', datos: { totalGastado: undefined } as unknown as HijoResumen }];
      expect(component.totalFamiliar).toBe(0);
      expect(component.hijosResumen[0].gasto).toBe(0);
    });
  });

  describe('cuando el perfil no está en localStorage o el JSON no tiene campos', () => {
    it('no debería llamar al servicio si localStorage devuelve null', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const fixture = TestBed.createComponent(ResumenSemanalPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockResumenService.getResumen).not.toHaveBeenCalled();
      expect(component.resumen).toBeUndefined();
    });

    it('debería manejar mensajes nulos de forma segura (fallback a [])', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-id-456' }));

      mockResumenService.getResumen.and.returnValue(of({
        id: '2',
        resumen: JSON.stringify({
          hijos: {},
          mensaje: null
        })
      } as unknown as ResumenSemanal));

      const fixture = TestBed.createComponent(ResumenSemanalPage);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.resumenProcesado?.mensajes).toEqual([]);
    });
  });
});
