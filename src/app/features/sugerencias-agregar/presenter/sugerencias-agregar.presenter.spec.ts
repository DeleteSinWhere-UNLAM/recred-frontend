import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { SugerenciaAgregarProductoMother } from '../sugerencias-agregar.mother';
import { SugerenciasAgregarService } from '../services/sugerencias-agregar.service';
import { SugerenciasAgregarPresenter } from './sugerencias-agregar.presenter';

describe('SugerenciasAgregarPresenter', () => {
  let presenter: SugerenciasAgregarPresenter;
  let servicio: jasmine.SpyObj<SugerenciasAgregarService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj<SugerenciasAgregarService>('SugerenciasAgregarService', [
      'getSugerenciasAgregarProducto',
    ]);
    TestBed.configureTestingModule({
      providers: [
        SugerenciasAgregarPresenter,
        { provide: SugerenciasAgregarService, useValue: servicio },
      ],
    });
    presenter = TestBed.inject(SugerenciasAgregarPresenter);
  });

  describe('initialize', () => {
    it('dado un back exitoso, cuando inicializo, deberia emitir las sugerencias y bajar isLoading', async () => {
      const sugerencias = SugerenciaAgregarProductoMother.crearVarias();
      servicio.getSugerenciasAgregarProducto.and.returnValue(of(sugerencias));

      presenter.initialize();

      expect(servicio.getSugerenciasAgregarProducto).toHaveBeenCalled();
      expect(await firstValueFrom(presenter.sugerencias$)).toEqual(sugerencias);
      expect(await firstValueFrom(presenter.isLoading$)).toBeFalse();
      expect(await firstValueFrom(presenter.error$)).toBeNull();
    });

    it('dado que el back falla, cuando inicializo, deberia emitir el mensaje de error y bajar isLoading', async () => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(
        throwError(() => new Error('Error de red')),
      );

      presenter.initialize();

      expect(await firstValueFrom(presenter.error$)).toBe(
        'No se pudieron cargar las oportunidades de stock.',
      );
      expect(await firstValueFrom(presenter.isLoading$)).toBeFalse();
    });
  });

  describe('KPIs computados', () => {
    beforeEach(() => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(
        of(SugerenciaAgregarProductoMother.crearVarias()),
      );
      presenter.initialize();
    });

    it('dadas tres sugerencias, cuando leo totalProductos, deberia devolver 3', () => {
      expect(presenter.totalProductos).toBe(3);
    });

    it('dadas tres sugerencias, cuando leo totalVentas, deberia sumar los totalSales', () => {
      expect(presenter.totalVentas).toBe(35);
    });

    it('dadas tres sugerencias, cuando leo totalIngresos, deberia sumar los totalRevenue', () => {
      expect(presenter.totalIngresos).toBe(4000);
    });

    it('dadas tres sugerencias, cuando leo totalClientes, deberia sumar los totalCustomers', () => {
      expect(presenter.totalClientes).toBe(17);
    });

    it('dado el total de ingresos, cuando pido su label, deberia formatearlo como moneda AR sin decimales', () => {
      expect(presenter.totalIngresosLabel).toBe('$4.000');
    });
  });

  describe('chartData y productCards', () => {
    beforeEach(() => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(
        of(SugerenciaAgregarProductoMother.crearVarias()),
      );
      presenter.initialize();
    });

    it('cuando leo chartData, deberia ordenar por ingreso descendente y calcular ingresoPercent relativo al maximo', () => {
      const datos = presenter.chartData;

      expect(datos.length).toBe(3);
      expect(datos[0].nombre).toBe('Prod C');
      expect(datos[0].ingresos).toBe(2000);
      expect(datos[0].ingresoPercent).toBe(100);
      expect(datos[1].ingresoPercent).toBe(50);
    });

    it('cuando leo productCards, deberia mapear los campos con el mensaje original de cada sugerencia', () => {
      const tarjetas = presenter.productCards;

      expect(tarjetas.length).toBe(3);
      expect(tarjetas[0].nombre).toBe('Prod C');
      expect(tarjetas[0].ingresoPercent).toBe(100);
      expect(tarjetas[0].mensaje).toBe('Msg 3');
    });

    it('dada una lista vacia, cuando leo chartData y productCards, deberia devolver arrays vacios', () => {
      servicio.getSugerenciasAgregarProducto.and.returnValue(of([]));
      presenter.initialize();

      expect(presenter.chartData).toEqual([]);
      expect(presenter.productCards).toEqual([]);
    });
  });

  describe('formatCurrency', () => {
    it('dado 1500, cuando formateo, deberia devolver $1.500', () => {
      expect(presenter.formatCurrency(1500)).toBe('$1.500');
    });

    it('dado 0, cuando formateo, deberia devolver $0', () => {
      expect(presenter.formatCurrency(0)).toBe('$0');
    });
  });
});
