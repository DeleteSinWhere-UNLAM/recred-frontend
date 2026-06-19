import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {  Router , ActivatedRoute } from '@angular/router';
import { KiosqueroReportesPage } from './kiosquero-reportes.page';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';

describe('KiosqueroReportesPage', () => {
  let component: KiosqueroReportesPage;
  let fixture: ComponentFixture<KiosqueroReportesPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [KiosqueroReportesPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  setHomeUrl: jasmine.createSpy('setHomeUrl') , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KiosqueroReportesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
