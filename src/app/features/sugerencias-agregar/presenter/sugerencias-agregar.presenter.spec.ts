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
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(sugerenciasEsperadas));
      
      let sugerenciasEmitidas: SugerenciaAgregarProducto[] | undefined;
      let isLoadingEmitido: boolean | undefined;
      let errorEmitido: string | null | undefined;
      
      presenter.sugerencias$.subscribe(val => sugerenciasEmitidas = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);
      presenter.error$.subscribe(val => errorEmitido = val);

      presenter.initialize();

      expect(servicio.getSugerenciasAgregarProducto).toHaveBeenCalled();
      expect(sugerenciasEmitidas).toEqual(sugerenciasEsperadas);
      expect(isLoadingEmitido).toBeFalse();
      expect(errorEmitido).toBeNull();
    });

    it('debería actualizar el estado de error cuando el servicio falle', () => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(throwError(() => new Error('Error de red')));
      
      let errorEmitido: string | null | undefined;
      let isLoadingEmitido: boolean | undefined;
      
      presenter.error$.subscribe(val => errorEmitido = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);

      presenter.initialize();

      expect(errorEmitido).toBe('No se pudieron cargar las oportunidades de stock.');
      expect(isLoadingEmitido).toBeFalse();
    });
  });

  describe('KPIs Computados', () => {
    beforeEach(() => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(SugerenciasAgregarMother.crearListaSugerencias()));
      presenter.initialize();
    });

    it('debería calcular el total de productos analizados', () => {
      
      const total = presenter.totalProductos;

      expect(total).toBe(3);
    });

    it('debería sumar las ventas totales de todas las sugerencias', () => {
      
      const total = presenter.totalVentas;

      expect(total).toBe(35);
    });

    it('debería calcular los ingresos totales esperados', () => {
      
      const total = presenter.totalIngresos;

      expect(total).toBe(4000);
    });

    it('debería sumar la cantidad de clientes únicos afectados', () => {
      
      const total = presenter.totalClientes;

      expect(total).toBe(17);
    });

    it('debería formatear correctamente la etiqueta del total de ingresos', () => {
      
      const etiqueta = presenter.totalIngresosLabel;

      expect(etiqueta).toBe('$4.000');
    });
  });

  describe('Datos de Gráficos y Tarjetas', () => {
    beforeEach(() => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(SugerenciasAgregarMother.crearListaSugerencias()));
      presenter.initialize();
    });

    it('debería generar los datos del gráfico ordenados por ingreso mayor y calcular el porcentaje relativo', () => {
      
      const datos = presenter.chartData;
      
      expect(datos.length).toBe(3);
      expect(datos[0].nombre).toBe('Prod C');
      expect(datos[0].ingresos).toBe(2000);
      expect(datos[0].ingresoPercent).toBe(100); 
      expect(datos[1].ingresoPercent).toBe(50);
    });

    it('debería generar las tarjetas de productos mapeando correctamente todos los campos', () => {
      
      const tarjetas = presenter.productCards;
      
      expect(tarjetas.length).toBe(3);
      expect(tarjetas[0].nombre).toBe('Prod C');
      expect(tarjetas[0].ingresoPercent).toBe(100);
      expect(tarjetas[0].mensaje).toBe('Msg 3');
    });
  });

  describe('Helpers de Formateo', () => {
    
    // ARCHITECTURE WARNING: Este formateo debería delegarse a un Pipe en la vista
    it('debería formatear valores numéricos a moneda local sin decimales', () => {
      
      const formateado = presenter.formatCurrency(1500);

      expect(formateado).toBe('$1.500');
    });

    // ARCHITECTURE WARNING: Este formateo debería delegarse a un Pipe en la vista
    it('debería formatear cero correctamente', () => {
      
      const formateado = presenter.formatCurrency(0);

      expect(formateado).toBe('$0');
    });
  });
});
