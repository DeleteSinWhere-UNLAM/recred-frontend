import { of, throwError } from 'rxjs';
import { SugerenciasAgregarPresenter } from './sugerencias-agregar.presenter';
import { SugerenciasAgregarService } from '../services/sugerencias-agregar.service';
import { SugerenciaAgregarProducto } from '../models/sugerencia-agregar.model';

class SugerenciasAgregarMother {
  static crearSugerencia(override: Partial<SugerenciaAgregarProducto> = {}): SugerenciaAgregarProducto {
    return {
      id: '1',
      alumnoId: null,
      buffetId: 'b1',
      productoId: 'p1',
      titulo: 'Título por defecto',
      mensaje: 'Mensaje por defecto',
      metadata: {
        totalSales: 10,
        productName: 'Producto por defecto',
        productPrice: 100,
        totalRevenue: 1000,
        totalCustomers: 5
      },
      ...override
    };
  }

  static crearListaSugerencias(): SugerenciaAgregarProducto[] {
    return [
      this.crearSugerencia({
        id: '1',
        metadata: { totalSales: 10, productName: 'Prod A', productPrice: 100, totalRevenue: 1000, totalCustomers: 5 }
      }),
      this.crearSugerencia({
        id: '2',
        metadata: { totalSales: 20, productName: 'Prod B', productPrice: 50, totalRevenue: 1000, totalCustomers: 10 }
      }),
      this.crearSugerencia({
        id: '3',
        mensaje: 'Msg 3',
        metadata: { totalSales: 5, productName: 'Prod C', productPrice: 400, totalRevenue: 2000, totalCustomers: 2 }
      })
    ];
  }
}

describe('SugerenciasAgregarPresenter', () => {
  let presenter: SugerenciasAgregarPresenter;
  let servicio: jasmine.SpyObj<SugerenciasAgregarService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj('SugerenciasAgregarService', ['getSugerenciasAgregarProducto']);
    presenter = new SugerenciasAgregarPresenter(servicio);
  });

  describe('Inicialización', () => {
    it('debería solicitar las sugerencias al servicio y actualizar el estado cuando sea exitoso', () => {
      // Arrange
      const sugerenciasEsperadas = SugerenciasAgregarMother.crearListaSugerencias();
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(sugerenciasEsperadas));
      
      let sugerenciasEmitidas: SugerenciaAgregarProducto[] | undefined;
      let isLoadingEmitido: boolean | undefined;
      let errorEmitido: string | null | undefined;
      
      presenter.sugerencias$.subscribe(val => sugerenciasEmitidas = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);
      presenter.error$.subscribe(val => errorEmitido = val);

      // Act
      presenter.initialize();

      // Assert
      expect(servicio.getSugerenciasAgregarProducto).toHaveBeenCalled();
      expect(sugerenciasEmitidas).toEqual(sugerenciasEsperadas);
      expect(isLoadingEmitido).toBeFalse();
      expect(errorEmitido).toBeNull();
    });

    it('debería actualizar el estado de error cuando el servicio falle', () => {
      // Arrange
      servicio.getSugerenciasAgregarProducto.and.returnValue(throwError(() => new Error('Error de red')));
      
      let errorEmitido: string | null | undefined;
      let isLoadingEmitido: boolean | undefined;
      
      presenter.error$.subscribe(val => errorEmitido = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);

      // Act
      presenter.initialize();

      // Assert
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
      // Arrange
      let total: number;

      // Act
      total = presenter.totalProductos;

      // Assert
      expect(total).toBe(3);
    });

    it('debería sumar las ventas totales de todas las sugerencias', () => {
      // Arrange
      let total: number;

      // Act
      total = presenter.totalVentas;

      // Assert
      expect(total).toBe(35);
    });

    it('debería calcular los ingresos totales esperados', () => {
      // Arrange
      let total: number;

      // Act
      total = presenter.totalIngresos;

      // Assert
      expect(total).toBe(4000);
    });

    it('debería sumar la cantidad de clientes únicos afectados', () => {
      // Arrange
      let total: number;

      // Act
      total = presenter.totalClientes;

      // Assert
      expect(total).toBe(17);
    });

    it('debería formatear correctamente la etiqueta del total de ingresos', () => {
      // Arrange
      let etiqueta: string;

      // Act
      etiqueta = presenter.totalIngresosLabel;

      // Assert
      expect(etiqueta).toBe('$4.000');
    });
  });

  describe('Datos de Gráficos y Tarjetas', () => {
    beforeEach(() => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(SugerenciasAgregarMother.crearListaSugerencias()));
      presenter.initialize();
    });

    it('debería generar los datos del gráfico ordenados por ingreso mayor y calcular el porcentaje relativo', () => {
      // Arrange
      let datos;

      // Act
      datos = presenter.chartData;
      
      // Assert
      expect(datos.length).toBe(3);
      expect(datos[0].nombre).toBe('Prod C');
      expect(datos[0].ingresos).toBe(2000);
      expect(datos[0].ingresoPercent).toBe(100); 
      expect(datos[1].ingresoPercent).toBe(50);
    });

    it('debería generar las tarjetas de productos mapeando correctamente todos los campos', () => {
      // Arrange
      let tarjetas;

      // Act
      tarjetas = presenter.productCards;
      
      // Assert
      expect(tarjetas.length).toBe(3);
      expect(tarjetas[0].nombre).toBe('Prod C');
      expect(tarjetas[0].ingresoPercent).toBe(100);
      expect(tarjetas[0].mensaje).toBe('Msg 3');
    });
  });

  describe('Helpers de Formateo', () => {
    
    // ARCHITECTURE WARNING: Este formateo debería delegarse a un Pipe en la vista
    it('debería formatear valores numéricos a moneda local sin decimales', () => {
      // Arrange
      let formateado: string;

      // Act
      formateado = presenter.formatCurrency(1500);

      // Assert
      expect(formateado).toBe('$1.500');
    });

    // ARCHITECTURE WARNING: Este formateo debería delegarse a un Pipe en la vista
    it('debería formatear cero correctamente', () => {
      // Arrange
      let formateado: string;

      // Act
      formateado = presenter.formatCurrency(0);

      // Assert
      expect(formateado).toBe('$0');
    });
  });
});
