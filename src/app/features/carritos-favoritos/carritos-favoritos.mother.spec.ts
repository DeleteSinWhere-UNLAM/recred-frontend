import {
  CarritoFavoritoItemResponseMother,
  CarritoFavoritoResponseMother,
  SaveCarritoFavoritoRequestMother,
} from './carritos-favoritos.mother';

describe('CarritosFavoritos mothers', () => {
  it('crearConItems deberia armar un carrito con los items pasados', () => {
    const items = [
      CarritoFavoritoItemResponseMother.crear({ productId: 'p1' }),
      CarritoFavoritoItemResponseMother.crear({ productId: 'p2', quantity: 3 }),
    ];

    const carrito = CarritoFavoritoResponseMother.crearConItems(items);

    expect(carrito.items).toEqual(items);
  });

  it('SaveCarritoFavoritoRequestMother.crear sin override deberia devolver el request default', () => {
    const request = SaveCarritoFavoritoRequestMother.crear();

    expect(request.nombre).toBe('Mi carrito preferido');
    expect(request.alumnoId).toBe('alumno-1');
    expect(request.id).toBeNull();
  });
});
