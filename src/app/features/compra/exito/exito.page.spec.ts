import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {  Router , ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { ExitoPage } from './exito.page';
import { ExitoPresenter } from './presenter/exito.presenter';
import { UsuarioService } from '../../../data-access/services/usuario.service';

describe('ExitoPage', () => {
  let component: ExitoPage;
  let fixture: ComponentFixture<ExitoPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [ExitoPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: UsuarioService, useValue: {  esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  nombreNavbar: signal('Test'), homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/') , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExitoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
