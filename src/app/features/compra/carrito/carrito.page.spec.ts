import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { CarritoPage } from './carrito.page';
import { CarritoPresenter } from './presenter/carrito.presenter';
import { UsuarioService } from '../../../data-access/services/usuario.service';

describe('CarritoPage', () => {
  let component: CarritoPage;
  let fixture: ComponentFixture<CarritoPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [CarritoPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), esVistaKiosquero: signal(false),  nombreNavbar: signal('Test'), esVistaAlumno: signal(false) , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarritoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
