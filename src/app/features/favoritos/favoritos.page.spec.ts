import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ProductoFavoritoMother } from './favoritos.mother';
import { FavoritosPage } from './favoritos.page';
import { FavoritosService } from './services/favoritos.service';
import { BuffetService } from '../buffet/services/buffet.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('FavoritosPage', () => {
  const ID_ALUMNO_CONTEXT = 'alumno-123';

  let component: FavoritosPage;
  let fixture: ComponentFixture<FavoritosPage>;
  let servicioFavoritos: jasmine.SpyObj<FavoritosService>;
  let servicioBuffet: jasmine.SpyObj<BuffetService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    servicioFavoritos = jasmine.createSpyObj<FavoritosService>('FavoritosService', [
      'getFavoritos',
      'agregarFavorito',
      'removerFavorito',
    ]);
    servicioFavoritos.getFavoritos.and.returnValue(of([ProductoFavoritoMother.crearAlfajor()]));

    servicioBuffet = jasmine.createSpyObj<BuffetService>('BuffetService', [
      'obtenerBuffetDelAlumno',
      'getProductosDelBuffet'
    ]);
    servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(of({ id: 'buffet-1' } as any));
    servicioBuffet.getProductosDelBuffet.and.returnValue(of([]));

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    servicioPerfil.obtenerAlumnoId.and.returnValue(ID_ALUMNO_CONTEXT);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', [
      'getUsuarioActual',
      'getAlumnoActual',
      'setHomeUrl',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Alumno Test',
    } as ReturnType<UsuarioService['getUsuarioActual']>);
    servicioUsuario.getAlumnoActual.and.returnValue({
      id: 'alumno-fallback',
    } as ReturnType<UsuarioService['getAlumnoActual']>);

    servicioCarrito = jasmine.createSpyObj('CarritoService', ['agregar']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [FavoritosPage],
      providers: [
        { provide: FavoritosService, useValue: servicioFavoritos },
        { provide: BuffetService, useValue: servicioBuffet },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: ToastService, useValue: servicioToast },
        provideRouter([]),
      ],
    })
      .overrideComponent(FavoritosPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(FavoritosPage);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado un perfil con alumnoId, cuando se monta, deberia usarlo y setear /alumno como home', () => {
      whenMonto();

      expect(component.alumnoId).toBe(ID_ALUMNO_CONTEXT);
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/alumno');
    });

    it('dado un perfil sin alumnoId, cuando se monta, deberia caer al fallback del UsuarioService', () => {
      servicioPerfil.obtenerAlumnoId.and.returnValue(null);
      const nuevaFixture = TestBed.createComponent(FavoritosPage);

      expect(nuevaFixture.componentInstance.alumnoId).toBe('alumno-fallback');
    });

    it('dado un alumno con favoritos, cuando se monta, deberia cargarlos', () => {
      whenMonto();

      expect(servicioFavoritos.getFavoritos).toHaveBeenCalledWith(ID_ALUMNO_CONTEXT);
      expect(component.favoritos.length).toBe(1);
    });
  });

  describe('render', () => {
    it('dado un favorito cargado, deberia mostrar el nombre del producto', () => {
      whenMonto();

      const nombre = queryUno('.favoritos-fav-card__nombre')?.textContent?.trim() ?? '';
      expect(nombre).toContain('Alfajor Triple');
    });
  });

  describe('quitarFavorito', () => {
    it('dado un producto favorito, cuando lo quito con exito, deberia sacarlo de la lista y mostrar toast', () => {
      servicioFavoritos.removerFavorito.and.returnValue(of(undefined));
      whenMonto();

      component.quitarFavorito('prod-alfajor');

      expect(servicioFavoritos.removerFavorito).toHaveBeenCalledWith(
        ID_ALUMNO_CONTEXT,
        'prod-alfajor',
      );
      expect(component.favoritos.length).toBe(0);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Producto quitado de favoritos',
        'success',
      );
    });

    it('dado que el service falla al remover, deberia loggear y no tocar la lista', () => {
      spyOn(console, 'error');
      servicioFavoritos.removerFavorito.and.returnValue(throwError(() => new Error('boom')));
      whenMonto();

      component.quitarFavorito('prod-alfajor');

      expect(component.favoritos.length).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('agregarAlCarrito', () => {
    it('dado un producto, cuando lo agrego al carrito, deberia llamar CarritoService.agregar y mostrar toast', () => {
      const producto = ProductoFavoritoMother.crearAlfajor();
      whenMonto();

      component.agregarAlCarrito(producto);

      expect(servicioCarrito.agregar).toHaveBeenCalledWith(producto, ID_ALUMNO_CONTEXT, 1);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Se agregó 1x "Alfajor Triple" al carrito',
      );
    });
  });

  describe('helpers', () => {
    it('dado un precio, deberia formatearlo en pesos argentinos', () => {
      whenMonto();

      const formateado = component.formatearPrecio(1200).replace(/\s/g, ' ');
      expect(formateado).toContain('$');
      expect(formateado).toContain('1.200');
    });

    it('dado un click en volver, deberia navegar a /alumno', () => {
      whenMonto();

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/alumno');
    });

    it('dado un error de carga de imagen, deberia reemplazar el src por IMAGEN_FALLBACK', () => {
      whenMonto();
      const img = document.createElement('img');
      img.src = 'ruta-invalida.png';

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toBe(component.IMAGEN_FALLBACK);
    });

    it('dado que el src ya es el fallback, no deberia reemplazarlo (evita loop)', () => {
      whenMonto();
      const img = document.createElement('img');
      img.src = component.IMAGEN_FALLBACK;

      component.onImagenError({ target: img } as unknown as Event);

      expect(img.src).toBe(component.IMAGEN_FALLBACK);
    });
  });

  describe('error path', () => {
    it('dado que getFavoritos falla, deberia loguear el error y dejar la lista vacia', () => {
      spyOn(console, 'error');
      servicioFavoritos.getFavoritos.and.returnValue(throwError(() => new Error('boom')));

      const nuevoFixture = TestBed.createComponent(FavoritosPage);
      const nuevoComponent = nuevoFixture.componentInstance;

      expect(console.error).toHaveBeenCalledWith('Error al cargar favoritos:', jasmine.any(Error));
      expect(nuevoComponent.favoritos).toEqual([]);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }
});
