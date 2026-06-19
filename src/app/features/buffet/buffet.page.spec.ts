import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { BuffetPage } from './buffet.page';
import { BuffetPresenter } from './presenter/buffet.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';

describe('BuffetPage', () => {
  let component: BuffetPage;
  let fixture: ComponentFixture<BuffetPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [BuffetPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '123' } } }
        },
        {
          provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), esVistaKiosquero: signal(false), 
            nombreNavbar: signal('Test'),
            esVistaAlumno: signal(false),
            setHomeUrl: jasmine.createSpy('setHomeUrl')
          , setNombreNavbar: jasmine.createSpy('setNombreNavbar')}
        },
        {
          provide: PerfilService,
          useValue: { rol: signal('TUTOR') }
        },
        {
          provide: AlumnosService,
          useValue: {
            alumnos: signal([]),
            asegurarCargados: jasmine.createSpy('asegurarCargados').and.resolveTo()
          }
        },
        {
          provide: ColegiosService,
          useValue: { getColegios: signal([]) }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuffetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
