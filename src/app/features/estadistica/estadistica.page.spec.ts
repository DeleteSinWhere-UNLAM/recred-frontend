import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { EstadisticaPage } from './estadistica.page';
import { EstadisticaPresenter } from './presenter/estadistica.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';

describe('EstadisticaPage', () => {
  let component: EstadisticaPage;
  let fixture: ComponentFixture<EstadisticaPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [EstadisticaPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '123' } } }
        },
        { 
          provide: UsuarioService, useValue: { setNombreNavbar: jasmine.createSpy('setNombreNavbar'), homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  getUsuarioActual: () => ({ nombre: 'Test' }), getAlumnoActual: () => 'alumno-123' } 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstadisticaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
