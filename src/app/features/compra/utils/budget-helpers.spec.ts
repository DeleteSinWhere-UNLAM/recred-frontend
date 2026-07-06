import { Producto } from '../../buffet/models/producto.model';
import { ProductoMother } from '../../buffet/buffet.mother';
import {
  getPeriodRange,
  getProductCategory,
  isSameCategory,
} from './budget-helpers';

describe('budget-helpers', () => {
  describe('getPeriodRange', () => {
    it('dado periodo DIARIO, cuando pido el rango, deberia dar el dia completo (00:00 a 23:59:59)', () => {
      const ref = new Date('2026-07-15T10:30:00');

      const { start, end } = getPeriodRange('DIARIO', ref);

      expect(start.getDate()).toBe(15);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(end.getDate()).toBe(15);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });

    it('dado periodo SEMANAL desde un miercoles, cuando pido el rango, deberia arrancar el lunes y terminar el domingo', () => {
      const miercoles = new Date('2026-07-15T10:30:00');

      const { start, end } = getPeriodRange('SEMANAL', miercoles);

      expect(start.getDay()).toBe(1);
      expect(end.getDay()).toBe(0);
    });

    it('dado periodo SEMANAL desde un domingo, cuando pido el rango, deberia arrancar el lunes previo', () => {
      const domingo = new Date('2026-07-12T10:30:00');

      const { start } = getPeriodRange('SEMANAL', domingo);

      expect(start.getDay()).toBe(1);
    });

    it('dado periodo QUINCENAL con dia <=15, cuando pido el rango, deberia ir del 1 al 15', () => {
      const ref = new Date('2026-07-10T10:30:00');

      const { start, end } = getPeriodRange('QUINCENAL', ref);

      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(15);
    });

    it('dado periodo QUINCENAL con dia >15, cuando pido el rango, deberia ir del 16 al fin de mes', () => {
      const ref = new Date('2026-07-20T10:30:00');

      const { start, end } = getPeriodRange('QUINCENAL', ref);

      expect(start.getDate()).toBe(16);
      expect(end.getDate()).toBe(31);
    });

    it('dado periodo MENSUAL, cuando pido el rango, deberia ir del 1 al ultimo dia del mes', () => {
      const ref = new Date('2026-07-15T10:30:00');

      const { start, end } = getPeriodRange('MENSUAL', ref);

      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(31);
    });

    it('dado periodo MENSUAL en febrero de bisiesto, cuando pido el rango, deberia terminar el 29', () => {
      const ref = new Date('2028-02-15T10:30:00');

      const { end } = getPeriodRange('MENSUAL', ref);

      expect(end.getMonth()).toBe(1);
      expect(end.getDate()).toBe(29);
    });

    it('dado sin referenceDate, cuando pido el rango, deberia usar new Date() por default', () => {
      const { start, end } = getPeriodRange('DIARIO');

      const hoy = new Date();
      expect(start.getDate()).toBe(hoy.getDate());
      expect(end.getDate()).toBe(hoy.getDate());
    });
  });

  describe('getProductCategory', () => {
    it('dado un producto en el catalogo, cuando pido su categoria, deberia devolver el id', () => {
      const catalog = givenCatalogoCon([
        ProductoMother.crear({ id: 'p1', categoria: { id: 'bebidas', descripcion: 'Bebidas' } }),
      ]);

      expect(getProductCategory('p1', 'Agua', catalog)).toBe('bebidas');
    });

    it('dado un producto sin categoria, cuando pido su categoria, deberia devolver string vacio', () => {
      const catalog = givenCatalogoCon([
        ProductoMother.crear({ id: 'p1', categoria: { id: '', descripcion: '' } }),
      ]);

      expect(getProductCategory('p1', 'X', catalog)).toBe('');
    });

    it('dado un producto que no esta en el catalogo, cuando pido su categoria, deberia devolver string vacio', () => {
      expect(getProductCategory('desconocido', 'X', [])).toBe('');
    });
  });

  describe('isSameCategory', () => {
    it('dado ids iguales (mismo case), cuando comparo, deberia devolver true', () => {
      expect(isSameCategory('bebidas', 'Bebidas', 'bebidas', 'Bebidas')).toBeTrue();
    });

    it('dado ids iguales con distinto case, cuando comparo, deberia devolver true (case insensitive)', () => {
      expect(isSameCategory('BEBIDAS', 'Bebidas', 'bebidas', 'Bebidas')).toBeTrue();
    });

    it('dado ids distintos pero descripciones que se contienen mutuamente, cuando comparo, deberia devolver true', () => {
      expect(isSameCategory('id1', 'Bebidas frías', 'id2', 'bebidas')).toBeTrue();
      expect(isSameCategory('id1', 'bebidas', 'id2', 'Bebidas Frías')).toBeTrue();
    });

    it('dado descripciones con tildes, cuando comparo, deberia normalizarlas y matchear', () => {
      expect(isSameCategory('id1', 'Café Frío', 'id2', 'cafe frio')).toBeTrue();
    });

    it('dado descripciones completamente distintas, cuando comparo, deberia devolver false', () => {
      expect(isSameCategory('id1', 'Bebidas', 'id2', 'Comidas')).toBeFalse();
    });

    it('dado prodCatId vacio, cuando comparo, deberia devolver false', () => {
      expect(isSameCategory('', 'X', 'id2', 'Y')).toBeFalse();
    });

    it('dado ruleCatId vacio, cuando comparo, deberia devolver false', () => {
      expect(isSameCategory('id1', 'X', '', 'Y')).toBeFalse();
    });

    it('dado ids distintos y prodCatDesc vacio, cuando comparo, deberia devolver false', () => {
      expect(isSameCategory('id1', '', 'id2', 'Y')).toBeFalse();
    });

    it('dado ids distintos y ruleCatDesc vacio, cuando comparo, deberia devolver false', () => {
      expect(isSameCategory('id1', 'X', 'id2', '')).toBeFalse();
    });
  });

  function givenCatalogoCon(productos: Producto[]): Producto[] {
    return productos;
  }
});
