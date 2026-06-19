import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HomeKiosqueroPage } from './home-kiosquero.page';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';

describe('HomeKiosqueroPage', () => {
  let component: HomeKiosqueroPage;
  let fixture: ComponentFixture<HomeKiosqueroPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [HomeKiosqueroPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  setHomeUrl: jasmine.createSpy('setHomeUrl') , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeKiosqueroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
