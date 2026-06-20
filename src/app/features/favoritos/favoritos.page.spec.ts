import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FavoritosPage } from './favoritos.page';
import { FavoritosService } from './services/favoritos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Producto } from '../buffet/models/producto.model';
import { AuthService } from '../../core/auth/services/auth.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { NotificacionesService } from '../../data-access/services/notificaciones.service';

describe('FavoritosPage', () => {
  let component: FavoritosPage;
  let fixture: ComponentFixture<FavoritosPage>;
  let favoritosSpy: jasmine.SpyObj<FavoritosService>;
  let usuarioSpy: jasmine.SpyObj<UsuarioService>;
  let perfilSpy: jasmine.SpyObj<PerfilService>;
  let carritoSpy: jasmine.SpyObj<CarritoService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let alumnosSpy: jasmine.SpyObj<AlumnosService>;
  let notificacionesSpy: jasmine.SpyObj<NotificacionesService>;

  beforeEach(async () => {
    favoritosSpy = jasmine.createSpyObj('FavoritosService', ['getFavoritos', 'removerFavorito']);
    usuarioSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl', 'getUsuarioActual', 'getAlumnoActual', 'homeUrl']);
    perfilSpy = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    carritoSpy = jasmine.createSpyObj('CarritoService', ['agregar']);
    toastSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    authSpy = jasmine.createSpyObj('AuthService', ['logout']);
    alumnosSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    notificacionesSpy = jasmine.createSpyObj('NotificacionesService', ['obtenerNotificaciones']);

    usuarioSpy.getUsuarioActual.and.returnValue({ nombre: 'Test User' } as any);
    usuarioSpy.getAlumnoActual.and.returnValue({ id: 'a-fallback' } as any);
    usuarioSpy.homeUrl.and.returnValue('/alumno');
    (usuarioSpy as any).esVistaAlumno = signal(true);
    (usuarioSpy as any).esVistaKiosquero = signal(false);
    (carritoSpy as any).cantidadTotal = signal(0);
    (alumnosSpy as any).alumnos = signal([]);
    (notificacionesSpy as any).notificaciones = signal([]);
    (notificacionesSpy as any).cantidad = signal(0);
    perfilSpy.obtenerAlumnoId.and.returnValue('a1');

    favoritosSpy.getFavoritos.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FavoritosPage],
      providers: [
        { provide: FavoritosService, useValue: favoritosSpy },
        { provide: UsuarioService, useValue: usuarioSpy },
        { provide: PerfilService, useValue: perfilSpy },
        { provide: CarritoService, useValue: carritoSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: AlumnosService, useValue: alumnosSpy },
        { provide: NotificacionesService, useValue: notificacionesSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavoritosPage);
    component = fixture.componentInstance;
  });

  it('debe crearse, setear homeUrl y alumnoId', () => {
    expect(component).toBeTruthy();
    expect(usuarioSpy.setHomeUrl).toHaveBeenCalledWith('/alumno');
    expect(component.alumnoId).toBe('a1');
    expect(favoritosSpy.getFavoritos).toHaveBeenCalledWith('a1');
  });

  it('usa fallback para alumnoId si perfil retorna null', () => {
    perfilSpy.obtenerAlumnoId.and.returnValue(null);
    const comp2 = TestBed.createComponent(FavoritosPage).componentInstance;
    expect(comp2.alumnoId).toBe('a-fallback');
  });

  describe('cargarFavoritos', () => {
    it('debe cargar favoritos', () => {
      const mockProd = [{ id: 'p1' } as Producto];
      favoritosSpy.getFavoritos.and.returnValue(of(mockProd));
      component.cargarFavoritos();
      expect(component.favoritos.length).toBe(1);
    });

    it('maneja error en carga', () => {
      favoritosSpy.getFavoritos.and.returnValue(throwError(() => new Error('Error')));
      component.cargarFavoritos();
      // Solo loguea, no altera el estado de forma visible en variables
      expect(component.favoritos.length).toBe(0);
    });
  });

  describe('quitarFavorito', () => {
    it('debe quitar favorito y mostrar toast', () => {
      component.favoritos = [{ id: 'p1' } as Producto, { id: 'p2' } as Producto];
      favoritosSpy.removerFavorito.and.returnValue(of(undefined as any));

      component.quitarFavorito('p1');
      
      expect(favoritosSpy.removerFavorito).toHaveBeenCalledWith('a1', 'p1');
      expect(component.favoritos.length).toBe(1);
      expect(component.favoritos[0].id).toBe('p2');
      expect(toastSpy.mostrar).toHaveBeenCalledWith('Producto quitado de favoritos', 'success');
    });

    it('maneja error al quitar favorito', () => {
      component.favoritos = [{ id: 'p1' } as Producto];
      favoritosSpy.removerFavorito.and.returnValue(throwError(() => new Error('Error')));

      component.quitarFavorito('p1');
      
      expect(component.favoritos.length).toBe(1); // no se filtro
    });
  });

  describe('agregarAlCarrito', () => {
    it('llama a carrito service', () => {
      component.agregarAlCarrito({ id: 'p1', nombre: 'Test' } as Producto);
      expect(carritoSpy.agregar).toHaveBeenCalled();
      expect(toastSpy.mostrar).toHaveBeenCalledWith('Se agregó 1x "Test" al carrito');
    });
  });

  describe('utils', () => {
    it('formatearPrecio', () => {
      const res = component.formatearPrecio(1500);
      expect(res.includes('$')).toBeTrue();
    });

    it('volver navega', () => {
      component.volver();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/alumno');
    });

    it('onImagenError setea fallback', () => {
      const event = { target: { src: 'broken.jpg' } } as any;
      component.onImagenError(event);
      expect(event.target.src).toBe(component.IMAGEN_FALLBACK);
    });

    it('onImagenError no hace nada si ya es fallback', () => {
      const event = { target: { src: component.IMAGEN_FALLBACK } } as any;
      component.onImagenError(event);
      expect(event.target.src).toBe(component.IMAGEN_FALLBACK);
    });
  });
});
