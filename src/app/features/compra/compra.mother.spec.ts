import { ProductoMother } from './compra.mother';

describe('ProductoMother de compra', () => {
  it('crearSinStock deberia devolver un producto con estadoStock SIN_STOCK', () => {
    const producto = ProductoMother.crearSinStock();

    expect(producto.estadoStock).toBe('SIN_STOCK');
  });

  it('crearSinStock con override deberia mergear sobre el default', () => {
    const producto = ProductoMother.crearSinStock({ nombre: 'Alfajor sin stock' });

    expect(producto.nombre).toBe('Alfajor sin stock');
    expect(producto.estadoStock).toBe('SIN_STOCK');
  });
});
