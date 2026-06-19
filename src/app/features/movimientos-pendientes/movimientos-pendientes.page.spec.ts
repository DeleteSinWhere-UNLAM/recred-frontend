import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MovimientosPendientesPage } from './movimientos-pendientes.page';
import { MovimientosService } from '../movimientos/services/movimientos.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';

describe('MovimientosPendientesPage', () => {
  let component: MovimientosPendientesPage;
  let fixture: ComponentFixture<MovimientosPendientesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovimientosPendientesPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { paramMap: of({ get: () => '123' }) } 
        },
        { 
          provide: MovimientosService, 
          useValue: { 
            getPendientesAlumno: () => of([]),
            cancelarCompra: () => of(null)
          } 
        },
        { 
          provide: AlumnosService, 
          useValue: { 
            asegurarCargados: () => Promise.resolve(),
            getAlumnoById: () => ({ nombre: 'Juan', apellido: 'Perez' })
          } 
        },
        { 
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  nombreNavbar: signal('Test') , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        },
        { provide: PerfilService, useValue: {} },
        { provide: ToastService, useValue: { mostrar: jasmine.createSpy('mostrar') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MovimientosPendientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
