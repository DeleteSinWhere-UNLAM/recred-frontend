import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {  Router , ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { PerfilUsuarioPage } from './perfil-usuario.page';
import { PerfilUsuarioService } from '../../data-access/services/perfil-usuario.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';

describe('PerfilUsuarioPage', () => {
  let component: PerfilUsuarioPage;
  let fixture: ComponentFixture<PerfilUsuarioPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilUsuarioPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: PerfilUsuarioService, 
          useValue: { 
            obtenerUsuarioLogueado: jasmine.createSpy('obtenerUsuarioLogueado').and.resolveTo({}),
            obtenerPerfil: jasmine.createSpy('obtenerPerfil').and.resolveTo({})
          } 
        },
        { 
          provide: UsuarioService, useValue: { homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), esVistaKiosquero: signal(false),  
            esVistaAlumno: signal(false),
            nombreNavbar: signal('Test'), setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        },
        { provide: ToastService, useValue: { mostrar: jasmine.createSpy('mostrar') } },
        
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
