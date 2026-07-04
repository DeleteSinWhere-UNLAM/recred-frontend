import { CategoriaProductoMother } from './presupuesto.mother';

describe('CategoriaProductoMother de presupuesto', () => {
  it('crear deberia devolver la categoria default "Bebidas e Infusiones"', () => {
    const categoria = CategoriaProductoMother.crear();

    expect(categoria.id).toBe('cat-bebidas');
    expect(categoria.descripcion).toBe('Bebidas e Infusiones');
  });

  it('crear con override deberia mergear', () => {
    const categoria = CategoriaProductoMother.crear({ id: 'cat-otra' });

    expect(categoria.id).toBe('cat-otra');
  });
});
