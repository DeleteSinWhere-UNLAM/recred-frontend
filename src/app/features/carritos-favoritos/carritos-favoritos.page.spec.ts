import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarritosFavoritosPage } from './carritos-favoritos.page';
import { CarritosFavoritosService } from './services/carritos-favoritos.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ToastService } from '../../shared/services/toast.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CarritoFavoritoResponse } from './models/carritos-favoritos.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CarritosFavoritosPage', () => {
  let component: CarritosFavoritosPage;
  let fixture: ComponentFixture<CarritosFavoritosPage>;
  let carritosServiceSpy: jasmine.SpyObj<CarritosFavoritosService>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    spyOn(console, 'error');
    carritosServiceSpy = jasmine.createSpyObj('CarritosFavoritosService', ['getCarritosFavoritos', 'deleteCarritoFavorito']);
    carritoServiceSpy = jasmine.createSpyObj('CarritoService', ['agregar']);
    toastSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    (usuarioServiceSpy as any).nombreNavbar = signal('Test User');

    await TestBed.configureTestingModule({
      imports: [CarritosFavoritosPage],
      providers: [
        { provide: CarritosFavoritosService, useValue: carritosServiceSpy },
        { provide: CarritoService, useValue: carritoServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarritosFavoritosPage);
    component = fixture.componentInstance;
  });

  it('debe crearse y setear homeUrl en el constructor', () => {
    expect(component).toBeTruthy();
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/tutor');
  });

  describe('cargarCarritosFavoritos', () => {
    it('debe cargar y agrupar carritos exitosamente', () => {
      const mockData: CarritoFavoritoResponse[] = [
        { id: '1', nombre: 'Desayuno', alumnoId: 'a1', alumnoNombre: 'J', alumnoApellido: 'P', items: [] },
        { id: '2', nombre: 'Almuerzo', alumnoId: 'a2', alumnoNombre: 'Juan', alumnoApellido: 'Perez', items: [] }
      ];
      carritosServiceSpy.getCarritosFavoritos.and.returnValue(of(mockData));

      component.ngOnInit(); // llama a cargarCarritosFavoritos
      expect(component.isLoading).toBeFalse();
      expect(component.carritosFavoritos.length).toBe(2);
      expect(component.gruposHijos.length).toBe(2);
      expect(component.gruposHijos[0].alumnoId).toBe('a1');
      expect(component.gruposHijos[0].carritos.length).toBe(1);
      expect(component.gruposHijos[1].alumnoId).toBe('a2');
      expect(component.gruposHijos[1].carritos.length).toBe(1);
    });

    it('debe manejar el error de carga', () => {
      carritosServiceSpy.getCarritosFavoritos.and.returnValue(throwError(() => new Error('Error')));
      component.cargarCarritosFavoritos();
      
      expect(component.isLoading).toBeFalse();
      expect(toastSpy.mostrar).toHaveBeenCalledWith('Error al cargar los carritos favoritos', 'error');
    });
  });

  describe('cargarAlCarrito', () => {
    it('agrega todos los items y muestra toast', () => {
      const mockCarrito: CarritoFavoritoResponse = {
        id: '1', nombre: 'C1', alumnoId: 'a1', alumnoNombre: 'J', alumnoApellido: 'P',
        items: [{ productId: 'p1', productName: 'Prod1', unitPrice: 100, quantity: 2 }]
      };
      
      component.cargarAlCarrito(mockCarrito);
      expect(carritoServiceSpy.agregar).toHaveBeenCalled();
      expect(toastSpy.mostrar).toHaveBeenCalledWith('Se cargaron los productos del carrito "C1" al carrito de compras', 'success');
    });
  });

  describe('eliminarCarrito', () => {
    it('no hace nada si el usuario cancela confirmacion', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.eliminarCarrito('1');
      expect(carritosServiceSpy.deleteCarritoFavorito).not.toHaveBeenCalled();
    });

    it('llama a eliminar y recarga si el usuario confirma', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      carritosServiceSpy.deleteCarritoFavorito.and.returnValue(of(undefined as any));
      carritosServiceSpy.getCarritosFavoritos.and.returnValue(of([])); // mock de recarga
      
      component.eliminarCarrito('1');
      
      expect(carritosServiceSpy.deleteCarritoFavorito).toHaveBeenCalledWith('1');
      expect(toastSpy.mostrar).toHaveBeenCalledWith('Carrito favorito eliminado', 'success');
      expect(carritosServiceSpy.getCarritosFavoritos).toHaveBeenCalled(); // Se llamo a recargar
    });

    it('maneja el error si falla la eliminacion', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      carritosServiceSpy.deleteCarritoFavorito.and.returnValue(throwError(() => new Error('Error')));
      
      component.eliminarCarrito('1');
      
      expect(toastSpy.mostrar).toHaveBeenCalledWith('Error al eliminar el carrito favorito', 'error');
    });
  });

  describe('modales', () => {
    it('abrirEditarModal mapea items y abre modal', () => {
      const mockCarrito: CarritoFavoritoResponse = {
        id: '1', nombre: 'C1', alumnoId: 'a1', alumnoNombre: 'J', alumnoApellido: 'P',
        items: [{ productId: 'p1', productName: 'Prod1', unitPrice: 100, quantity: 2 }]
      };
      component.abrirEditarModal(mockCarrito);
      expect(component.mostrarModalEditar).toBeTrue();
      expect(component.editarCartId).toBe('1');
      expect(component.editarInitialNombre).toBe('C1');
      expect(component.editarInitialAlumnoId).toBe('a1');
      expect(component.editarItems.length).toBe(1);
    });

    it('cerrarEditarModal resetea variables', () => {
      component.mostrarModalEditar = true;
      component.cerrarEditarModal();
      expect(component.mostrarModalEditar).toBeFalse();
      expect(component.editarCartId).toBeNull();
      expect(component.editarItems.length).toBe(0);
    });
  });

  describe('volver y formatearPrecio', () => {
    it('volver navega a tutor', () => {
      component.volver();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });

    it('formatearPrecio usa intl', () => {
      const res = component.formatearPrecio(1500);
      expect(res.includes('$')).toBeTrue();
    });
  });
});
