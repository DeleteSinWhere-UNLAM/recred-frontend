import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { CarritosFavoritosPage } from './carritos-favoritos.page';
import { CarritosFavoritosService } from './services/carritos-favoritos.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ToastService } from '../../shared/services/toast.service';
import { UsuarioService } from '../../data-access/services/usuario.service';

describe('CarritosFavoritosPage', () => {
  let component: CarritosFavoritosPage;
  let fixture: ComponentFixture<CarritosFavoritosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarritosFavoritosPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: CarritosFavoritosService,
          useValue: { getCarritosFavoritos: () => of([]), deleteCarritoFavorito: () => of(null) }
        },
        { provide: CarritoService, useValue: { agregar: jasmine.createSpy('agregar'), cantidadTotal: signal(0) } },
        { provide: ToastService, useValue: { mostrar: jasmine.createSpy('mostrar') } },
        {
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false), nombreNavbar: signal('Test'), setHomeUrl: jasmine.createSpy('setHomeUrl') , setNombreNavbar: jasmine.createSpy('setNombreNavbar')}
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CarritosFavoritosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
