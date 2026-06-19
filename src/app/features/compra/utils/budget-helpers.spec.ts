import { DateRange, getPeriodRange, getProductCategory, isSameCategory } from './budget-helpers';
import { Periodo } from '../../presupuesto/models/presupuesto.model';
import { Producto } from '../../buffet/models/producto.model';

describe('Budget Helpers', () => {

  describe('getPeriodRange', () => {
    it('should return correct range for DIARIO', () => {
      const refDate = new Date('2023-10-15T12:00:00');
      const { start, end } = getPeriodRange('DIARIO' as Periodo, refDate);
      expect(start.getHours()).toBe(0);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });

    it('should return correct range for SEMANAL when day is Sunday (0)', () => {
      // 2023-10-15 is Sunday
      const refDate = new Date('2023-10-15T12:00:00');
      const { start, end } = getPeriodRange('SEMANAL' as Periodo, refDate);
      expect(start.getDate()).toBe(9); // Monday
      expect(end.getDate()).toBe(15); // Sunday
    });

    it('should return correct range for SEMANAL when day is not Sunday', () => {
      // 2023-10-18 is Wednesday
      const refDate = new Date('2023-10-18T12:00:00');
      const { start, end } = getPeriodRange('SEMANAL' as Periodo, refDate);
      expect(start.getDate()).toBe(16); // Monday
      expect(end.getDate()).toBe(22); // Sunday
    });

    it('should return correct range for QUINCENAL when day <= 15', () => {
      const refDate = new Date('2023-10-10T12:00:00');
      const { start, end } = getPeriodRange('QUINCENAL' as Periodo, refDate);
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(15);
    });

    it('should return correct range for QUINCENAL when day > 15', () => {
      const refDate = new Date('2023-10-20T12:00:00');
      const { start, end } = getPeriodRange('QUINCENAL' as Periodo, refDate);
      expect(start.getDate()).toBe(16);
      expect(end.getDate()).toBe(31); // October has 31 days
    });

    it('should return correct range for MENSUAL', () => {
      const refDate = new Date('2023-10-20T12:00:00');
      const { start, end } = getPeriodRange('MENSUAL' as Periodo, refDate);
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getProductCategory', () => {
    it('should return category id if product exists and has category', () => {
      const catalog = [{ id: '1', categoria: { id: 'cat1' } }] as Producto[];
      const cat = getProductCategory('1', 'Prod 1', catalog);
      expect(cat).toBe('cat1');
    });

    it('should return empty string if product exists but has no category', () => {
      const catalog = [{ id: '1' }] as Producto[];
      const cat = getProductCategory('1', 'Prod 1', catalog);
      expect(cat).toBe('');
    });

    it('should return empty string if product does not exist in catalog', () => {
      const catalog = [{ id: '2', categoria: { id: 'cat2' } }] as Producto[];
      const cat = getProductCategory('1', 'Prod 1', catalog);
      expect(cat).toBe('');
    });
  });

  describe('isSameCategory', () => {
    it('should return false if prodCatId is missing', () => {
      expect(isSameCategory('', 'desc', 'cat1', 'desc')).toBeFalse();
    });

    it('should return false if ruleCatId is missing', () => {
      expect(isSameCategory('cat1', 'desc', '', 'desc')).toBeFalse();
    });

    it('should return true if prodCatId and ruleCatId match exactly (case insensitive)', () => {
      expect(isSameCategory('Cat1', 'desc1', 'cAt1', 'desc2')).toBeTrue();
    });

    it('should return false if prodCatDesc is missing (and ids do not match)', () => {
      expect(isSameCategory('cat1', '', 'cat2', 'desc')).toBeFalse();
    });

    it('should return false if ruleCatDesc is missing (and ids do not match)', () => {
      expect(isSameCategory('cat1', 'desc', 'cat2', '')).toBeFalse();
    });

    it('should return true if descriptions include each other ignoring accents and case', () => {
      expect(isSameCategory('cat1', 'DescripcióN', 'cat2', 'descripcion')).toBeTrue();
      expect(isSameCategory('cat1', 'café', 'cat2', 'Cafe exprés')).toBeTrue();
      expect(isSameCategory('cat1', 'Golosinas', 'cat2', 'Golosina')).toBeTrue();
    });

    it('should return false if descriptions do not include each other', () => {
      expect(isSameCategory('cat1', 'Bebida', 'cat2', 'Comida')).toBeFalse();
    });
  });

});
