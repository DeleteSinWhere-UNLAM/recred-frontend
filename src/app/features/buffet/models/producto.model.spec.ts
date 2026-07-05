import { ProductoMother } from '../buffet.mother';
import { disponible, tieneClasificacion, Producto } from './producto.model';

describe('producto.model helpers', () => {
  describe('tieneClasificacion', () => {
    it('dado un producto con una clasificacion, cuando la busco por descripcion exacta, deberia devolver true', () => {
      const producto = givenProductoConClasificacion('Sin TACC');

      expect(tieneClasificacion(producto, 'Sin TACC')).toBeTrue();
    });

    it('dado una descripcion con distinta capitalizacion, cuando la busco, deberia matchear igual', () => {
      const producto = givenProductoConClasificacion('Sin TACC');

      expect(tieneClasificacion(producto, 'sin tacc')).toBeTrue();
      expect(tieneClasificacion(producto, 'SIN TACC')).toBeTrue();
    });

    it('dado una clasificacion que no esta, cuando la busco, deberia devolver false', () => {
      const producto = givenProductoConClasificacion('Sin TACC');

      expect(tieneClasificacion(producto, 'Vegano')).toBeFalse();
    });

    it('dado un producto sin clasificaciones, cuando la busco, deberia devolver false', () => {
      const producto = ProductoMother.crear({ clasificacionesSalud: [] });

      expect(tieneClasificacion(producto, 'Cualquiera')).toBeFalse();
    });
  });

  describe('disponible', () => {
    it('dado un producto DISPONIBLE, cuando consulto disponibilidad, deberia devolver true', () => {
      const producto = ProductoMother.crear({ estadoStock: 'DISPONIBLE' });

      expect(disponible(producto)).toBeTrue();
    });

    it('dado un producto BAJO_STOCK, cuando consulto disponibilidad, deberia devolver true (aun se puede vender)', () => {
      const producto = ProductoMother.crear({ estadoStock: 'BAJO_STOCK' });

      expect(disponible(producto)).toBeTrue();
    });

    it('dado un producto SIN_STOCK, cuando consulto disponibilidad, deberia devolver false', () => {
      const producto = ProductoMother.crear({ estadoStock: 'SIN_STOCK' });

      expect(disponible(producto)).toBeFalse();
    });
  });

  function givenProductoConClasificacion(descripcion: string): Producto {
    return ProductoMother.crear({
      clasificacionesSalud: [{ id: descripcion.toLowerCase().replace(/\s/g, '-'), descripcion }],
    });
  }
});
