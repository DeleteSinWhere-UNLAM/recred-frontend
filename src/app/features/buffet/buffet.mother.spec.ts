import { BuffetMother, CategoriaProductoMother } from './buffet.mother';

describe('BuffetMother helpers', () => {
  it('dado ningun override, CategoriaProductoMother.crear deberia devolver la categoria "Comidas"', () => {
    const categoria = CategoriaProductoMother.crear();

    expect(categoria.id).toBe('comidas');
    expect(categoria.descripcion).toBe('Comidas');
  });

  it('dado un override, CategoriaProductoMother.crear deberia mergearlo sobre el default', () => {
    const categoria = CategoriaProductoMother.crear({ id: 'bebidas' });

    expect(categoria.id).toBe('bebidas');
    expect(categoria.descripcion).toBe('Comidas');
  });

  it('dado un override, BuffetMother.crear deberia mergearlo sobre el buffet base', () => {
    const buffet = BuffetMother.crear({ nombre: 'Otro Buffet' });

    expect(buffet.id).toBe('buffet-1');
    expect(buffet.nombre).toBe('Otro Buffet');
  });
});
