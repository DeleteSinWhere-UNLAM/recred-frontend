import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CarritoPage } from './carrito.page';
import { CarritoPresenter } from './presenter/carrito.presenter';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { ItemCarrito } from '../models/carrito.model';
import { Producto } from '../../buffet/models/producto.model';
import { ActivatedRoute } from '@angular/router';

describe('CarritoPage', () => {
  let component: CarritoPage;
  let fixture: ComponentFixture<CarritoPage>;
  let mockPresenter: jasmine.SpyObj<CarritoPresenter>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('CarritoPresenter', ['init'], {
      grupos: signal([
        {
          alumno: { id: 'a1', nombre: 'Juan', apellido: 'Perez' },
          subtotal: 1500,
          seleccionado: true
        }
      ])
    });

    const mockUsuarioService = {
      nombreNavbar: signal('Test User'),
      esVistaAlumno: signal(false)
    };

    await TestBed.configureTestingModule({
      imports: [CarritoPage],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
    .overrideComponent(CarritoPage, {
      set: {
        providers: [
          { provide: CarritoPresenter, useValue: mockPresenter }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarritoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse e inicializar el presenter en ngOnInit', () => {
    expect(component).toBeTruthy();
    expect(mockPresenter.init).toHaveBeenCalled();
  });

  it('debe calcular lineasResumen correctamente', () => {
    // El compued se calcula dinamicamente, hay que leerlo
    const lineas = component['lineasResumen']();
    expect(lineas.length).toBe(1);
    expect(lineas[0].alumnoId).toBe('a1');
    expect(lineas[0].nombre).toBe('Juan Perez');
    expect(lineas[0].subtotal).toBe(1500);
    expect(lineas[0].incluido).toBe(true);
  });

  it('debe abrir modal favorito y mapear items', () => {
    const mockItems: ItemCarrito[] = [
      { producto: { id: 'p1', nombre: 'Coca Cola', precio: 500 } as Producto, cantidad: 2 }
    ] as ItemCarrito[];

    component.abrirModalFavorito('a1', mockItems);

    expect(component.mostrarModalFavorito).toBeTrue();
    expect(component.favoritoModalAlumnoId).toBe('a1');
    expect(component.favoritoModalItems.length).toBe(1);
    expect(component.favoritoModalItems[0].productId).toBe('p1');
    expect(component.favoritoModalItems[0].productName).toBe('Coca Cola');
    expect(component.favoritoModalItems[0].price).toBe(500);
    expect(component.favoritoModalItems[0].quantity).toBe(2);
  });

  it('debe cerrar modal favorito', () => {
    component.mostrarModalFavorito = true;
    component.favoritoModalAlumnoId = 'a1';
    component.favoritoModalItems = [{ productId: 'p1', productName: 'Prod', price: 10, quantity: 1 }];

    component.cerrarModalFavorito();

    expect(component.mostrarModalFavorito).toBeFalse();
    expect(component.favoritoModalAlumnoId).toBe('');
    expect(component.favoritoModalItems.length).toBe(0);
  });
});
