import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { HomeAlumnoPage } from './home-alumno.page';
import { HomeAlumnoPresenter } from './presenter/home-alumno.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';

describe('HomeAlumnoPage', () => {
  let component: HomeAlumnoPage;
  let fixture: ComponentFixture<HomeAlumnoPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [HomeAlumnoPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: UsuarioService, useValue: { homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  
            setHomeUrl: jasmine.createSpy('setHomeUrl'), setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeAlumnoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
