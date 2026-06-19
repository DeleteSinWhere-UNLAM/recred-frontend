import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {  Router , ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { ConfirmarPage } from './confirmar.page';
import { ConfirmarPresenter } from './presenter/confirmar.presenter';
import { UsuarioService } from '../../../data-access/services/usuario.service';

describe('ConfirmarPage', () => {
  let component: ConfirmarPage;
  let fixture: ComponentFixture<ConfirmarPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [ConfirmarPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  nombreNavbar: signal('Test') , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
