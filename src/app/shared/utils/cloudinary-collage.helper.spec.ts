import { getCloudinaryPublicId, buildCloudinaryCollageUrl } from './cloudinary-collage.helper';

describe('CloudinaryCollageHelper', () => {
  describe('getCloudinaryPublicId', () => {
    it('debería retornar el fallback si la URL está vacía', () => {
      expect(getCloudinaryPublicId('')).toBe('logo_sin_fondo_ikciro');
    });

    it('debería retornar el fallback si la URL no es de Cloudinary', () => {
      expect(getCloudinaryPublicId('https://example.com/image.jpg')).toBe('logo_sin_fondo_ikciro');
    });

    it('debería extraer el public ID de una URL simple de Cloudinary', () => {
      const url = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
      expect(getCloudinaryPublicId(url)).toBe('logo_sin_fondo_ikciro');
    });

    it('debería extraer el public ID y mantener carpetas reemplazando barras por dos puntos', () => {
      const url = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/products/galletitas_oreo.jpg';
      expect(getCloudinaryPublicId(url)).toBe('products:galletitas_oreo');
    });
  });

  describe('buildCloudinaryCollageUrl', () => {
    const fallbackImage = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';

    it('debería retornar la imagen por defecto si la lista de URLs está vacía', () => {
      expect(buildCloudinaryCollageUrl([])).toBe(fallbackImage);
    });

    it('debería retornar la misma URL si solo hay un producto', () => {
      const url = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/products/galletitas_oreo.jpg';
      expect(buildCloudinaryCollageUrl([url])).toBe(url);
    });

    it('debería construir la URL con dos overlays para 2 productos', () => {
      const url1 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/product1.jpg';
      const url2 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/product2.jpg';
      
      const result = buildCloudinaryCollageUrl([url1, url2]);
      
      expect(result).toContain('w_800,h_600');
      expect(result).toContain('l_product1,c_fill,w_398,h_600/fl_layer_apply,g_north_west,x_0,y_0');
      expect(result).toContain('l_product2,c_fill,w_398,h_600/fl_layer_apply,g_north_west,x_402,y_0');
    });

    it('debería construir la URL con tres overlays para 3 productos', () => {
      const url1 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p1.jpg';
      const url2 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p2.jpg';
      const url3 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p3.jpg';
      
      const result = buildCloudinaryCollageUrl([url1, url2, url3]);
      
      expect(result).toContain('l_p1,c_fill,w_398,h_600');
      expect(result).toContain('l_p2,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_0');
      expect(result).toContain('l_p3,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_302');
    });

    it('debería construir la URL con cuatro overlays en grilla 2x2 para 4 o más productos', () => {
      const url1 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p1.jpg';
      const url2 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p2.jpg';
      const url3 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p3.jpg';
      const url4 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p4.jpg';
      const url5 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p5.jpg';
      
      const result = buildCloudinaryCollageUrl([url1, url2, url3, url4, url5]);
      
      expect(result).toContain('l_p1,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_0,y_0');
      expect(result).toContain('l_p2,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_0');
      expect(result).toContain('l_p3,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_0,y_302');
      expect(result).toContain('l_p4,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_302');
      expect(result).not.toContain('p5');
    });
  });
});
