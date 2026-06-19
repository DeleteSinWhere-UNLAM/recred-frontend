import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { PresupuestoPage } from './presupuesto.page';
import { PresupuestoPresenter } from './presenter/presupuesto.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';

describe('PresupuestoPage', () => {
  let component: PresupuestoPage;
  let fixture: ComponentFixture<PresupuestoPage>;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      imports: [PresupuestoPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
        { provide: UsuarioService, useValue: {  homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), nombreNavbar: signal('Test'), esVistaAlumno: signal(false), esVistaKiosquero: signal(false),  getUsuarioActual: () => ({ nombre: 'Test' }) , setNombreNavbar: jasmine.createSpy('setNombreNavbar')} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresupuestoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });
});
