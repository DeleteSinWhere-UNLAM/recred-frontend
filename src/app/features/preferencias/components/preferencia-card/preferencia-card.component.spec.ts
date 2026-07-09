import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Preferencia } from '../../models/preferencia.model';
import { PreferenciaMother } from '../../preferencias.mother';
import { PreferenciaCardComponent } from './preferencia-card.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FavoritosService } from '../../../favoritos/services/favoritos.service';

describe('PreferenciaCardComponent', () => {
  let component: PreferenciaCardComponent;
  let fixture: ComponentFixture<PreferenciaCardComponent>;
  let favoritosService: jasmine.SpyObj<FavoritosService>;

  beforeEach(async () => {
    favoritosService = jasmine.createSpyObj('FavoritosService', [
      'agregarFavorito',
      'obtenerImagenProducto',
    ]);
    favoritosService.obtenerImagenProducto.and.returnValue('https://cdn/inferida.png');

    await TestBed.configureTestingModule({
      imports: [PreferenciaCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FavoritosService, useValue: favoritosService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciaCardComponent);
    component = fixture.componentInstance;
  });

  describe('render con una preferencia', () => {
    it('dado una preferencia default, cuando renderizo, deberia mostrar el titulo', () => {
      whenRenderoCon(PreferenciaMother.crear());

      expect(textoRenderizado()).toContain('Alfajor de chocolate');
    });

    it('dado una preferencia default, cuando renderizo, deberia mostrar el mensaje', () => {
      whenRenderoCon(PreferenciaMother.crear());

      expect(textoRenderizado()).toContain('Es el producto que mas consume en el buffet');
    });

    it('dado una preferencia default, cuando renderizo, deberia mostrar el bloque Motivo con la razon IA', () => {
      whenRenderoCon(PreferenciaMother.crear());

      const texto = textoRenderizado();
      expect(texto).toContain('Motivo');
      expect(texto).toContain('Compra recurrente los lunes y miercoles');
    });

    it('dado otra preferencia (jugo de naranja), cuando renderizo, deberia mostrar sus datos', () => {
      whenRenderoCon(PreferenciaMother.crearJugo());

      const texto = textoRenderizado();
      expect(texto).toContain('Jugo de naranja');
      expect(texto).toContain('Complementa sus meriendas');
      expect(texto).toContain('Aparece en el 80% de sus compras del recreo');
    });

    it('dado una preferencia sin productoNombre, no deberia renderizar el bloque de producto ni el boton de favoritos', () => {
      whenRenderoCon(PreferenciaMother.crear({ productoNombre: undefined }));

      expect(queryUno('.preferencia-card__producto')).toBeNull();
      expect(queryUno('.preferencia-card__btn-favorito')).toBeNull();
    });

    it('dado una preferencia con productoNombre y precio, deberia renderizar el bloque de producto con el precio', () => {
      whenRenderoCon(
        PreferenciaMother.crear({ productoNombre: 'Alfajor', productoPrecio: 500 }),
      );

      const texto = textoRenderizado();
      expect(queryUno('.preferencia-card__producto')).toBeTruthy();
      expect(texto).toContain('Alfajor');
      expect(texto).toContain('$500');
    });
  });

  describe('imagenProducto', () => {
    it('dado una preferencia con productoImagen definida, deberia usar esa imagen', () => {
      component.preferencia = PreferenciaMother.crear({
        productoImagen: 'https://cdn/directa.png',
        productoNombre: 'Alfajor',
      });

      expect(component.imagenProducto).toBe('https://cdn/directa.png');
      expect(favoritosService.obtenerImagenProducto).not.toHaveBeenCalled();
    });

    it('dado una preferencia sin productoImagen pero con productoNombre, deberia inferirla desde el servicio', () => {
      component.preferencia = PreferenciaMother.crear({
        productoImagen: undefined,
        productoNombre: 'Jugo de naranja',
      });

      expect(component.imagenProducto).toBe('https://cdn/inferida.png');
      expect(favoritosService.obtenerImagenProducto).toHaveBeenCalledWith('Jugo de naranja');
    });

    it('dado una preferencia sin imagen ni nombre, deberia devolver un string vacio', () => {
      component.preferencia = PreferenciaMother.crear({
        productoImagen: undefined,
        productoNombre: undefined,
      });

      expect(component.imagenProducto).toBe('');
    });
  });

  describe('onImagenError', () => {
    it('dado una imagen que falla y no es el fallback, deberia reemplazar su src por el fallback', () => {
      const img = document.createElement('img');
      img.src = 'https://cdn/rota.png';

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toBe(component.IMAGEN_FALLBACK);
    });

    it('dado una imagen que ya es el fallback, no deberia reasignar el src', () => {
      const img = document.createElement('img');
      img.src = component.IMAGEN_FALLBACK;
      const setSrcSpy = spyOnProperty(img, 'src', 'set');

      component.onImagenError({ target: img } as unknown as Event);

      expect(setSrcSpy).not.toHaveBeenCalled();
    });
  });

  describe('agregarAFavoritos', () => {
    beforeEach(() => {
      spyOn(window, 'alert');
    });

    it('dado sin alumnoId, no deberia llamar al servicio', () => {
      component.preferencia = PreferenciaMother.crear();
      component.alumnoId = undefined;

      component.agregarAFavoritos();

      expect(favoritosService.agregarFavorito).not.toHaveBeenCalled();
      expect(component.isAdding).toBeFalse();
    });

    it('dado sin productoId, no deberia llamar al servicio', () => {
      component.preferencia = PreferenciaMother.crear({ productoId: '' });
      component.alumnoId = 'alumno-1';

      component.agregarAFavoritos();

      expect(favoritosService.agregarFavorito).not.toHaveBeenCalled();
    });

    it('dado alumnoId y productoId validos, cuando agrego, deberia llamar al servicio con el producto armado', () => {
      component.preferencia = PreferenciaMother.crear({
        productoId: 'prod-1',
        productoNombre: 'Alfajor',
        productoPrecio: 500,
      });
      component.alumnoId = 'alumno-1';
      favoritosService.agregarFavorito.and.returnValue(of(undefined));

      component.agregarAFavoritos();

      expect(favoritosService.agregarFavorito).toHaveBeenCalledTimes(1);
      const [alumnoIdArg, productoArg] = favoritosService.agregarFavorito.calls.mostRecent().args;
      expect(alumnoIdArg).toBe('alumno-1');
      expect(productoArg.id).toBe('prod-1');
      expect(productoArg.nombre).toBe('Alfajor');
      expect(productoArg.precio).toBe(500);
    });

    it('dado el servicio responde ok, deberia dejar isAdding en false y alertar exito', () => {
      component.preferencia = PreferenciaMother.crear();
      component.alumnoId = 'alumno-1';
      favoritosService.agregarFavorito.and.returnValue(of(undefined));

      component.agregarAFavoritos();

      expect(component.isAdding).toBeFalse();
      expect(window.alert).toHaveBeenCalledWith('¡Añadido a favoritos!');
    });

    it('dado el servicio falla, deberia dejar isAdding en false y alertar error', () => {
      component.preferencia = PreferenciaMother.crear();
      component.alumnoId = 'alumno-1';
      favoritosService.agregarFavorito.and.returnValue(throwError(() => new Error('boom')));

      component.agregarAFavoritos();

      expect(component.isAdding).toBeFalse();
      expect(window.alert).toHaveBeenCalledWith('Error al añadir a favoritos');
    });
  });

  function whenRenderoCon(preferencia: Preferencia): void {
    component.preferencia = preferencia;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
