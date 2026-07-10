import { getCloudinaryPublicId, buildCloudinaryCollageUrl } from './cloudinary-collage.helper';

const FALLBACK_IMAGE = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';

describe('CloudinaryCollageHelper', () => {
  describe('getCloudinaryPublicId', () => {
    it('dado una URL vacia, cuando pido el public id, deberia retornar el fallback', () => {
      const id = whenPidoElPublicIdDe('');

      thenElPublicIdEs(id, 'logo_sin_fondo_ikciro');
    });

    it('dado una URL que no es de Cloudinary, cuando pido el public id, deberia retornar el fallback', () => {
      const id = whenPidoElPublicIdDe('https://example.com/image.jpg');

      thenElPublicIdEs(id, 'logo_sin_fondo_ikciro');
    });

    it('dado una URL simple de Cloudinary, cuando pido el public id, deberia extraerlo', () => {
      const url = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';

      const id = whenPidoElPublicIdDe(url);

      thenElPublicIdEs(id, 'logo_sin_fondo_ikciro');
    });

    it('dado una URL con carpetas, cuando pido el public id, deberia mantenerlas reemplazando barras por dos puntos', () => {
      const url = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/products/galletitas_oreo.jpg';

      const id = whenPidoElPublicIdDe(url);

      thenElPublicIdEs(id, 'products:galletitas_oreo');
    });
  });

  describe('buildCloudinaryCollageUrl', () => {
    it('dado una lista de URLs vacia, cuando construyo el collage, deberia retornar la imagen por defecto', () => {
      const url = whenConstruyoCollageDe([]);

      thenLaUrlEs(url, FALLBACK_IMAGE);
    });

    it('dado una sola URL, cuando construyo el collage, deberia retornar la misma URL', () => {
      const url = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/products/galletitas_oreo.jpg';

      const collage = whenConstruyoCollageDe([url]);

      thenLaUrlEs(collage, url);
    });

    it('dado 2 productos, cuando construyo el collage, deberia armar la URL con dos overlays', () => {
      const url1 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/product1.jpg';
      const url2 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/product2.jpg';

      const result = whenConstruyoCollageDe([url1, url2]);

      thenLaUrlContiene(result, 'w_800,h_600');
      thenLaUrlContiene(result, 'l_product1,c_fill,w_398,h_600/fl_layer_apply,g_north_west,x_0,y_0');
      thenLaUrlContiene(result, 'l_product2,c_fill,w_398,h_600/fl_layer_apply,g_north_west,x_402,y_0');
    });

    it('dado 3 productos, cuando construyo el collage, deberia armar la URL con tres overlays', () => {
      const url1 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p1.jpg';
      const url2 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p2.jpg';
      const url3 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p3.jpg';

      const result = whenConstruyoCollageDe([url1, url2, url3]);

      thenLaUrlContiene(result, 'l_p1,c_fill,w_398,h_600');
      thenLaUrlContiene(result, 'l_p2,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_0');
      thenLaUrlContiene(result, 'l_p3,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_302');
    });

    it('dado 5 productos, cuando construyo el collage, deberia armar la URL con cuatro overlays en grilla 2x2 e ignorar el quinto', () => {
      const url1 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p1.jpg';
      const url2 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p2.jpg';
      const url3 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p3.jpg';
      const url4 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p4.jpg';
      const url5 = 'https://res.cloudinary.com/djzfudbze/image/upload/v1/p5.jpg';

      const result = whenConstruyoCollageDe([url1, url2, url3, url4, url5]);

      thenLaUrlContiene(result, 'l_p1,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_0,y_0');
      thenLaUrlContiene(result, 'l_p2,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_0');
      thenLaUrlContiene(result, 'l_p3,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_0,y_302');
      thenLaUrlContiene(result, 'l_p4,c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_302');
      thenLaUrlNoContiene(result, 'p5');
    });
  });

  describe('getCloudinaryPublicId con URL de cloudinary sin "/image/upload/"', () => {
    it('dado una URL de cloudinary que no contiene /image/upload/, deberia devolver el fallback', () => {
      const result = whenPidoElPublicIdDe('https://res.cloudinary.com/djzfudbze/otra-ruta/algo.png');

      thenElPublicIdEs(result, 'logo_sin_fondo_ikciro');
    });
  });

  function whenPidoElPublicIdDe(url: string): string {
    return getCloudinaryPublicId(url);
  }

  function whenConstruyoCollageDe(urls: string[]): string {
    return buildCloudinaryCollageUrl(urls);
  }

  function thenElPublicIdEs(actual: string, esperado: string): void {
    expect(actual).toBe(esperado);
  }

  function thenLaUrlEs(actual: string, esperada: string): void {
    expect(actual).toBe(esperada);
  }

  function thenLaUrlContiene(actual: string, fragmento: string): void {
    expect(actual).toContain(fragmento);
  }

  function thenLaUrlNoContiene(actual: string, fragmento: string): void {
    expect(actual).not.toContain(fragmento);
  }
});
