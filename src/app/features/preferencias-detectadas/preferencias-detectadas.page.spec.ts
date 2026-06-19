import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { PreferenciasDetectadasPage } from './preferencias-detectadas.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PreferenciasDetectadasService } from './services/preferencias-detectadas.service';

describe('PreferenciasDetectadasPage', () => {
  let component: PreferenciasDetectadasPage;
  let fixture: ComponentFixture<PreferenciasDetectadasPage>;

  beforeEach(async () => {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: '123' }));

    await TestBed.configureTestingModule({
      imports: [PreferenciasDetectadasPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  getUsuarioActual: () => ({ nombre: 'Test' }) , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        },
        { 
          provide: PreferenciasDetectadasService, 
          useValue: { getPreferencias: () => of([]) } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciasDetectadasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
