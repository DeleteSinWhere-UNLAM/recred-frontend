import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FavoritosPage } from './favoritos.page';
import { FavoritosService } from './services/favoritos.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ToastService } from '../../shared/services/toast.service';
import { Producto } from '../buffet/models/producto.model';
import { AlumnosService } from '../../data-access/services/alumnos.service';

describe('FavoritosPage', () => {
  let component: FavoritosPage;
  let fixture: ComponentFixture<FavoritosPage>;
  let router: Router;
  let carritoService: CarritoService;

  let favoritosServiceSpy: jasmine.SpyObj<FavoritosService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockProducto: Producto = {
    id: 'prod-123',
    nombre: 'Alfajor Triple',
    descripcion: 'Alfajor de chocolate triple relleno de dulce de leche',
    precio: 1200,
    categoria: { id: 'kiosco', descripcion: 'Kiosco' },
    clasificacionesSalud: [],
    imagen: '',
    estadoStock: 'DISPONIBLE'
  };

  beforeEach(async () => {
    favoritosServiceSpy = jasmine.createSpyObj<FavoritosService>('FavoritosService', ['getFavoritos', 'removerFavorito']);
    perfilServiceSpy = jasmine.createSpyObj<PerfilService>('PerfilService', ['obtenerAlumnoId']);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    perfilServiceSpy.obtenerAlumnoId.and.returnValue('alumno-123');
    favoritosServiceSpy.getFavoritos.and.returnValue(of([mockProducto]));

    await TestBed.configureTestingModule({
      imports: [FavoritosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: FavoritosService, useValue: favoritosServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: AlumnosService, useValue: {} },
        UsuarioService,
        CarritoService,
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    carritoService = TestBed.inject(CarritoService);
    spyOn(carritoService, 'agregar').and.callThrough();

    fixture = TestBed.createComponent(FavoritosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('recreopago_homeUrl');
    localStorage.removeItem('recreopago_nombreNavbar');
  });

  it('debería crear la página', () => {
    expect(component).toBeTruthy();
    expect(component.alumnoId).toBe('alumno-123');
  });

  it('debería cargar favoritos al iniciar', () => {
    expect(favoritosServiceSpy.getFavoritos).toHaveBeenCalledWith('alumno-123');
    expect(component.favoritos.length).toBe(1);
    expect(component.favoritos[0]).toEqual(mockProducto);
  });

  it('debería renderizar la lista de favoritos en el HTML', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cardTitle = compiled.querySelector('.favoritos-fav-card__nombre');
    expect(cardTitle?.textContent?.trim()).toContain('Alfajor Triple');
  });

  it('debería quitar un producto de favoritos', () => {
    favoritosServiceSpy.removerFavorito.and.returnValue(of(undefined));

    component.quitarFavorito('prod-123');

    expect(favoritosServiceSpy.removerFavorito).toHaveBeenCalledWith('alumno-123', 'prod-123');
    expect(component.favoritos.length).toBe(0);
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Producto quitado de favoritos', 'success');
  });

  it('debería manejar error al intentar quitar un favorito', () => {
    spyOn(console, 'error');
    favoritosServiceSpy.removerFavorito.and.returnValue(throwError(() => new Error('error al remover')));

    component.quitarFavorito('prod-123');

    expect(component.favoritos.length).toBe(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('debería agregar un producto al carrito', () => {
    component.agregarAlCarrito(mockProducto);

    expect(carritoService.agregar).toHaveBeenCalledWith(mockProducto, 'alumno-123', 1);
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se agregó 1x "Alfajor Triple" al carrito');
  });

  it('debería formatear correctamente el precio en pesos argentinos', () => {
    const precioFormateado = component.formatearPrecio(1200);
    const limpio = precioFormateado.replace(/\s/g, ' ');
    expect(limpio).toContain('$');
    expect(limpio).toContain('1.200');
  });

  it('debería navegar hacia atrás al presionar volver', () => {
    component.volver();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/alumno');
  });

  it('debería usar la imagen fallback al ocurrir un error de carga', () => {
    const imgEl = document.createElement('img');
    imgEl.src = 'ruta-invalida.png';
    const event = { target: imgEl } as unknown as Event;

    component.onImagenError(event);

    expect(imgEl.src).toBe(component.IMAGEN_FALLBACK);
  });
});
