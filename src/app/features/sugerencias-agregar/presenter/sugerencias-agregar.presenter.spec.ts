import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SugerenciasAgregarPresenter } from './sugerencias-agregar.presenter';
import { SugerenciasAgregarService } from '../services/sugerencias-agregar.service';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';
import { SugerenciasAgregarMother } from '../sugerencias-agregar.mother';


describe('SugerenciasAgregarPresenter', () => {
  let presenter: SugerenciasAgregarPresenter;
  let servicio: jasmine.SpyObj<SugerenciasAgregarService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj('SugerenciasAgregarService', ['getSugerenciasAgregarProducto']);
    TestBed.configureTestingModule({
      providers: [
        SugerenciasAgregarPresenter,
        { provide: SugerenciasAgregarService, useValue: servicio }
      ]
    });
    presenter = TestBed.inject(SugerenciasAgregarPresenter);
  });

  describe('Inicialización', () => {
    it('debería solicitar las sugerencias al servicio y actualizar el estado cuando sea exitoso', () => {
      const sugerenciasEsperadas = SugerenciasAgregarMother.crearListaSugerencias();
      let sugerenciasEmitidas: SugerenciaAgregarProducto[] | undefined;
      let isLoadingEmitido: boolean | undefined;
      let errorEmitido: string | null | undefined;

      givenSugerenciasExitosas(sugerenciasEsperadas);
      whenInicializoPresenter(
        val => sugerenciasEmitidas = val,
        val => isLoadingEmitido = val,
        val => errorEmitido = val
      );
      thenElEstadoSeActualizoCorrectamente(sugerenciasEsperadas, sugerenciasEmitidas, isLoadingEmitido, errorEmitido);
    });

    it('debería actualizar el estado de error cuando el servicio falle', () => {
      let errorEmitido: string | null | undefined;
      let isLoadingEmitido: boolean | undefined;

      givenServicioFalla();
      whenInicializoPresenterConError(
        val => errorEmitido = val,
        val => isLoadingEmitido = val
      );
      thenElEstadoDeErrorEsCorrecto(errorEmitido, isLoadingEmitido);
    });
  });

  describe('KPIs Computados', () => {
    beforeEach(() => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(SugerenciasAgregarMother.crearListaSugerencias()));
      presenter.initialize();
    });

    it('debería calcular el total de productos analizados', () => {
      thenCalculaPropiedad(presenter.totalProductos, 3);
    });

    it('debería sumar las ventas totales de todas las sugerencias', () => {
      thenCalculaPropiedad(presenter.totalVentas, 35);
    });

    it('debería calcular los ingresos totales esperados', () => {
      thenCalculaPropiedad(presenter.totalIngresos, 4000);
    });

    it('debería sumar la cantidad de clientes únicos afectados', () => {
      thenCalculaPropiedad(presenter.totalClientes, 17);
    });

    it('debería formatear correctamente la etiqueta del total de ingresos', () => {
      thenCalculaPropiedadString(presenter.totalIngresosLabel, '$4.000');
    });
  });

  describe('Datos de Gráficos y Tarjetas', () => {
    beforeEach(() => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(SugerenciasAgregarMother.crearListaSugerencias()));
      presenter.initialize();
    });

    it('debería generar los datos del gráfico ordenados por ingreso mayor y calcular el porcentaje relativo', () => {
      thenDatosDeGraficoOrdenadosYConPorcentaje();
    });

    it('debería generar las tarjetas de productos mapeando correctamente todos los campos', () => {
      thenTarjetasDeProductosMapeadas();
    });
  });

  describe('Helpers de Formateo', () => {
    it('debería formatear valores numéricos a moneda local sin decimales', () => {
      thenFormateaMoneda(1500, '$1.500');
    });

    it('debería formatear cero correctamente', () => {
      thenFormateaMoneda(0, '$0');
    });
  });

  function givenSugerenciasExitosas(sugerencias: SugerenciaAgregarProducto[]): void {
    servicio.getSugerenciasAgregarProducto.and.returnValue(of(sugerencias));
  }

  function givenServicioFalla(): void {
    servicio.getSugerenciasAgregarProducto.and.returnValue(throwError(() => new Error('Error de red')));
  }

  function whenInicializoPresenter(
    cbSugerencias: (val: any) => void,
    cbIsLoading: (val: any) => void,
    cbError: (val: any) => void
  ): void {
    presenter.sugerencias$.subscribe(cbSugerencias);
    presenter.isLoading$.subscribe(cbIsLoading);
    presenter.error$.subscribe(cbError);
    presenter.initialize();
  }

  function whenInicializoPresenterConError(
    cbError: (val: any) => void,
    cbIsLoading: (val: any) => void
  ): void {
    presenter.error$.subscribe(cbError);
    presenter.isLoading$.subscribe(cbIsLoading);
    presenter.initialize();
  }

  function thenElEstadoSeActualizoCorrectamente(
    esperadas: SugerenciaAgregarProducto[],
    emitidas: SugerenciaAgregarProducto[] | undefined,
    isLoading: boolean | undefined,
    error: string | null | undefined
  ): void {
    expect(servicio.getSugerenciasAgregarProducto).toHaveBeenCalled();
    expect(emitidas).toEqual(esperadas);
    expect(isLoading).toBeFalse();
    expect(error).toBeNull();
  }

  function thenElEstadoDeErrorEsCorrecto(error: string | null | undefined, isLoading: boolean | undefined): void {
    expect(error).toBe('No se pudieron cargar las oportunidades de stock.');
    expect(isLoading).toBeFalse();
  }

  function thenCalculaPropiedad(propiedad: number, esperado: number): void {
    expect(propiedad).toBe(esperado);
  }

  function thenCalculaPropiedadString(propiedad: string, esperado: string): void {
    expect(propiedad).toBe(esperado);
  }

  function thenDatosDeGraficoOrdenadosYConPorcentaje(): void {
    const datos = presenter.chartData;
    expect(datos.length).toBe(3);
    expect(datos[0].nombre).toBe('Prod C');
    expect(datos[0].ingresos).toBe(2000);
    expect(datos[0].ingresoPercent).toBe(100); 
    expect(datos[1].ingresoPercent).toBe(50);
  }

  function thenTarjetasDeProductosMapeadas(): void {
    const tarjetas = presenter.productCards;
    expect(tarjetas.length).toBe(3);
    expect(tarjetas[0].nombre).toBe('Prod C');
    expect(tarjetas[0].ingresoPercent).toBe(100);
    expect(tarjetas[0].mensaje).toBe('Msg 3');
  }

  function thenFormateaMoneda(valor: number, esperado: string): void {
    expect(presenter.formatCurrency(valor)).toBe(esperado);
  }
});
