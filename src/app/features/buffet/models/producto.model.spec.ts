import { Producto, disponible, tieneClasificacion } from './producto.model';

describe('Producto Model Functions', () => {
  let productoMock: Producto;

  beforeEach(() => {
    productoMock = {
      id: '1',
      nombre: 'Test Prod',
      descripcion: 'Desc',
      precio: 100,
      categoria: { id: 'c1', descripcion: 'Cat 1' },
      clasificacionesSalud: [
        { id: 'cs1', descripcion: 'Libre de Gluten' },
        { id: 'cs2', descripcion: 'Vegano' }
      ],
      imagen: 'img.png',
      estadoStock: 'DISPONIBLE'
    };
  });

  describe('tieneClasificacion', () => {
    it('debería retornar true si el producto tiene la clasificación (exacta)', () => {
      expect(tieneClasificacion(productoMock, 'Libre de Gluten')).toBeTrue();
    });

    it('debería retornar true si el producto tiene la clasificación (diferente casing)', () => {
      expect(tieneClasificacion(productoMock, 'libre de gluten')).toBeTrue();
      expect(tieneClasificacion(productoMock, 'VEGANO')).toBeTrue();
    });

    it('debería retornar false si el producto no tiene la clasificación', () => {
      expect(tieneClasificacion(productoMock, 'Sin Lactosa')).toBeFalse();
    });
  });

  describe('disponible', () => {
    it('debería retornar true si el estadoStock es DISPONIBLE', () => {
      productoMock.estadoStock = 'DISPONIBLE';
      expect(disponible(productoMock)).toBeTrue();
    });

    it('debería retornar true si el estadoStock es BAJO_STOCK', () => {
      productoMock.estadoStock = 'BAJO_STOCK';
      expect(disponible(productoMock)).toBeTrue();
    });

    it('debería retornar false si el estadoStock es SIN_STOCK', () => {
      productoMock.estadoStock = 'SIN_STOCK';
      expect(disponible(productoMock)).toBeFalse();
    });
  });
});
