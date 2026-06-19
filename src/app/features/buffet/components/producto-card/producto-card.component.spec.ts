import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductoCardComponent } from './producto-card.component';
import { CarritoService } from '../../../compra/services/carrito.service';
import { Producto } from '../../models/producto.model';
import { By } from '@angular/platform-browser';

describe('ProductoCardComponent', () => {
  let component: ProductoCardComponent;
  let fixture: ComponentFixture<ProductoCardComponent>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let mockProducto: Producto;

  beforeEach(async () => {
    carritoServiceSpy = jasmine.createSpyObj('CarritoService', [
      'validarAgregar',
      'puedeAgregar',
      'cantidadDe'
    ]);

    await TestBed.configureTestingModule({
      imports: [ProductoCardComponent],
      providers: [
        { provide: CarritoService, useValue: carritoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoCardComponent);
    component = fixture.componentInstance;
    
    mockProducto = {
      id: 'p1',
      nombre: 'Test Prod',
      descripcion: 'Desc',
      precio: 100,
      categoria: { id: 'c1', descripcion: 'Cat' },
      clasificacionesSalud: [],
      imagen: 'img.png',
      estadoStock: 'DISPONIBLE'
    };
  });

  it('debería crearse y setear producto inicializando cantidad a 1', () => {
    component.producto = mockProducto;
    component.alumnoId = 'a1';
    expect(component).toBeTruthy();
    expect(component['cantidad']()).toBe(1);
    expect(component.productoActual()).toEqual(mockProducto);
  });

  describe('Outputs y Eventos', () => {
    beforeEach(() => {
      component.producto = mockProducto;
      component.alumnoId = 'a1';
    });

    it('debería emitir toggleFavorito deteniendo propagación', () => {
      const eventMock = new Event('click');
      spyOn(eventMock, 'stopPropagation');
      spyOn(component.toggleFavorito, 'emit');

      component['onToggleFavorito'](eventMock);

      expect(eventMock.stopPropagation).toHaveBeenCalled();
      expect(component.toggleFavorito.emit).toHaveBeenCalledWith(mockProducto);
    });

    it('no debería emitir toggleFavorito si no hay producto', () => {
      component['productoState'].set(undefined);
      spyOn(component.toggleFavorito, 'emit');
      component['onToggleFavorito'](new Event('click'));
      expect(component.toggleFavorito.emit).not.toHaveBeenCalled();
    });

    it('debería emitir toggleLock deteniendo propagación', () => {
      const eventMock = new Event('click');
      spyOn(eventMock, 'stopPropagation');
      spyOn(component.toggleLock, 'emit');

      component['onToggleLock'](eventMock);

      expect(eventMock.stopPropagation).toHaveBeenCalled();
      expect(component.toggleLock.emit).toHaveBeenCalledWith(mockProducto);
    });

    it('no debería emitir toggleLock si no hay producto', () => {
      component['productoState'].set(undefined);
      spyOn(component.toggleLock, 'emit');
      component['onToggleLock'](new Event('click'));
      expect(component.toggleLock.emit).not.toHaveBeenCalled();
    });

    it('debería sumar y restar cantidad correctamente', () => {
      component['sumar']();
      expect(component['cantidad']()).toBe(2);
      component['restar']();
      expect(component['cantidad']()).toBe(1);
      component['restar'](); // No baja de 1
      expect(component['cantidad']()).toBe(1);
    });

    it('debería emitir agregar y resetear cantidad', () => {
      spyOn(component.agregar, 'emit');
      component['cantidad'].set(3);
      component['onAgregar']();
      expect(component.agregar.emit).toHaveBeenCalledWith({ producto: mockProducto, cantidad: 3 });
      expect(component['cantidad']()).toBe(1);
    });

    it('no debería emitir agregar si el producto no está disponible', () => {
      spyOn(component.agregar, 'emit');
      component.producto = { ...mockProducto, estadoStock: 'SIN_STOCK' };
      component['onAgregar']();
      expect(component.agregar.emit).not.toHaveBeenCalled();
    });
  });

  describe('Propiedades Computadas', () => {
    it('debería calcular disponible correctamente', () => {
      // Sin producto
      expect(component.disponible()).toBeFalse();

      component.producto = mockProducto;
      component.alumnoId = 'a1';
      carritoServiceSpy.puedeAgregar.and.returnValue(true);
      
      // Producto normal
      expect(component.disponible()).toBeTrue();
      
      // Bloqueado
      component.producto = { ...mockProducto, bloqueado: true };
      expect(component.disponible()).toBeFalse();
      
      // Bloqueado por restricción
      component.producto = { ...mockProducto, bloqueadoPorRestriccion: true };
      expect(component.disponible()).toBeFalse();

      // Supera presupuesto unitario
      component.producto = mockProducto;
      carritoServiceSpy.puedeAgregar.and.returnValue(false);
      expect(component.disponible()).toBeFalse();
    });

    it('debería calcular bloqueadoPorRestriccion', () => {
      expect(component.bloqueadoPorRestriccion()).toBeFalse();
      component.producto = { ...mockProducto, bloqueadoPorRestriccion: true };
      expect(component.bloqueadoPorRestriccion()).toBeTrue();
    });

    it('debería formatear precio', () => {
      expect(component.precioFormateado()).toBe('');
      component.producto = mockProducto;
      expect(component.precioFormateado()).toContain('100'); // depende del Intl locale pero tendrá '100'
    });

    it('debería devolver cantidadEnCarrito', () => {
      expect(component.cantidadEnCarrito()).toBe(0);
      component.producto = mockProducto;
      component.alumnoId = 'a1';
      carritoServiceSpy.cantidadDe.and.returnValue(2);
      expect(component.cantidadEnCarrito()).toBe(2);
      expect(component.estaEnCarrito()).toBeTrue();
    });

    it('debería calcular superarPresupuesto y superaSaldo basados en razonRechazo', () => {
      component.producto = mockProducto;
      component.alumnoId = 'a1';

      carritoServiceSpy.validarAgregar.and.returnValue({ permitido: false, razon: 'presupuesto' });
      expect(component.superaPresupuesto()).toBeTrue();
      expect(component.superaSaldo()).toBeFalse();

      carritoServiceSpy.validarAgregar.and.returnValue({ permitido: false, razon: 'categoria' });
      expect(component.superaPresupuesto()).toBeTrue();

      carritoServiceSpy.validarAgregar.and.returnValue({ permitido: false, razon: 'saldo' });
      expect(component.superaPresupuesto()).toBeFalse();
      expect(component.superaSaldo()).toBeTrue();

      carritoServiceSpy.validarAgregar.and.returnValue({ permitido: true });
      expect(component.superaPresupuesto()).toBeFalse();
      expect(component.superaSaldo()).toBeFalse();
      expect(component.razonRechazo()).toBeNull();
    });

    it('debería calcular deshabilitarSumar', () => {
      expect(component.deshabilitarSumar()).toBeTrue(); // por no tener params
      component.producto = mockProducto;
      component.alumnoId = 'a1';
      
      carritoServiceSpy.puedeAgregar.and.returnValue(false);
      expect(component.deshabilitarSumar()).toBeTrue();
      
      carritoServiceSpy.puedeAgregar.and.returnValue(true);
      expect(component.deshabilitarSumar()).toBeFalse();
    });

    it('debería formatear mensajeRestriccion', () => {
      expect(component.mensajeRestriccion()).toBe('No apto'); // sin producto
      
      component.producto = { ...mockProducto, motivoBloqueo: 'Contiene: Gluten (TACC), Lácteos' };
      expect(component.mensajeRestriccion()).toBe('No apto: Contiene TACC · Contiene Lácteos');

      component.producto = { ...mockProducto, motivoBloqueo: 'Contiene: Azúcar, Alto Sodio, Ingredientes de origen animal, Otro' };
      expect(component.mensajeRestriccion()).toBe('No apto: Contiene Azúcar · Contiene Sodio · No Vegano · Otro');
    });
  });

  describe('Imagen Fallback', () => {
    it('debería cambiar src en onImagenError a fallback svg', () => {
      const img = document.createElement('img');
      img.src = 'http://badurl';
      const eventMock = { target: img } as unknown as Event;
      
      component['onImagenError'](eventMock);
      expect(img.src).toContain('data:image/svg+xml');

      // Si ya es fallback no hace nada
      const svgSrc = img.src;
      img.src = svgSrc;
      component['onImagenError'](eventMock);
      expect(img.src).toBe(svgSrc);
    });
  });
});
