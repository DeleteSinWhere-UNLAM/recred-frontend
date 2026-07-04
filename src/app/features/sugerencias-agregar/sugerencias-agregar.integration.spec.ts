import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SugerenciasAgregarService } from './services/sugerencias-agregar.service';
import {
  SugerenciaAgregarProductoMother,
  UsuarioMother,
} from './sugerencias-agregar.mother';
import { SugerenciasAgregarPage } from './sugerencias-agregar.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

describe('SugerenciasAgregar Integration', () => {
  let fixture: ComponentFixture<SugerenciasAgregarPage>;
  let servicioSugerencias: jasmine.SpyObj<SugerenciasAgregarService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioSugerencias = jasmine.createSpyObj<SugerenciasAgregarService>(
      'SugerenciasAgregarService',
      ['getSugerenciasAgregarProducto'],
    );
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
    ]);
    servicioUsuario.getUsuarioActual.and.returnValue(UsuarioMother.crear());
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(UsuarioMother.crear()));

    await TestBed.configureTestingModule({
      imports: [SugerenciasAgregarPage],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigateByUrl']) },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: SugerenciasAgregarService, useValue: servicioSugerencias },
      ],
    })
      .overrideComponent(SugerenciasAgregarPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('dadas tres sugerencias, cuando se monta la page, deberia renderizar las oportunidades y el total de ingresos', () => {
    servicioSugerencias.getSugerenciasAgregarProducto.and.returnValue(
      of(SugerenciaAgregarProductoMother.crearVarias()),
    );

    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('h1').textContent;
    const tarjetas = fixture.debugElement.queryAll(By.css('.sa__product-card'));
    const tituloPrimeraTarjeta = tarjetas[0]
      .query(By.css('.sa__card-title strong'))
      .nativeElement.textContent;
    const totalIngresos = fixture.nativeElement.querySelector('.sa__metric--warning strong')
      .textContent;

    expect(titulo).toContain('Oportunidades de Stock');
    expect(tarjetas.length).toBe(3);
    expect(tituloPrimeraTarjeta).toContain('Prod C');
    expect(totalIngresos).toContain('$4.000');
  });

  it('dado que falla el service, cuando se monta la page, deberia mostrar el panel de error', () => {
    servicioSugerencias.getSugerenciasAgregarProducto.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    fixture.detectChanges();

    const panelError = fixture.nativeElement.querySelector('.sa__notice--error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('No se pudieron cargar las oportunidades de stock.');
  });

  it('dado que no hay sugerencias, cuando se monta la page, deberia mostrar el empty state', () => {
    servicioSugerencias.getSugerenciasAgregarProducto.and.returnValue(of([]));

    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.sa__empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Sin oportunidades por ahora');
  });
});
