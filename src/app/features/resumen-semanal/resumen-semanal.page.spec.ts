import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import {
  HijoResumenMother,
  ResumenSemanalMother,
  USUARIO_ID_TEST,
  UsuarioMother,
} from './resumen-semanal.mother';
import { ResumenSemanalPage } from './resumen-semanal.page';
import { ResumenSemanalService } from './services/resumen-semanal.service';

describe('ResumenSemanalPage', () => {
  let servicioResumen: jasmine.SpyObj<ResumenSemanalService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioResumen = jasmine.createSpyObj<ResumenSemanalService>('ResumenSemanalService', [
      'getResumen',
    ]);
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue(UsuarioMother.crear());

    await TestBed.configureTestingModule({
      imports: [ResumenSemanalPage],
      providers: [
        { provide: ResumenSemanalService, useValue: servicioResumen },
        { provide: UsuarioService, useValue: servicioUsuario },
      ],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  describe('cuando el perfil existe en localStorage', () => {
    let component: ResumenSemanalPage;
    let fixture: ComponentFixture<ResumenSemanalPage>;

    beforeEach(() => {
      givenPerfilEnLocalStorage(USUARIO_ID_TEST);
      servicioResumen.getResumen.and.returnValue(of(ResumenSemanalMother.crear()));

      fixture = TestBed.createComponent(ResumenSemanalPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('dado un resumen del back, cuando se monta la page, deberia parsear los hijos y los mensajes', () => {
      expect(servicioResumen.getResumen).toHaveBeenCalled();
      expect(component.hijos.length).toBe(2);
      expect(component.resumenProcesado?.mensajes[0].nombre).toBe('Juan');
    });

    it('dados dos hijos, cuando se calcula el total familiar, deberia sumar los totalGastado', () => {
      expect(component.totalFamiliar).toBe(1500);
    });

    it('dado un hijo sin categorias, cuando pido las categorias, deberia devolver un array vacio', () => {
      const hijoSinCategorias = component.hijos[1];

      expect(component.getCategorias(hijoSinCategorias.datos)).toEqual([]);
    });

    it('dados dos hijos, cuando calculo hijosResumen, deberia ordenarlos por gasto descendente con porcentaje', () => {
      const resumen = component.hijosResumen;

      expect(resumen.length).toBe(2);
      expect(resumen[0].nombre).toBe('Juan');
      expect(resumen[0].gasto).toBe(1000);
      expect(resumen[0].porcentaje).toBeCloseTo(66.66, 1);
      expect(resumen[1].nombre).toBe('Maria');
      expect(resumen[1].gasto).toBe(500);
      expect(resumen[1].porcentaje).toBeCloseTo(33.33, 1);
    });

    it('dado gasto total familiar cero, cuando calculo hijosResumen, deberia devolver porcentaje 0', () => {
      component.hijos = [
        { nombre: 'Cero', datos: HijoResumenMother.crear({ totalGastado: 0 }) },
      ];

      expect(component.hijosResumen[0].porcentaje).toBe(0);
    });

    it('dado un hijo con totalGastado nulo, cuando calculo total y gasto, deberia caer en cero', () => {
      component.hijos = [
        {
          nombre: 'Nulo',
          datos: HijoResumenMother.crear({ totalGastado: undefined as unknown as number }),
        },
      ];

      expect(component.totalFamiliar).toBe(0);
      expect(component.hijosResumen[0].gasto).toBe(0);
    });
  });

  describe('cuando no hay perfil o la API varia', () => {
    it('dado que no hay perfil en localStorage, cuando se monta la page, no deberia pedir el resumen', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const fixture = TestBed.createComponent(ResumenSemanalPage);
      fixture.detectChanges();

      expect(servicioResumen.getResumen).not.toHaveBeenCalled();
      expect(fixture.componentInstance.resumen).toBeUndefined();
    });

    it('dado un resumen con mensaje nulo, cuando se monta la page, deberia parsear los mensajes como lista vacia', () => {
      givenPerfilEnLocalStorage('user-id-456');
      servicioResumen.getResumen.and.returnValue(of(ResumenSemanalMother.crearConMensajeNulo()));

      const fixture = TestBed.createComponent(ResumenSemanalPage);
      fixture.detectChanges();

      expect(fixture.componentInstance.resumenProcesado?.mensajes).toEqual([]);
    });
  });

  function givenPerfilEnLocalStorage(id: string): void {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id }));
  }
});
