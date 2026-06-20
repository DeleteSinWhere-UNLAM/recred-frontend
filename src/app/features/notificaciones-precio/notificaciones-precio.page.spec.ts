import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { NotificacionesPrecioPage } from './notificaciones-precio.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NotificacionesPrecioService } from './services/notificaciones-precio.service';

describe('NotificacionesPrecioPage', () => {
  let component: NotificacionesPrecioPage;
  let fixture: ComponentFixture<NotificacionesPrecioPage>;

  beforeEach(async () => {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: '123' }));

    await TestBed.configureTestingModule({
      imports: [NotificacionesPrecioPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  getUsuarioActual: () => ({ nombre: 'Test' }) , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        },
        { 
          provide: NotificacionesPrecioService, 
          useValue: { getNotificaciones: () => of([]) } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionesPrecioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
