import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HomeTutorPage } from './home-tutor.page';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';

describe('HomeTutorPage', () => {
  let component: HomeTutorPage;
  let fixture: ComponentFixture<HomeTutorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTutorPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { 
          provide: AlumnosService, 
          useValue: { 
            alumnos: signal([]),
            asegurarCargados: jasmine.createSpy('asegurarCargados').and.resolveTo()
          } 
        },
        { 
          provide: ColegiosService, 
          useValue: { getColegios: () => [] } 
        },
        { 
          provide: PerfilService, 
          useValue: { perfil: signal({ nombre: 'Tutor', apellido: 'Test' }) } 
        },
        { 
          provide: UsuarioService, useValue: { homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  
            getUsuarioActual: () => ({ nombre: 'Test' }),
            setHomeUrl: jasmine.createSpy('setHomeUrl'), setNombreNavbar: jasmine.createSpy('setNombreNavbar')} 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeTutorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
